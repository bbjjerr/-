-- =============================================
-- 会员等级系统 SQL 脚本
-- 运行此脚本在 Supabase SQL Editor 中添加会员等级功能
-- =============================================

-- 1. 创建会员等级配置表
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

-- 2. 添加索引
CREATE INDEX IF NOT EXISTS idx_member_levels_order ON public.member_levels(level_order);
CREATE INDEX IF NOT EXISTS idx_member_levels_points ON public.member_levels(min_points);

-- 3. 初始化会员等级数据
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

-- 4. 添加更新触发器
DROP TRIGGER IF EXISTS update_member_levels_updated_at ON public.member_levels;
CREATE TRIGGER update_member_levels_updated_at 
BEFORE UPDATE ON public.member_levels 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用 RLS
ALTER TABLE public.member_levels ENABLE ROW LEVEL SECURITY;

-- 6. 添加读取策略 (所有人可读)
DROP POLICY IF EXISTS "Anyone can view member levels" ON public.member_levels;
CREATE POLICY "Anyone can view member levels" ON public.member_levels FOR SELECT USING (true);

-- 7. 添加管理员写入策略 (如果需要通过API更新)
-- 注意: 当前使用 service_role key 进行管理操作，无需额外策略
-- 如需通过普通用户更新，取消下面注释并添加管理员判断
-- DROP POLICY IF EXISTS "Admins can update member levels" ON public.member_levels;
-- CREATE POLICY "Admins can update member levels" ON public.member_levels 
-- FOR UPDATE USING (
--   EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
-- );

-- 8. 启用实时更新 (可选)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.member_levels;

-- 验证：查看所有等级
SELECT * FROM public.member_levels ORDER BY level_order;
