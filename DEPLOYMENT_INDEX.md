# 📚 部署文档索引

> 快速找到您需要的部署文档

---

## 🎯 开始部署

### 👉 第一次部署？从这里开始

1. **阅读总览**：[生产环境部署指南.md](docs/生产环境部署指南.md)（250行完整指南）
2. **打印检查清单**：[deploy-checklist.md](deploy-checklist.md)（边部署边打勾）
3. **选择部署平台**：
   - 前端：Vercel（推荐） → [Vercel部署快速指南](vercel-deployment-guide.md)
   - 后端：阿里云ECS（推荐） → 见下方

---

## 📖 文档列表

### 核心部署文档

| 文档 | 说明 | 适用场景 | 预计时间 |
|------|------|----------|----------|
| [生产环境部署指南.md](docs/生产环境部署指南.md) | 完整部署方案（250行） | 全面了解整个部署流程 | 30分钟阅读 |
| [deploy-checklist.md](deploy-checklist.md) | 部署检查清单 | 实际部署时逐项打勾 | 边部署边用 |
| [vercel-deployment-guide.md](vercel-deployment-guide.md) | Vercel前端部署快速指南 | 只部署前端 | 10分钟 |

### 配置模板

| 文件 | 说明 | 使用方法 |
|------|------|----------|
| [backend/.env.production.example](backend/.env.production.example) | 生产环境变量模板 | 复制为.env并填写 |
| [backend/nginx-config-template.conf](backend/nginx-config-template.conf) | Nginx配置模板 | 复制到ECS服务器 |

### 部署脚本

| 脚本 | 说明 | 使用方法 |
|------|------|----------|
| [backend/scripts/deploy-to-ecs.sh](backend/scripts/deploy-to-ecs.sh) | ECS自动部署脚本 | 在ECS上运行 |
| [backend/scripts/check-env.js](backend/scripts/check-env.js) | 环境变量检查脚本 | 部署前检查配置 |

### 其他参考文档

| 文档 | 说明 |
|------|------|
| [docs/第三方服务配置指南.md](docs/第三方服务配置指南.md) | 阿里云、DeepSeek等服务申请指南 |
| [QUICKSTART.md](QUICKSTART.md) | 本地开发快速开始 |
| [README.md](README.md) | 项目总体说明 |

---

## 🚀 快速部署流程

### 方案A：标准部署（推荐）

```
前端（Vercel免费） + 后端（阿里云ECS）
```

#### 第1步：准备资源（1-2天）

按照清单准备：
- [ ] 阿里云账号 → [注册](https://www.aliyun.com/)
- [ ] 购买ECS（2核4GB）
- [ ] 购买RDS PostgreSQL（2核4GB）
- [ ] 创建OSS Bucket
- [ ] 申请DeepSeek API Key → [申请](https://platform.deepseek.com/)
- [ ] 注册Vercel → [注册](https://vercel.com/)

#### 第2步：后端部署（2-3小时）

```bash
# 1. SSH登录ECS
ssh root@your_ecs_ip

# 2. 下载并运行自动部署脚本
wget https://raw.githubusercontent.com/your-repo/ai-menu-100/main/backend/scripts/deploy-to-ecs.sh
chmod +x deploy-to-ecs.sh
./deploy-to-ecs.sh

# 脚本会自动完成：
# - 安装Node.js、pnpm、Docker
# - 克隆代码
# - 启动Redis
# - 初始化数据库
# - 启动后端服务
```

**手动部署请参考**：[生产环境部署指南.md](docs/生产环境部署指南.md) 第五章

#### 第3步：前端部署（30分钟）

跟随 [Vercel部署快速指南](vercel-deployment-guide.md)，包括：
1. 导入GitHub仓库
2. 配置构建设置（Root Directory: `frontend`）
3. 添加环境变量
4. 绑定域名

#### 第4步：配置DNS（10分钟）

在域名管理后台添加：
```
app.ai-menu.tech    → CNAME → cname.vercel-dns.com
admin.ai-menu.tech  → CNAME → cname.vercel-dns.com
api.ai-menu.tech    → A     → [ECS IP]
```

#### 第5步：测试验证（30分钟）

使用 [deploy-checklist.md](deploy-checklist.md) 中的测试清单逐项验证。

---

## 🔧 部署工具使用

### 环境变量检查

部署前检查配置是否正确：

```bash
cd backend
node scripts/check-env.js
```

输出示例：
```
✓ DATABASE_URL: OK
✓ OSS_ACCESS_KEY_ID: OK
❌ JWT_SECRET: 使用了默认值（不安全）
```

生成随机JWT_SECRET：
```bash
node scripts/check-env.js --generate-jwt
```

### ECS自动部署

在ECS服务器上：

```bash
# 首次部署
curl -O https://raw.githubusercontent.com/.../deploy-to-ecs.sh
chmod +x deploy-to-ecs.sh
./deploy-to-ecs.sh

# 更新部署
cd /opt/ai-menu
git pull
pm2 restart ai-menu-backend
```

---

## 📝 部署检查清单

部署过程中，请参考 [deploy-checklist.md](deploy-checklist.md)，包括：

- [ ] 第一阶段：准备工作（账号、资源）
- [ ] 第二阶段：后端部署（ECS、数据库）
- [ ] 第三阶段：前端部署（Vercel）
- [ ] 第四阶段：DNS配置
- [ ] 第五阶段：功能测试
- [ ] 第六阶段：安全检查
- [ ] 第七阶段：性能测试
- [ ] 第八阶段：文档交接

---

## ❓ 常见问题

### 关于域名备案

**Q: 域名必须备案吗？**

A: 分情况：
- 前端用Vercel → **不需要备案**
- 后端用阿里云ECS + 域名 → **需要备案**（1-2周）
- 后端用阿里云ECS + IP访问 → **不需要备案**

**Q: 如何查询域名是否已备案？**

A: 访问 https://beian.miit.gov.cn/ 查询

### 关于费用

**Q: 总共需要花多少钱？**

A: 月费用约 ¥460-850
- Vercel前端：¥0（免费）
- 阿里云ECS：¥200-300
- 阿里云RDS：¥200-300
- 阿里云OSS：¥10-50
- DeepSeek API：¥50-200（按使用量）

**Q: 有没有更便宜的方案？**

A: 
1. 测试阶段用RDS基础版（便宜50%）
2. 小流量可用轻量应用服务器代替ECS
3. 使用包年包月（比按量便宜20-30%）

### 关于部署时间

**Q: 完整部署需要多久？**

A: 
- 准备资源：1-2天（主要等待审核）
- 后端部署：2-3小时（首次）
- 前端部署：30分钟
- 总计：约1-2天（如果资源已准备好，则4-5小时）

### 关于技术支持

**Q: 遇到问题怎么办？**

A: 
1. 先查看对应文档的"常见问题"章节
2. 查看服务器日志：`pm2 logs ai-menu-backend`
3. GitHub Issues：提交问题
4. 邮件：lyratng@163.com

---

## 🎓 学习路径

### 如果您是开发者

1. **理解架构**：阅读 [README.md](README.md)
2. **本地开发**：跟随 [QUICKSTART.md](QUICKSTART.md)
3. **部署到生产**：[生产环境部署指南.md](docs/生产环境部署指南.md)

### 如果您是运维人员

1. **了解需求**：[deploy-checklist.md](deploy-checklist.md)
2. **准备资源**：[docs/第三方服务配置指南.md](docs/第三方服务配置指南.md)
3. **执行部署**：[生产环境部署指南.md](docs/生产环境部署指南.md)

### 如果您是项目经理

1. **了解成本**：见上方"费用预估"
2. **了解时间**：见上方"部署时间"
3. **准备采购清单**：[docs/第三方服务配置指南.md](docs/第三方服务配置指南.md) 第二章

---

## 📞 获取帮助

- **GitHub仓库**：[项目地址]
- **问题反馈**：提交GitHub Issue
- **邮件联系**：lyratng@163.com
- **技术文档**：本目录所有.md文件

---

## ✅ 最后一步

部署完成后：

1. [ ] 完整测试所有功能
2. [ ] 记录所有账号密码（使用密码管理器）
3. [ ] 将管理员账号交付给甲方
4. [ ] 演示系统使用方法
5. [ ] 交付所有文档

**🎉 恭喜完成部署！**

---

*最后更新：2025-11-11*

