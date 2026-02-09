# 🐾 PetCare Pro - 宠物医疗服务平台

## 项目概述

这是一个基于 **React 19 + TypeScript + Vite** 构建的现代化宠物医疗预约和管理平台，使用 **Supabase** 作为后端服务（包含身份验证、数据库和文件存储）。

---

## 🛠️ 技术栈

| 技术        | 用途                                        |
| ----------- | ------------------------------------------- |
| React 19    | 前端框架                                    |
| TypeScript  | 类型安全                                    |
| Vite        | 构建工具                                    |
| Supabase    | 后端即服务 (Auth/Database/Storage/Realtime) |
| TailwindCSS | 样式框架                                    |

---

## 📱 主要功能模块

### 1. 用户系统

- 邮箱注册/登录
- Google OAuth 登录
- 用户资料管理（头像、昵称编辑）
- 会员积分系统

### 2. 会员等级系统

- 6 级会员体系：普通 → 青铜 → 黄金 → 铂金 → 钻石 → 尊贵
- 动态等级卡片展示
- 成长路径可视化
- 管理员可调整等级积分范围

### 3. 医生模块

- 医生列表展示（支持分类筛选）
- 医生详情页（资质、评价、奖项）
- 在线搜索

### 4. 预约系统

- 选择医生、宠物、日期时间
- 时间冲突检测
- 积分扣费/取消退款
- 预约状态流转：待服务 → 进行中 → 已完成/已取消

### 5. 宠物管理

- 添加/编辑宠物资料
- 宠物照片上传
- 医疗记录管理
- 就诊历史自动生成

### 6. 聊天功能

- 与医生实时聊天
- 消息历史记录
- 快捷回复按钮
- 预约状态通知

### 7. 管理后台

- 数据概览仪表板
- 用户管理（积分增减）
- 医生管理（增删改）
- 预约管理（状态流转、服务完成）
- 兑换码管理
- 会员等级配置

---

## 🚀 运行项目

**前提条件:** 已安装 Node.js

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
# 在 .env.local 文件中设置 GEMINI_API_KEY 和 Supabase 配置

# 3. 运行开发服务器
npm run dev

# 4. 构建生产版本
npm run build

# 5. 预览生产版本
npm run preview
```

### 清理端口并启动

```bash
npm run dev:clean
```

---

## 📦 数据库表结构

| 表名            | 说明         |
| --------------- | ------------ |
| `users`         | 用户信息     |
| `doctors`       | 医生信息     |
| `pets`          | 宠物信息     |
| `appointments`  | 预约记录     |
| `chats`         | 聊天会话     |
| `messages`      | 聊天消息     |
| `point_history` | 积分变动记录 |
| `redeem_codes`  | 兑换码       |
| `member_levels` | 会员等级配置 |

---

## 🗂️ 项目结构

```
petcare-pro/
├── components/          # 通用组件
│   └── Navigation.tsx   # 底部导航栏
├── screens/             # 页面组件
│   ├── AuthScreens.tsx  # 登录/注册页面
│   ├── DoctorScreens.tsx # 医生相关页面
│   ├── SocialScreens.tsx # 聊天/宠物/个人中心
│   └── AdminScreens.tsx  # 管理后台
├── src/
│   └── services/        # 后端服务
│       ├── supabaseClient.ts  # Supabase 客户端
│       ├── authService.ts     # 认证服务
│       ├── appointmentService.ts # 预约服务
│       ├── chatService.ts     # 聊天服务
│       ├── petService.ts      # 宠物服务
│       ├── pointService.ts    # 积分服务
│       ├── doctorService.ts   # 医生服务
│       └── adminService.ts    # 管理服务
├── supabase/            # 数据库脚本
│   ├── full_schema.sql  # 完整数据库架构
│   ├── MEMBER_LEVELS.sql # 会员等级系统
│   └── ...
├── App.tsx              # 主应用入口
├── types.ts             # 类型定义
└── index.html           # HTML 入口
```

---



## 📝 Supabase 配置

请参考 [README_SUPABASE.md](./README_SUPABASE.md) 了解完整的 Supabase 数据库配置说明。

### 快速配置步骤

1. 在 Supabase 创建新项目
2. 在 SQL Editor 中运行 `supabase/full_schema.sql`
3. 运行 `supabase/MEMBER_LEVELS.sql` 添加会员等级
4. 配置 Storage bucket: `pet-images`（公开读取）
5. 启用 Realtime：`users`, `appointments` 表
6. 在 `.env.local` 中配置:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
