-- =============================================
-- PetCare Pro 完整数据库架构脚本
-- 包含：表结构创建、初始数据填充、行级安全策略(RLS)、自动用户触发器
-- =============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 第一部分：创建表结构
-- =============================================

-- 1. 用户表 (users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    points INTEGER DEFAULT 100,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Trigger to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, points)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 100)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_new_user ON auth.users;
CREATE TRIGGER sync_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. 医生表 (doctors)
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    rating DECIMAL(2,1) DEFAULT 5.0,
    image_url TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    price INTEGER DEFAULT 200,
    awards TEXT[] DEFAULT '{}',
    satisfaction TEXT DEFAULT '98%',
    experience_years INTEGER DEFAULT 5,
    patient_count INTEGER DEFAULT 100,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 宠物表 (pets)
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    pet_type TEXT CHECK (pet_type IN ('dog', 'cat', 'other')) DEFAULT 'dog',
    gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',
    age INTEGER DEFAULT 1,
    weight DECIMAL(5,2) DEFAULT 5.0,
    image_url TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    medical_records JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);

-- 4. 预约表 (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
    pet_name TEXT NOT NULL,
    service TEXT NOT NULL DEFAULT '宠物全检',
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')) DEFAULT 'upcoming',
    cost INTEGER DEFAULT 0,
    start_time TIME,           -- 进行中开始时间
    end_time TIME,             -- 进行中结束时间
    admin_note TEXT,           -- 管理员备注
    completed_at TIMESTAMP WITH TIME ZONE,  -- 完成时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);

-- 5. 聊天会话表 (chats)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    last_message TEXT DEFAULT '',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);

-- 6. 消息表 (messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('user', 'doctor')) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(chat_id, created_at);

-- 7. 积分历史表 (point_history)
CREATE TABLE IF NOT EXISTS public.point_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'other', -- redeem, consume, admin_add, admin_deduct, admin_set, refund, other
    amount INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON public.point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_date ON public.point_history(user_id, transaction_date DESC);

-- 8. 兑换码表 (redeem_codes)
CREATE TABLE IF NOT EXISTS public.redeem_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    points INTEGER NOT NULL DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON public.redeem_codes(code);

-- 9. 会员等级配置表 (member_levels)
CREATE TABLE IF NOT EXISTS public.member_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_order INTEGER NOT NULL UNIQUE,           -- 等级顺序 (1-6)
    name TEXT NOT NULL,                            -- 等级名称
    min_points INTEGER NOT NULL,                   -- 最低积分
    max_points INTEGER,                            -- 最高积分 (最高等级可为null)
    icon TEXT NOT NULL DEFAULT 'person',           -- 图标名称
    color_from TEXT NOT NULL DEFAULT 'neutral-400', -- 渐变起始色
    color_to TEXT NOT NULL DEFAULT 'neutral-500',   -- 渐变结束色
    card_bg TEXT NOT NULL DEFAULT '#141414',        -- 卡片背景色
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_levels_order ON public.member_levels(level_order);
CREATE INDEX IF NOT EXISTS idx_member_levels_points ON public.member_levels(min_points);

-- 初始化会员等级数据
INSERT INTO public.member_levels (level_order, name, min_points, max_points, icon, color_from, color_to, card_bg)
VALUES 
(1, '普通会员', 0, 999, 'person', 'neutral-400', 'neutral-500', '#141414'),
(2, '青铜会员', 1000, 4999, 'shield', 'orange-400', 'orange-600', '#1a1210'),
(3, '黄金会员', 5000, 9999, 'stars', 'yellow-400', 'amber-500', '#1a1408'),
(4, '铂金会员', 10000, 19999, 'workspace_premium', 'slate-300', 'slate-400', '#1a1a2e'),
(5, '钻石会员', 20000, 99999, 'diamond', 'cyan-400', 'blue-500', '#0a1628'),
(6, '尊贵会员', 100000, NULL, 'diamond', 'purple-600', 'pink-500', '#1a0a2e')
ON CONFLICT (level_order) DO UPDATE SET
  name = EXCLUDED.name,
  min_points = EXCLUDED.min_points,
  max_points = EXCLUDED.max_points,
  icon = EXCLUDED.icon,
  color_from = EXCLUDED.color_from,
  color_to = EXCLUDED.color_to,
  card_bg = EXCLUDED.card_bg;

-- 触发器函数：更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pets_updated_at ON public.pets;
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_levels_updated_at ON public.member_levels;
CREATE TRIGGER update_member_levels_updated_at BEFORE UPDATE ON public.member_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 第二部分：初始化数据填充 (Seed Data)
-- =============================================

-- 初始化医生数据
INSERT INTO public.doctors (name, title, rating, image_url, tags, price, awards, satisfaction, description)
VALUES 
(
    '莎拉·史密斯医生', 
    '资深兽医', 
    4.9, 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDMg2whfzSLtjjSSW1c0itTI0XVRB8w_BjCZZSdeHmHOJ55FP3T6KXn8UoFbU039AeE1gUhAxsJGkyVwZ8MYW5_MALZnC4v_6lpT6vLXENFw4_J9e4MvqBZeHNO4BwedcfAnrDoh5re3sTx_KFuvltxUIBzJTREyn25mP5NnGhX27pBFFEv08h0b9fjIlz5CNHd1dWAFO2ffVMByNEG1HkAUjGOwWpYkoqEq2eZDM3ww_wrwDPBp_WGv3zBnxipOMfRR-aeJ4PaPUFt', 
    ARRAY['外科', '全科'], 
    300, 
    ARRAY['2023 年度最佳兽医', '美国兽医协会杰出贡献奖'],
    '99%',
    '莎拉·史密斯医生是一位经验丰富的兽医，专注于小动物内科和外科手术。她对待每一个小生命都充满爱心和耐心，致力于为您的宠物提供最优质的医疗服务。拥有超过15年的临床经验。'
),
(
    '艾米丽·陈医生', 
    '牙科专家', 
    4.8, 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDAHr4cmrtH_ZjfxND1l_B5HFIuFpN1ejX9HynTOQpaGjAW9mF4eq-KoFPQqUN-wAN1QmZichoTo0jd-wBNPYSEYWb0eAde1a5vGxKyQAHvDuqfsH_yNaZjfxRqUdvzVKUHqIveLoMk_9bOBBYwz8WTxnPIdcX-GuPMwU8XVN_8XB-ueutXe3N4-9bbLAefCY_foicSQaaRUePt_MpIml54Nint7ThVn25cni821vm-II_5QI0wNMJxjO2QU2w1TJMMDF7qTdf3Py-6', 
    ARRAY['牙科', '清洁'], 
    250, 
    ARRAY['国际小动物牙科认证专家'],
    '98%',
    '艾米丽·陈医生专攻宠物牙科，提供专业的洗牙、拔牙及口腔护理服务。'
),
(
    '迈克尔·琼斯医生', 
    '营养顾问', 
    4.7, 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAujkgNYkuItsULWm5dpdEPg6QJQmR1U0mr0xIeccY948LAf820WsktyvSKIyYDoqEkD1frtUaaM-qSVSwwTu68qKkL7rLivqG-Fo5e_ancTsgbe56baWudkYkLiQp8RZ04Ka-d88izG-afENxPQuS3eL-_kO9sXSbUSPUDa09iAJkUx-z7CDZ4L1Wq3XWjBxxPd8tfQiI3V5mauypGaP7u8uVD2XUylBo7t1_s87GeuF4vovlSwzXukfsGx_gWu3kXwvZcjkhFJ6N7', 
    ARRAY['营养', '护理'], 
    200, 
    ARRAY['宠物营养学创新研究奖'],
    '97%',
    '迈克尔·琼斯医生致力于通过科学的饮食计划改善宠物的健康状况。'
),
(
    '亚历克斯·约翰逊医生', 
    '行为专家', 
    4.9, 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDRYJ0W3QmOgnw2Hb13sHDXtaxXraxZxmxUi9zw9iS3D8hbc4c0WJV-QYVOXM-VfU2L5Wj-wU3auQFLR65d4s4osUXXFR-Gemgkj-neG8Tr3Z8rpVFbq9zzEwba8aN17GhH_zDK_LCqVmdiXOoMfd8v59_vuAjUpu6-9XZE7iAun5NtmL2E1dc2xGLb28efCdRRZjhPtdgfrpbDu5BQJGDb4yDWpm8JKe_xLiz_QwabceG7S2ReG7SFbWea1W-ZVF_-A7rOZJD-Dw2S', 
    ARRAY['训练', '行为'], 
    350, 
    ARRAY['动物行为矫正金牌导师', '2022 最具亲和力医生'],
    '100%',
    '亚历克斯·约翰逊医生擅长解决宠物的焦虑、攻击性等行为问题。'
);

-- 初始化兑换码
INSERT INTO public.redeem_codes (code, points) VALUES 
('001', 1000),
('002', 2000),
('WELCOME2024', 500)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 第三部分：行级安全策略 (RLS)
-- =============================================

-- 启用所有表的 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_levels ENABLE ROW LEVEL SECURITY;

-- 1. Users 表策略
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 注意：插入策略在有了触发器后可以删除，或者保留以防万一
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Doctors 表策略
DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;
CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (true);

-- 3. Pets 表策略
DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;
CREATE POLICY "Users can view own pets" ON public.pets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pets" ON public.pets;
CREATE POLICY "Users can insert own pets" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pets" ON public.pets;
CREATE POLICY "Users can update own pets" ON public.pets FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pets" ON public.pets;
CREATE POLICY "Users can delete own pets" ON public.pets FOR DELETE USING (auth.uid() = user_id);

-- 4. Appointments 表策略
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);

-- 5. Chats & Messages 表策略
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
CREATE POLICY "Users can view own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chats" ON public.chats;
CREATE POLICY "Users can insert own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chats
        WHERE id = messages.chat_id
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert messages to their own chats" ON public.messages;
CREATE POLICY "Users can insert messages to their own chats" ON public.messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chats
        WHERE id = messages.chat_id
        AND user_id = auth.uid()
    )
);

-- 6. Point History 表策略
DROP POLICY IF EXISTS "Users can view own point history" ON public.point_history;
CREATE POLICY "Users can view own point history" ON public.point_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own point history" ON public.point_history;
CREATE POLICY "Users can insert own point history" ON public.point_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Redeem Codes 表策略
DROP POLICY IF EXISTS "Anyone can view active redeem codes" ON public.redeem_codes;
CREATE POLICY "Anyone can view active redeem codes" ON public.redeem_codes FOR SELECT USING (true);

-- 8. Member Levels 表策略 (所有人可读)
DROP POLICY IF EXISTS "Anyone can view member levels" ON public.member_levels;
CREATE POLICY "Anyone can view member levels" ON public.member_levels FOR SELECT USING (true);


-- =============================================
-- 第四部分：自动处理新用户创建触发器
-- =============================================

-- 创建处理新用户的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, points, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        -- 如果 metadata 中有 name 则使用，否则使用 email 前缀
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        100, -- 初始积分
        ''
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
