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

    // 取消预约
    async cancelAppointment(id: string) {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', id);

        if (error) throw error;
    },

    // 检查医生某天的预约情况 (用于判断 slot 是否已满)
    async getDoctorAppointmentsByDate(doctorId: string, date: string) {
        const { data, error } = await supabase
            .from('appointments')
            .select('appointment_time')
            .eq('doctor_id', doctorId)
            .eq('appointment_date', date)
            .neq('status', 'cancelled');

        if (error) throw error;
        return data;
    }
};
