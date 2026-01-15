-- PetCare Pro - Admin setup
--
-- 说明：本文件用于给后台管理系统(Admin)补齐数据库字段与 RLS 策略。
-- 执行方式：Supabase Dashboard -> SQL Editor -> New query -> 粘贴运行
--
-- 你需要先执行 supabase/full_schema.sql（创建表结构与基础 RLS）
-- 再执行本文件。

-- 1) users 表：新增管理员标记
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 1.1) point_history 表：添加类型和描述字段（用于显示详细的积分变动原因）
ALTER TABLE public.point_history
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.point_history
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other';

ALTER TABLE public.point_history
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;

-- 2) 管理员判定函数（供 RLS policy 复用）
-- SECURITY DEFINER：用于在 RLS 中安全地读取 users.is_admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT u.is_admin FROM public.users u WHERE u.id = uid), false);
$$;

-- 3) RLS: 管理员可查看全部用户
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 3.1) RLS: 管理员可更新全部用户（用于积分管理等）
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3.2) RLS: 管理员可查看/插入全部积分历史（用于积分管理审计）
DROP POLICY IF EXISTS "Admins can view all point history" ON public.point_history;
CREATE POLICY "Admins can view all point history"
ON public.point_history
FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert point history" ON public.point_history;
CREATE POLICY "Admins can insert point history"
ON public.point_history
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- 4) RLS: 管理员可管理医生
DROP POLICY IF EXISTS "Admins can insert doctors" ON public.doctors;
CREATE POLICY "Admins can insert doctors"
ON public.doctors
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update doctors" ON public.doctors;
CREATE POLICY "Admins can update doctors"
ON public.doctors
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete doctors" ON public.doctors;
CREATE POLICY "Admins can delete doctors"
ON public.doctors
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 5) RLS: 管理员可管理兑换码
DROP POLICY IF EXISTS "Admins can insert redeem codes" ON public.redeem_codes;
CREATE POLICY "Admins can insert redeem codes"
ON public.redeem_codes
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update redeem codes" ON public.redeem_codes;
CREATE POLICY "Admins can update redeem codes"
ON public.redeem_codes
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete redeem codes" ON public.redeem_codes;
CREATE POLICY "Admins can delete redeem codes"
ON public.redeem_codes
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 5.1) RLS: 管理员可管理所有宠物（给后台按用户增删宠物用）
DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
CREATE POLICY "Admins can view all pets"
ON public.pets
FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert pets" ON public.pets;
CREATE POLICY "Admins can insert pets"
ON public.pets
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update pets" ON public.pets;
CREATE POLICY "Admins can update pets"
ON public.pets
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete pets" ON public.pets;
CREATE POLICY "Admins can delete pets"
ON public.pets
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 6) RLS: 管理员可查看/更新全部预约（用于后台列表与状态管理）
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
CREATE POLICY "Admins can update appointments"
ON public.appointments
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 7) RLS: 管理员可查看全部聊天/消息（用于后台统计与排障）
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
CREATE POLICY "Admins can view all chats"
ON public.chats
FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 8) 将某个账号提升为管理员（在 SQL Editor 用具有权限的角色执行）
-- 把下面的 email 改成你的登录邮箱：
-- UPDATE public.users SET is_admin = true WHERE email = 'admin@example.com';

-- =============================================
-- 9) Supabase Storage Bucket 配置（必须手动创建）
-- =============================================
-- 
-- 上传宠物照片需要先在 Supabase Dashboard 创建 Storage Bucket：
-- 
-- 步骤：
-- 1. 进入 Supabase Dashboard -> Storage
-- 2. 点击 "New bucket"
-- 3. Bucket name: pet-images
-- 4. 勾选 "Public bucket"（让图片可以公开访问）
-- 5. 点击 "Create bucket"
-- 
-- 创建后设置 bucket 策略（允许已登录用户上传）：
-- 1. 点击 pet-images bucket -> Policies
-- 2. 点击 "New policy" -> "For full customization"
-- 3. 添加以下策略：

-- 策略1：允许已登录用户上传
-- Policy name: Allow authenticated uploads
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression: true

-- 策略2：允许公开读取
-- Policy name: Allow public read
-- Allowed operation: SELECT
-- Target roles: anon, authenticated
-- USING expression: true

-- 或者在 SQL Editor 运行以下命令（需要先手动创建 bucket）：
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pet-images', 'pet-images', true) ON CONFLICT DO NOTHING;

-- 注意：如果提示 bucket not found，请确保已按上述步骤创建 bucket。
