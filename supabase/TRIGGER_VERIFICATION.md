# 数据库触发器验证指南

## 问题：注册后数据库无用户数据

### 检查步骤

1. **确认触发器是否已创建**

在 Supabase SQL Editor 中运行：

```sql
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
AND trigger_name = 'on_auth_user_created';
```

如果返回空结果，说明触发器未创建。

2. **确认触发器函数是否存在**

```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

3. **手动创建触发器**

如果上述查询返回空，请在 Supabase SQL Editor 中执行：

```sql
-- 创建处理新用户的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, points, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        100,
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
```

4. **测试触发器**

注册一个新用户后，运行以下查询检查：

```sql
-- 检查 auth.users 表
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 检查 public.users 表
SELECT id, email, name, points FROM public.users ORDER BY created_at DESC LIMIT 5;
```

两个表中应该有相同的用户记录。

5. **查看触发器错误日志**

如果触发器存在但不工作，检查 Supabase Dashboard 的 Logs 部分查看错误信息。

### 常见问题

**Q: 触发器创建失败，提示权限错误**

A: 确保使用 `SECURITY DEFINER` 并且函数在 `public` schema 中。

**Q: 用户在 auth.users 中存在，但 public.users 中没有**

A: 
1. 检查触发器是否正确绑定到 `auth.users` 表
2. 查看数据库日志中的错误信息
3. 手动运行触发器函数测试

**Q: 如何手动为现有用户补充数据？**

A: 运行以下 SQL：

```sql
INSERT INTO public.users (id, email, name, points, avatar_url)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    100,
    ''
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

## 验证清单

- [ ] 触发器函数 `handle_new_user` 已创建
- [ ] 触发器 `on_auth_user_created` 已绑定到 `auth.users`
- [ ] 注册新用户后，`public.users` 表中有对应记录
- [ ] 用户的初始积分为 100
- [ ] 前端登录表单已添加验证逻辑
- [ ] 注册表单已添加邮箱和密码格式验证
