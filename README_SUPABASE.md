# PetCare Pro - Supabase 后端设置指南

本文档说明如何配置和部署 PetCare Pro 的 Supabase 后端。

## 前提条件

1. [Supabase 账号](https://supabase.com)
2. Node.js 和 npm 已安装
3. PetCare Pro 前端项目

## 步骤 1: 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: petcare-pro
   - **Database Password**: 设置一个强密码（请妥善保存）
   - **Region**: 选择离您最近的区域
4. 点击 "Create new project"，等待项目初始化完成（约 2-3 分钟）

## 步骤 2: 配置环境变量

1. 在 Supabase 项目 Dashboard，点击左侧菜单的 **Settings** → **API**
2. 复制以下信息：

   - **Project URL**（在 "Project URL" 部分）
   - **anon public** key（在 "Project API keys" 部分）

3. 在您的项目根目录，更新 `.env.local` 文件：

```bash
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的anon_key
```

## 步骤 3: 运行数据库迁移

在 Supabase Dashboard 中执行数据库迁移脚本：

### 方式一：使用 SQL Editor (推荐)

1. 在 Supabase Dashboard，点击左侧菜单的 **SQL Editor**
2. 点击 "New query"
3. 依次复制并执行以下文件的内容：

#### 3.1 创建表结构

复制 `supabase/full_schema.sql` 的全部内容，粘贴到 SQL Editor 并点击 "Run"。

#### 3.2（可选）开启后台管理(Admin)权限

如果你要使用项目里的后台管理页面（管理员才能看到入口），再执行：

- `supabase/ADMIN_SETUP.sql`

### 方式二：使用 Supabase CLI

如果您安装了 [Supabase CLI](https://supabase.com/docs/guides/cli)：

```bash
# 登录
supabase login

# 关联项目
supabase link --project-ref your-project-ref

# 推送迁移
supabase db push
```

## 步骤 4: 配置认证

1. 在 Supabase Dashboard，点击 **Authentication** → **Providers**
2. 启用 **Email** provider
3. 可选：配置邮件模板（**Email Templates**）

## 步骤 5: 验证设置

### 检查表是否创建成功

1. 在 Supabase Dashboard，点击 **Table Editor**
2. 您应该看到以下表：
   - users
   - doctors
   - pets
   - appointments
   - chats
   - messages
   - point_history
   - redeem_codes

### 检查初始数据

1. 点击 **doctors** 表
2. 您应该看到 4 位医生的数据
3. 点击 **redeem_codes** 表
4. 您应该看到 3 个兑换码（001, 002, WELCOME2024）

## 步骤 6: 启动应用

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173，您应该看到欢迎页面。

## 测试功能

### 1. 注册新用户

1. 点击"立即开启"
2. 点击"立即注册"
3. 填写信息并注册
4. 注册成功后会跳转到登录页

### 2. 登录

使用刚注册的账号登录，成功后会进入医生列表页面

### 3. 测试积分兑换

1. 进入个人中心
2. 点击"兑换积分"
3. 输入兑换码：`001`
4. 成功后积分会增加 1000

## 常见问题

### Q: 运行迁移脚本时出错

**A**: 确保按顺序执行三个 SQL 文件。如果出错，可以尝试：

1. 在 SQL Editor 中运行 `DROP TABLE IF EXISTS users CASCADE;`（依次删除所有表）
2. 重新运行迁移脚本

### Q: 注册后无法登录

**A**:

1. 检查 Supabase Authentication 设置中是否启用了 Email provider
2. 检查 `.env.local` 中的配置是否正确
3. 在浏览器控制台查看是否有错误信息

### Q: 获取不到医生数据

**A**:

1. 确认 `002_seed_doctors.sql` 已成功执行
2. 在 Table Editor 中检查 doctors 表是否有数据
3. 检查浏览器控制台的网络请求是否成功

### Q: RLS 策略导致无法访问数据

**A**:

1. 确保已执行 `supabase/full_schema.sql`
2. 临时禁用 RLS 测试：在 Table Editor 中找到表，点击右上角设置，取消勾选 "Enable RLS"
3. 问题解决后记得重新启用 RLS

如果是后台管理页面报错，额外确认已执行 `supabase/ADMIN_SETUP.sql`，并且你的账号在 `public.users.is_admin = true`。

> 说明：本项目仓库当前提供的是 `supabase/full_schema.sql`（包含表结构 + seed + RLS）以及 `supabase/ADMIN_SETUP.sql`（管理员字段 + 额外策略）。

## 生产部署建议

1. **数据库备份**: 定期在 Supabase Dashboard → **Database** → **Backups** 中配置自动备份
2. **环境变量**: 使用生产环境的 Supabase 项目和密钥
3. **RLS 策略**: 确保所有表都启用了 RLS 并配置了正确的策略
4. **监控**: 在 Supabase Dashboard 中监控 API 使用情况和性能

## 支持

如有问题，请参考：

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Discord 社区](https://discord.supabase.com)
