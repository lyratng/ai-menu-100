# 🚀 Vercel部署快速指南

> 3分钟完成前端部署

---

## 📋 前置条件

- [ ] GitHub账号
- [ ] 代码已推送到GitHub仓库
- [ ] 后端API已部署（或记录后端URL）

---

## 🎯 部署步骤

### 1. 登录Vercel

访问：https://vercel.com/

点击 **"Continue with GitHub"**

### 2. 导入项目

1. 点击 **"Add New..."** → **"Project"**
2. 找到 `ai-menu-100` 仓库
3. 点击 **"Import"**

### 3. 配置构建设置

**⚠️ 重要：以下配置必须正确填写**

```
Framework Preset: Next.js
Root Directory: frontend     ← 必须填写！
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

**截图参考**：
```
┌─────────────────────────────────────┐
│ Framework Preset                    │
│ [Next.js ▼]                         │
│                                     │
│ Root Directory                      │
│ [frontend  ]  ← 重点！              │
│                                     │
│ Build Command (留空使用默认)         │
│ [          ]                        │
│                                     │
│ Output Directory (留空使用默认)      │
│ [          ]                        │
│                                     │
│ Install Command (留空使用默认)       │
│ [          ]                        │
└─────────────────────────────────────┘
```

### 4. 配置环境变量

点击 **"Environment Variables"**，添加：

| Name | Value | 说明 |
|------|-------|------|
| `NEXT_PUBLIC_API_URL` | `https://api.ai-menu.tech` | 后端API地址 |

**注意**：
- 如果后端使用IP访问，填写：`http://123.456.789.0:8080`（替换为实际IP）
- 如果后端还未部署，可以先填临时值，部署后再修改

### 5. 开始部署

1. 点击 **"Deploy"**
2. 等待3-5分钟（会显示构建进度）
3. 看到 "🎉 Congratulations" 表示部署成功

### 6. 测试部署

点击 **"Visit"** 或访问分配的临时域名（如：`ai-menu-100.vercel.app`）

检查：
- [ ] 首页能正常打开
- [ ] 样式显示正常
- [ ] 打开浏览器控制台，检查是否有API错误

---

## 🌐 配置自定义域名

### 为用户前端配置域名（app.ai-menu.tech）

#### 在Vercel中添加域名

1. 在项目页面，点击 **"Settings"**
2. 左侧菜单选择 **"Domains"**
3. 输入：`app.ai-menu.tech`
4. 点击 **"Add"**

Vercel会提示需要配置DNS。

#### 配置DNS记录

登录域名管理后台（如阿里云、腾讯云、Cloudflare等），添加：

```
类型: CNAME
主机记录: app
记录值: cname.vercel-dns.com
TTL: 600（10分钟）
```

**阿里云DNS配置示例**：
```
┌────────┬──────────┬─────────────────────┬─────┐
│ 记录类型 │ 主机记录  │ 记录值               │ TTL │
├────────┼──────────┼─────────────────────┼─────┤
│ CNAME  │ app      │ cname.vercel-dns.com│ 600 │
└────────┴──────────┴─────────────────────┴─────┘
```

#### 等待生效

- 通常5-10分钟生效
- 在Vercel的Domains页面会显示验证状态
- 看到 ✅ 表示已生效

#### 验证访问

访问：https://app.ai-menu.tech

如果能打开，说明配置成功！

---

### 为管理后台配置域名（admin.ai-menu.tech）

#### 在同一个Vercel项目中添加

1. 仍在 **"Settings"** → **"Domains"**
2. 继续添加：`admin.ai-menu.tech`
3. 点击 **"Add"**

#### 配置DNS记录

在域名管理后台添加：

```
类型: CNAME
主机记录: admin
记录值: cname.vercel-dns.com
TTL: 600
```

#### 配置路由重定向（可选）

如果希望访问 `admin.ai-menu.tech` 时直接跳转到 `/admin/login`：

**方法1：修改 `frontend/next.config.js`**

添加以下配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... 其他配置
  
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/login',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'admin.ai-menu.tech',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**方法2：使用 Vercel 的重定向配置**

在项目根目录创建 `vercel.json`：

```json
{
  "redirects": [
    {
      "source": "/",
      "destination": "/admin/login",
      "has": [
        {
          "type": "host",
          "value": "admin.ai-menu.tech"
        }
      ],
      "permanent": false
    }
  ]
}
```

修改后需要重新部署（自动触发或手动点击 Redeploy）。

---

## 🔄 更新部署

### 自动部署（推荐）

1. 修改代码
2. 提交到GitHub：
   ```bash
   git add .
   git commit -m "update frontend"
   git push origin main
   ```
3. Vercel自动检测到推送，自动部署
4. 1-3分钟后新版本上线

### 手动重新部署

1. 登录Vercel
2. 进入项目
3. 点击 **"Deployments"**
4. 找到最新部署，点击右侧 **"..."** → **"Redeploy"**

---

## 🔧 常见问题

### Q1: 构建失败 - "Cannot find module 'pnpm'"

**原因**：Vercel默认使用npm

**解决**：无需处理，Vercel会自动检测并安装pnpm

### Q2: 构建失败 - "Root Directory not found"

**原因**：Root Directory配置错误

**解决**：
1. 检查是否填写了 `frontend`（不是 `frontend/` 或 `/frontend`）
2. 确认GitHub仓库中确实有 `frontend` 目录

### Q3: 页面能访问，但API请求失败

**原因**：
- 环境变量未配置或配置错误
- 后端CORS配置问题

**解决**：

1. 检查环境变量：
   - 进入 **Settings** → **Environment Variables**
   - 确认 `NEXT_PUBLIC_API_URL` 正确
   - 修改后需要点击 **Redeploy**

2. 检查后端CORS：
   - 确认后端 `.env` 中的 `CORS_ORIGIN` 包含前端域名
   - 例如：`CORS_ORIGIN=https://app.ai-menu.tech,https://admin.ai-menu.tech`

3. 打开浏览器控制台（F12），查看具体错误信息

### Q4: 域名添加后一直显示 "Pending"

**原因**：DNS记录未生效或配置错误

**解决**：
1. 确认DNS记录类型为 `CNAME`
2. 确认记录值为 `cname.vercel-dns.com`（不是IP地址）
3. 等待10-30分钟（DNS传播需要时间）
4. 使用命令验证DNS：
   ```bash
   nslookup app.ai-menu.tech
   ```
   应返回Vercel的IP地址

### Q5: 提示 "This domain is already in use"

**原因**：域名已被其他Vercel项目使用

**解决**：
1. 如果是您自己的其他项目，先去那个项目删除域名
2. 如果不是，检查域名是否输入错误

### Q6: 修改环境变量后不生效

**原因**：Vercel的环境变量在构建时注入，修改后需要重新部署

**解决**：
1. 修改环境变量后
2. 点击 **"Deployments"** → 最新部署 → **"Redeploy"**
3. 等待构建完成

---

## 📊 部署完成检查清单

部署完成后，请检查：

### 基础功能
- [ ] https://app.ai-menu.tech 能访问
- [ ] https://admin.ai-menu.tech 能访问
- [ ] HTTPS证书正常（浏览器地址栏显示🔒）
- [ ] 页面样式正常显示
- [ ] 无控制台错误

### API连接
- [ ] 打开浏览器控制台（F12）→ Network
- [ ] 执行一个API操作（如登录）
- [ ] 检查请求是否发送到正确的API地址
- [ ] 检查是否有CORS错误

### 移动端适配
- [ ] 使用手机访问
- [ ] 或浏览器开发者工具切换到移动视图
- [ ] 检查布局是否正常

---

## 💰 费用说明

### Vercel Hobby计划（免费）

**包含**：
- ✅ 无限制的部署次数
- ✅ 100GB 带宽/月
- ✅ 无限个自定义域名
- ✅ 自动HTTPS证书
- ✅ 全球CDN加速
- ✅ GitHub自动部署

**限制**：
- 单个项目最大 12 GB RAM
- 构建时间最长 45 分钟
- 无团队协作功能

**对于本项目**：完全免费够用！

### 何时需要升级到Pro（$20/月）？

- 月带宽超过 100GB
- 需要多人协作管理
- 需要密码保护页面

---

## 📚 相关资源

- **Vercel官方文档**：https://vercel.com/docs
- **Next.js部署指南**：https://nextjs.org/docs/deployment
- **Vercel CLI**：https://vercel.com/docs/cli（命令行部署工具）

---

## 🎉 完成！

如果所有步骤完成，您的前端已成功部署到Vercel！

**访问地址**：
- 用户端：https://app.ai-menu.tech
- 管理后台：https://admin.ai-menu.tech

**下一步**：
- 完成后端部署
- 进行完整功能测试
- 交付给甲方使用

---

*最后更新：2025-11-11*

