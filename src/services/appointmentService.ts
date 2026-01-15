import { supabase } from './supabaseClient';

export interface Appointment {
    id: string; // UUID from DB
    doctorId: string;
    doctorName: string; // Derived from doctor_id
    image: string; // Derived from doctor_id
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
    service: string;
    pet: string; // Pet name
    cost?: number;
}

export const appointmentService = {
    // 创建预约（包含积分扣除）
    async createAppointment(appointmentData: {
        userId: string;
        doctorId: string;
        petId: string;
        petName: string;
        date: string;
        time: string;
        service: string;
        cost: number;
    }) {
        // 1. 先获取用户当前积分
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('points')
            .eq('id', appointmentData.userId)
            .single();

        if (userError) throw userError;

        const currentPoints = userData.points || 0;
        if (currentPoints < appointmentData.cost) {
            throw new Error('积分不足');
        }

        // 2. 创建预约记录
        const { data, error } = await supabase
            .from('appointments')
            .insert([
                {
                    user_id: appointmentData.userId,
                    doctor_id: appointmentData.doctorId,
                    pet_id: appointmentData.petId,
                    pet_name: appointmentData.petName,
                    appointment_date: appointmentData.date,
                    appointment_time: appointmentData.time,
                    service: appointmentData.service,
                    cost: appointmentData.cost,
                    status: 'upcoming'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // 3. 扣除用户积分
        const newPoints = currentPoints - appointmentData.cost;
        const { error: updateError } = await supabase
            .from('users')
            .update({ points: newPoints })
            .eq('id', appointmentData.userId);

        if (updateError) {
            console.error('扣除积分失败:', updateError);
            // 预约已创建，但积分扣除失败，记录错误但不回滚
        }

        // 4. 记录积分历史
        await supabase.from('point_history').insert([{
            user_id: appointmentData.userId,
            title: '预约医生',
            description: `预约服务: ${appointmentData.service}`,
            type: 'consume',
            amount: -appointmentData.cost,
            points: -appointmentData.cost,
            transaction_date: new Date().toISOString().split('T')[0]
        }]);

        return data;
    },

    // 获取用户的所有预约
    async getUserAppointments(userId: string): Promise<Appointment[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
        id,
        doctor_id,
        appointment_date,
        appointment_time,
        status,
        service,
        cost,
        pet_name,
        doctors (
          name,
          image_url
        )
      `)
            .eq('user_id', userId)
            .order('appointment_date', { ascending: false });

        if (error) {
            console.error('Error fetching user appointments:', error);
            throw error;
        }

        // 转换数据格式匹配前端
        return data.map((apt: any) => ({
            id: apt.id, // 这里返回 UUID，前端需要处理 ID 类型差异 (number vs string)
            doctorId: apt.doctor_id,
            doctorName: apt.doctors?.name || 'Unknown Doctor',
            image: apt.doctors?.image_url || '',
            date: apt.appointment_date, // 假设格式即为 YYYY-MM-DD 或需要格式化
            time: apt.appointment_time, // HH:mm:ss -> HH:mm
            status: apt.status,
            service: apt.service,
            pet: apt.pet_name,
            cost: apt.cost
        }));
    },

    // 取消预约（返还积分）
    async cancelAppointment(id: string, userId?: string) {
        // 1. 获取预约信息
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select('cost, user_id, status, service')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 只有 upcoming 状态的预约可以取消
        if (appointment.status !== 'upcoming') {
            throw new Error('只能取消预约中的订单');
        }

        const cost = appointment.cost || 0;
        const appointmentUserId = userId || appointment.user_id;

        // 2. 更新预约状态为取消
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', id);

        if (error) throw error;

        // 3. 返还积分
        if (cost > 0) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('points')
                .eq('id', appointmentUserId)
                .single();

            if (!userError && userData) {
                const newPoints = (userData.points || 0) + cost;
                await supabase
                    .from('users')
                    .update({ points: newPoints })
                    .eq('id', appointmentUserId);

                // 4. 记录积分历史
                await supabase.from('point_history').insert([{
                    user_id: appointmentUserId,
                    title: '取消预约退款',
                    description: `取消服务: ${appointment.service}`,
                    type: 'refund',
                    amount: cost,
                    points: cost,
                    transaction_date: new Date().toISOString().split('T')[0]
                }]);
            }
        }

        return { refundedPoints: cost };
    },

    // 管理员更新预约状态
    async updateAppointmentStatus(id: string, status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled', options?: {
        startTime?: string;  // 进行中开始时间
        endTime?: string;    // 进行中结束时间
        adminNote?: string;  // 管理员备注
    }) {
        const updateData: any = { status };
        
        if (options?.startTime) updateData.start_time = options.startTime;
        if (options?.endTime) updateData.end_time = options.endTime;
        if (options?.adminNote) updateData.admin_note = options.adminNote;

        const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 获取预约详情
    async getAppointmentById(id: string) {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                users (id, name, email),
                doctors (id, name, title, image_url),
                pets (id, name, breed)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // 检查医生某天的预约情况 (用于判断 slot 是否已满)
    async getDoctorAppointmentsByDate(doctorId: string, date: string) {
        const { data, error } = await supabase
            .from('appointments')
            .select('appointment_time, status, start_time, end_time')
            .eq('doctor_id', doctorId)
            .eq('appointment_date', date)
            .in('status', ['upcoming', 'in_progress']);

        if (error) throw error;
        return data;
    },

    // 检查时间段是否与进行中的预约冲突
    async checkTimeConflict(doctorId: string, date: string, time: string): Promise<{ hasConflict: boolean; message?: string }> {
        const { data, error } = await supabase
            .from('appointments')
            .select('start_time, end_time, status')
            .eq('doctor_id', doctorId)
            .eq('appointment_date', date)
            .eq('status', 'in_progress');

        if (error) throw error;

        if (!data || data.length === 0) {
            return { hasConflict: false };
        }

        // 将时间字符串转换为分钟数进行比较
        const timeToMinutes = (t: string): number => {
            const [h, m] = t.slice(0, 5).split(':').map(Number);
            return h * 60 + m;
        };

        const requestedMinutes = timeToMinutes(time);

        for (const apt of data) {
            if (apt.start_time && apt.end_time) {
                const startMinutes = timeToMinutes(String(apt.start_time));
                const endMinutes = timeToMinutes(String(apt.end_time));

                // 检查请求时间是否在进行中的时间段内
                if (requestedMinutes >= startMinutes && requestedMinutes < endMinutes) {
                    return {
                        hasConflict: true,
                        message: `该时间段医生正在进行服务中（${String(apt.start_time).slice(0, 5)} - ${String(apt.end_time).slice(0, 5)}）`
                    };
                }
            }
        }

        return { hasConflict: false };
    },

    // 获取医生某天所有被占用的时间段
    async getBlockedTimeSlots(doctorId: string, date: string): Promise<{ time: string; reason: string }[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select('appointment_time, status, start_time, end_time')
            .eq('doctor_id', doctorId)
            .eq('appointment_date', date)
            .in('status', ['upcoming', 'in_progress']);

        if (error) throw error;

        const blocked: { time: string; reason: string }[] = [];

        for (const apt of data || []) {
            // 预约中的时间点
            if (apt.status === 'upcoming') {
                blocked.push({
                    time: String(apt.appointment_time).slice(0, 5),
                    reason: '已被预约'
                });
            }
            
            // 进行中的时间段
            if (apt.status === 'in_progress' && apt.start_time && apt.end_time) {
                const startMinutes = this.timeToMinutes(String(apt.start_time));
                const endMinutes = this.timeToMinutes(String(apt.end_time));
                
                // 生成这个时间段内所有的半小时时间点
                for (let m = startMinutes; m < endMinutes; m += 30) {
                    const hours = Math.floor(m / 60);
                    const mins = m % 60;
                    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                    blocked.push({
                        time: timeStr,
                        reason: '医生服务中'
                    });
                }
            }
        }

        return blocked;
    },

    // 辅助函数：时间转分钟
    timeToMinutes(t: string): number {
        const [h, m] = t.slice(0, 5).split(':').map(Number);
        return h * 60 + m;
    }
};
