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

export type AdminAppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  cost: number;
  pet_name: string;
  users?: { name: string; email: string } | null;
  doctors?: { name: string } | null;
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
        `id,appointment_date,appointment_time,status,cost,pet_name,
         users(name,email),
         doctors(name)`
      )
      .order('appointment_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = (data || []) as unknown as Array<
      Omit<AdminAppointmentRow, 'users' | 'doctors'> & {
        users?: EmbeddedOne<{ name: string; email: string }>;
        doctors?: EmbeddedOne<{ name: string }>;
      }
    >;

    return rows.map((r) => ({
      ...r,
      users: pickEmbeddedOne(r.users),
      doctors: pickEmbeddedOne(r.doctors)
    }));
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
  }
};
