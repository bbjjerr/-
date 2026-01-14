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
