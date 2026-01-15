import { supabase } from './supabaseClient';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    points: number;
    is_admin?: boolean;
    joined_at: string;
}

export const authService = {
    // 注册
    async signUp(email: string, password: string, name: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                },
            },
        });

        if (error) throw error;

        // 等待一小段时间让触发器执行
        await new Promise(resolve => setTimeout(resolve, 500));

        // 验证 public.users 中是否有数据
        if (data.user) {
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', data.user.id)
                .maybeSingle();

            // 如果触发器没有工作，手动插入数据（备用方案）
            if (!userProfile && !profileError) {
                console.warn('触发器未执行，使用备用方案插入用户数据');
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: data.user.id,
                        email: email,
                        name: name,
                        points: 100,
                        avatar_url: ''
                    }]);

                if (insertError) {
                    console.error('备用插入失败:', insertError);
                    throw new Error('用户注册失败，请重试');
                }
            }
        }

        return data;
    },

    // 登录
    async signIn(email: string, password: string) {
        // 第一步：使用 Supabase Auth 验证账号密码
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // 第二步：验证用户是否在 public.users 表中存在
        if (data.user) {
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', data.user.id)
                .single();

            if (profileError || !userProfile) {
                // 用户在 auth.users 中存在，但在 public.users 中不存在
                // 这种情况说明触发器没有正常工作
                await supabase.auth.signOut(); // 登出
                throw new Error('用户数据不完整，请联系管理员或重新注册');
            }
        }

        return data;
    },

    // 登出
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // 获取当前用户会话
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    // 获取当前用户档案
    async getCurrentUserProfile(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;


        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }

        return data;
    },

    // 更新用户档案
    async updateUserProfile(userId: string, updates: { name?: string; avatar_url?: string }): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 上传用户头像
    async uploadAvatar(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${ext}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('pet-images')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('pet-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // 监听状态变化
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }
};
