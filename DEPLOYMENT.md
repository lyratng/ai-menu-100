# Vercel 部署指南

## 📋 部署概览

本项目采用前后端分离架构，需要分别部署：

1. **前端（用户端）** → Vercel → `ai-menu.tech`
2. **管理后台** → Vercel → `admin.ai-menu.tech`
3. **后端API** → Railway/Render/Fly.io → `api.ai-menu.tech`

---

## 🚀 前端部署（用户端）

### 步骤1: Vercel配置

在Vercel创建新项目，配置如下：

#### 基础配置
```
Project Name: ai-menu-100
Framework Preset: Next.js
Root Directory: frontend
```

#### 构建配置
```
Build Command: pnpm build
Output Directory: .next (Next.js default)
Install Command: pnpm install
```

#### 环境变量（重要！）
在 Vercel 项目设置的 Environment Variables 中添加：

| Key | Value | 说明 |
|-----|-------|------|
| `NEXT_PUBLIC_API_URL` | `https://api.ai-menu.tech` | 后端API地址 |

⚠️ **注意**: 
- 必须等后端部署完成后，再配置这个环境变量
- 如果后端还未部署，可以暂时填写 `https://your-backend.railway.app`

### 步骤2: 域名配置

1. 在 Vercel 项目设置中找到 **Domains**
2. 添加自定义域名：`ai-menu.tech`
3. 按照提示配置 DNS 记录：
   - Type: `A` 或 `CNAME`
   - Name: `@`
   - Value: Vercel提供的地址

---

## 🔐 管理后台部署

### 步骤1: 创建第二个Vercel项目

配置如下：

```
Project Name: ai-menu-100-admin
Framework Preset: Next.js
Root Directory: frontend
```

⚠️ **注意**: Root Directory 仍然是 `frontend`，因为管理后台页面在 `frontend/app/admin/` 下

#### 构建配置
```
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

#### 环境变量
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.ai-menu.tech` |

### 步骤2: 域名配置

添加子域名：`admin.ai-menu.tech`

DNS记录：
- Type: `CNAME`
- Name: `admin`
- Value: Vercel提供的地址

---

## 🖥️ 后端部署（推荐 Railway）

### 方案A: Railway 部署（推荐）

1. 访问 [railway.app](https://railway.app)
2. 创建新项目，选择 **Deploy from GitHub repo**
3. 选择 `lyratng/ai-menu-100` 仓库

#### Railway 配置

```
Root Directory: backend
Start Command: pnpm tsx src/server.ts
Build Command: pnpm install
```

#### 环境变量

需要在 Railway 添加以下环境变量：

```bash
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT密钥
JWT_SECRET=your-secret-key-change-in-production

# 阿里云OSS（文件存储）
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=your-bucket-name

# AI服务
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 服务配置
PORT=8080
NODE_ENV=production
```

#### 数据库

Railway 提供内置 PostgreSQL：
1. 在项目中添加 **PostgreSQL** 插件
2. Railway 会自动设置 `DATABASE_URL` 环境变量
3. 运行数据库初始化：
```bash
psql $DATABASE_URL < scripts/init-db.sql
```

### 方案B: Render 部署

1. 访问 [render.com](https://render.com)
2. 创建 **New Web Service**
3. 连接 GitHub 仓库

配置：
```
Root Directory: backend
Build Command: pnpm install
Start Command: pnpm tsx src/server.ts
```

### 步骤3: 自定义域名

在 Railway/Render 的设置中添加自定义域名：`api.ai-menu.tech`

---

## 🔄 部署顺序

按以下顺序部署，避免环境变量配置错误：

### 1️⃣ 后端部署（Railway）
```bash
1. 创建 Railway 项目
2. 添加 PostgreSQL 数据库
3. 配置环境变量
4. 运行数据库初始化脚本
5. 获取后端URL（如 https://ai-menu-backend.up.railway.app）
```

### 2️⃣ 前端部署（Vercel）
```bash
1. 创建 Vercel 项目
2. Root Directory 设为 frontend
3. 添加环境变量 NEXT_PUBLIC_API_URL（使用Railway的URL）
4. 部署完成后配置域名 ai-menu.tech
```

### 3️⃣ 管理后台部署（Vercel）
```bash
1. 创建第二个 Vercel 项目
2. Root Directory 仍设为 frontend
3. 添加相同的环境变量
4. 配置域名 admin.ai-menu.tech
```

### 4️⃣ DNS配置
```bash
在你的域名服务商配置：
- ai-menu.tech → Vercel IP
- admin.ai-menu.tech → Vercel CNAME
- api.ai-menu.tech → Railway/Render CNAME
```

---

## ✅ 部署验证

部署完成后，逐一测试：

### 1. 测试后端API
```bash
curl https://api.ai-menu.tech/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

### 2. 测试前端
访问：`https://ai-menu.tech`
- 能正常打开首页
- 注册/登录功能正常

### 3. 测试管理后台
访问：`https://admin.ai-menu.tech/admin/login`
- 能正常登录
- Dashboard数据正常显示

---

## 🐛 常见问题

### Q1: API请求失败，报CORS错误
**A**: 需要在后端添加CORS配置：

```typescript
// backend/src/server.ts
fastify.register(cors, {
  origin: [
    'https://ai-menu.tech',
    'https://admin.ai-menu.tech',
    'http://localhost:3000'
  ],
  credentials: true
});
```

### Q2: 环境变量不生效
**A**: 
- Vercel: 修改环境变量后需要 **重新部署**
- Railway: 环境变量修改会自动触发重新部署

### Q3: 数据库连接失败
**A**: 检查 `DATABASE_URL` 格式：
```
postgresql://username:password@host:port/database
```

### Q4: 构建失败 - "pnpm: command not found"
**A**: 在 Vercel 的构建设置中添加：
```
Install Command: npm install -g pnpm && pnpm install
```

---

## 📚 相关文档

- [Vercel 文档](https://vercel.com/docs)
- [Railway 文档](https://docs.railway.app)
- [Next.js 部署](https://nextjs.org/docs/deployment)

---

## 🎉 完成

恭喜！你的项目已经成功部署到生产环境！

访问地址：
- 🌐 用户端：https://ai-menu.tech
- 🔐 管理后台：https://admin.ai-menu.tech
- 🚀 API：https://api.ai-menu.tech

