-- 预约管理功能升级 SQL 迁移
-- 添加进行中时间段和完成信息字段

-- 添加新字段到 appointments 表
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 添加 in_progress 状态到 status 枚举（如果尚未存在）
-- 注意：这需要先检查约束是否存在
DO $$
BEGIN
    -- 删除旧的约束（如果存在）
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appointments_status_check' 
        AND conrelid = 'public.appointments'::regclass
    ) THEN
        ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
    END IF;
    
    -- 添加新的约束，包含 in_progress 状态
    ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled'));
EXCEPTION
    WHEN undefined_object THEN
        -- 约束不存在，可能使用的是枚举类型，忽略
        NULL;
END $$;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_in_progress ON public.appointments(doctor_id, appointment_date, status) WHERE status = 'in_progress';

-- 注释：功能说明
COMMENT ON COLUMN public.appointments.start_time IS '管理员设置的服务开始时间，用于时间段占用';
COMMENT ON COLUMN public.appointments.end_time IS '管理员设置的服务结束时间，用于时间段占用';
COMMENT ON COLUMN public.appointments.admin_note IS '管理员备注，如取消原因或完成说明';
COMMENT ON COLUMN public.appointments.completed_at IS '服务完成时间';
