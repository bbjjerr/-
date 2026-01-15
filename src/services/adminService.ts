import { supabase } from './supabaseClient';

export type AdminStats = {
  users: number;
  doctors: number;
  appointments: number;
  chats: number;
  messages: number;
  redeemCodes: number;
};

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  points: number;
  is_admin?: boolean;
  created_at?: string;
};

export type AdminDoctorRow = {
  id: string;
  name: string;
  title: string;
  rating: number;
  image_url: string;
  tags: string[];
  price: number;
  satisfaction?: string;
  created_at?: string;
};

export type AdminRedeemCodeRow = {
  id: string;
  code: string;
  points: number;
  is_active: boolean;
  max_uses: number;
  current_uses: number;
  created_at?: string;
};

export type MemberLevelRow = {
  id: string;
  level_order: number;
  name: string;
  min_points: number;
  max_points: number | null;
  icon: string;
  color_from: string;
  color_to: string;
  card_bg: string;
  created_at?: string;
  updated_at?: string;
};

export type AdminAppointmentRow = {
  id: string;
  user_id?: string;
  doctor_id?: string;
  pet_id?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  cost: number;
  pet_name: string;
  service?: string;
  start_time?: string;
  end_time?: string;
  admin_note?: string;
  completed_at?: string;
  users?: { name: string; email: string } | null;
  doctors?: { name: string; image_url?: string } | null;
  pets?: { name: string; breed: string } | null;
};

export type AdminPetRow = {
  id: string;
  user_id: string;
  name: string;
  breed: string;
  pet_type: 'dog' | 'cat';
  gender: 'male' | 'female';
  age: number;
  weight: number;
  description?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
  medical_records?: MedicalRecord[] | null;
  created_at?: string;
};

export type MedicalRecord = {
  title: string;
  subtitle: string;
  date?: string;
  icon?: string;
  color?: string;
};

type EmbeddedOne<T> = T | T[] | null | undefined;

function pickEmbeddedOne<T>(value: EmbeddedOne<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function count(table: string): Promise<number> {
  const { count: c, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return c || 0;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const [users, doctors, appointments, chats, messages, redeemCodes] = await Promise.all([
      count('users'),
      count('doctors'),
      count('appointments'),
      count('chats'),
      count('messages'),
      count('redeem_codes')
    ]);

    return { users, doctors, appointments, chats, messages, redeemCodes };
  },

  async listUsers(limit = 50): Promise<AdminUserRow[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id,email,name,points,is_admin,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AdminUserRow[];
  },

  async listDoctors(limit = 50): Promise<AdminDoctorRow[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select('id,name,title,rating,image_url,tags,price,satisfaction,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AdminDoctorRow[];
  },

  async upsertDoctor(input: Partial<AdminDoctorRow> & Pick<AdminDoctorRow, 'name' | 'title' | 'image_url'>) {
    const payload = {
      id: input.id,
      name: input.name,
      title: input.title,
      rating: input.rating ?? 5.0,
      image_url: input.image_url,
      tags: input.tags ?? [],
      price: input.price ?? 200,
      satisfaction: input.satisfaction ?? '98%'
    };

    const { data, error } = await supabase.from('doctors').upsert(payload).select().single();
    if (error) throw error;
    return data as AdminDoctorRow;
  },

  async deleteDoctor(id: string) {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;
  },

  async listRedeemCodes(limit = 50): Promise<AdminRedeemCodeRow[]> {
    const { data, error } = await supabase
      .from('redeem_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AdminRedeemCodeRow[];
  },

  async upsertRedeemCode(input: Partial<AdminRedeemCodeRow> & Pick<AdminRedeemCodeRow, 'code' | 'points'>) {
    const payload = {
      id: input.id,
      code: input.code,
      points: input.points,
      is_active: input.is_active ?? true,
      max_uses: input.max_uses ?? 1,
      current_uses: input.current_uses ?? 0
    };

    const { data, error } = await supabase.from('redeem_codes').upsert(payload).select().single();
    if (error) throw error;
    return data as AdminRedeemCodeRow;
  },

  async listAppointments(limit = 50): Promise<AdminAppointmentRow[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(
        `id,user_id,doctor_id,pet_id,appointment_date,appointment_time,status,cost,pet_name,service,start_time,end_time,admin_note,completed_at,
         users(name,email),
         doctors(name,image_url),
         pets(name,breed)`
      )
      .order('appointment_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = (data || []) as unknown as Array<
      Omit<AdminAppointmentRow, 'users' | 'doctors' | 'pets'> & {
        users?: EmbeddedOne<{ name: string; email: string }>;
        doctors?: EmbeddedOne<{ name: string; image_url?: string }>;
        pets?: EmbeddedOne<{ name: string; breed: string }>;
      }
    >;

    return rows.map((r) => ({
      ...r,
      users: pickEmbeddedOne(r.users),
      doctors: pickEmbeddedOne(r.doctors),
      pets: pickEmbeddedOne(r.pets)
    }));
  },

  // 获取单个预约详情
  async getAppointmentDetail(id: string): Promise<AdminAppointmentRow | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select(
        `id,user_id,doctor_id,pet_id,appointment_date,appointment_time,status,cost,pet_name,service,start_time,end_time,admin_note,completed_at,
         users(name,email),
         doctors(name,image_url),
         pets(name,breed)`
      )
      .eq('id', id)
      .single();

    if (error) return null;

    const r = data as any;
    return {
      ...r,
      users: pickEmbeddedOne(r.users),
      doctors: pickEmbeddedOne(r.doctors),
      pets: pickEmbeddedOne(r.pets)
    };
  },

  // 管理员取消预约（返还积分）
  async cancelAppointment(id: string): Promise<{ refundedPoints: number }> {
    // 获取预约信息
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('cost, user_id, status, service')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (appointment.status !== 'upcoming') {
      throw new Error('只能取消预约中的订单');
    }

    const cost = appointment.cost || 0;

    // 更新状态
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', admin_note: '管理员取消' })
      .eq('id', id);

    if (error) throw error;

    // 返还积分
    if (cost > 0) {
      const { data: userData } = await supabase
        .from('users')
        .select('points')
        .eq('id', appointment.user_id)
        .single();

      if (userData) {
        const newPoints = (userData.points || 0) + cost;
        await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', appointment.user_id);

        await supabase.from('point_history').insert([{
          user_id: appointment.user_id,
          title: '管理员取消预约退款',
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

  // 管理员设置预约为进行中
  async setAppointmentInProgress(id: string, startTime: string, endTime: string): Promise<AdminAppointmentRow> {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'in_progress',
        start_time: startTime,
        end_time: endTime
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminAppointmentRow;
  },

  // 管理员完成预约
  async completeAppointment(id: string, note?: string): Promise<AdminAppointmentRow> {
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('pet_id, pet_name, service, doctor_id, doctors(name)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 更新预约状态
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        admin_note: note
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 如果有 pet_id，添加就诊记录到宠物的 medical_records
    if (appointment.pet_id) {
      const { data: petData } = await supabase
        .from('pets')
        .select('medical_records')
        .eq('id', appointment.pet_id)
        .single();

      const existingRecords = petData?.medical_records || [];
      const doctorName = (appointment.doctors as any)?.name || '医生';
      
      const newRecord = {
        title: appointment.service || '宠物全检',
        subtitle: `${doctorName} · ${note || '已完成'}`,
        date: new Date().toISOString().split('T')[0],
        icon: 'ecg_heart',
        color: 'green'
      };

      await supabase
        .from('pets')
        .update({
          medical_records: [...existingRecords, newRecord]
        })
        .eq('id', appointment.pet_id);
    }

    return data as AdminAppointmentRow;
  },

  async listPetsByUser(userId: string, limit = 50): Promise<AdminPetRow[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('id,user_id,name,breed,pet_type,gender,age,weight,description,image_url,avatar_url,medical_records,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AdminPetRow[];
  },

  async createPetForUser(input: {
    userId: string;
    name: string;
    breed: string;
    pet_type: 'dog' | 'cat';
    gender: 'male' | 'female';
    age: number;
    weight: number;
    description?: string;
    image_url?: string;
    medical_records?: MedicalRecord[];
  }) {
    const payload = {
      user_id: input.userId,
      name: input.name,
      breed: input.breed,
      pet_type: input.pet_type,
      gender: input.gender,
      age: input.age,
      weight: input.weight,
      description: input.description || null,
      image_url: input.image_url || null,
      avatar_url: input.image_url || null,
      medical_records: input.medical_records || null
    };

    const { data, error } = await supabase.from('pets').insert([payload]).select().single();
    if (error) throw error;
    return data as AdminPetRow;
  },

  async deletePet(id: string) {
    const { error } = await supabase.from('pets').delete().eq('id', id);
    if (error) throw error;
  },

  // 上传宠物图片到 Supabase Storage
  async uploadPetImage(file: File, petId?: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${petId || Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `pets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('pet-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('pet-images').getPublicUrl(filePath);
    return data.publicUrl;
  },

  // 更新宠物信息（用于更新图片等）
  async updatePet(petId: string, updates: Partial<AdminPetRow>) {
    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', petId)
      .select()
      .single();

    if (error) throw error;
    return data as AdminPetRow;
  },

  // =============================================
  // 用户积分管理
  // =============================================
  
  // 更新用户积分（增加或减少）
  async updateUserPoints(userId: string, pointsDelta: number, reason?: string) {
    // 先获取当前积分
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const newPoints = Math.max(0, (user.points || 0) + pointsDelta);
    
    // 更新积分
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // 记录积分变动历史
    if (pointsDelta !== 0) {
      await supabase.from('point_history').insert([{
        user_id: userId,
        amount: pointsDelta,
        type: pointsDelta > 0 ? 'admin_add' : 'admin_deduct',
        description: reason || (pointsDelta > 0 ? '管理员添加积分' : '管理员扣除积分')
      }]);
    }

    return data as AdminUserRow;
  },

  // 设置用户积分（直接设置为指定值）
  async setUserPoints(userId: string, points: number, reason?: string) {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const pointsDelta = points - (user.points || 0);
    
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ points: Math.max(0, points) })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // 记录积分变动历史
    if (pointsDelta !== 0) {
      await supabase.from('point_history').insert([{
        user_id: userId,
        amount: pointsDelta,
        type: 'admin_set',
        description: reason || `管理员设置积分为 ${points}`
      }]);
    }

    return data as AdminUserRow;
  },

  // 更新兑换码（包括使用次数限制）
  async updateRedeemCode(codeId: string, updates: Partial<AdminRedeemCodeRow>) {
    const { data, error } = await supabase
      .from('redeem_codes')
      .update(updates)
      .eq('id', codeId)
      .select()
      .single();

    if (error) throw error;
    return data as AdminRedeemCodeRow;
  },

  // 删除兑换码
  async deleteRedeemCode(codeId: string) {
    const { error } = await supabase
      .from('redeem_codes')
      .delete()
      .eq('id', codeId);

    if (error) throw error;
  },

  // ==================== 会员等级管理 ====================

  // 获取所有会员等级配置
  async listMemberLevels(): Promise<MemberLevelRow[]> {
    const { data, error } = await supabase
      .from('member_levels')
      .select('*')
      .order('level_order', { ascending: true });

    if (error) throw error;
    return (data || []) as MemberLevelRow[];
  },

  // 更新会员等级配置
  async updateMemberLevel(id: string, updates: Partial<MemberLevelRow>): Promise<MemberLevelRow> {
    const { data, error } = await supabase
      .from('member_levels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MemberLevelRow;
  },

  // 批量更新会员等级（用于调整积分范围）
  async updateMemberLevels(levels: Array<{ id: string; min_points: number; max_points: number | null; name?: string }>): Promise<MemberLevelRow[]> {
    const results: MemberLevelRow[] = [];
    
    for (const level of levels) {
      const { data, error } = await supabase
        .from('member_levels')
        .update({ 
          min_points: level.min_points, 
          max_points: level.max_points,
          ...(level.name ? { name: level.name } : {})
        })
        .eq('id', level.id)
        .select()
        .single();

      if (error) throw error;
      results.push(data as MemberLevelRow);
    }

    return results;
  }
};
