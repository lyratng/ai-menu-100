# 📋 部署检查清单

> 请按顺序完成以下步骤，每完成一项请打勾 ✅

---

## 第一阶段：准备工作（预计1-2天）

### 1. 账号注册
- [ ] 阿里云账号已注册并完成实名认证
- [ ] DeepSeek账号已注册
- [ ] Vercel账号已注册（使用GitHub登录）
- [ ] GitHub代码仓库已准备好

### 2. 阿里云资源购买
- [ ] **ECS云服务器**
  - 规格：2核4GB
  - 地域：华北2（北京）或华东2（上海）
  - 镜像：Ubuntu 22.04
  - 带宽：5Mbps
  - 公网IP：✅ 已分配
  - 记录IP：`___________________`

- [ ] **RDS PostgreSQL数据库**
  - 规格：2核4GB
  - 版本：14或15
  - 存储：50GB
  - 已创建数据库：`ai_menu`
  - 已创建账号：`ai_menu_admin`
  - 连接地址：`___________________`

- [ ] **OSS对象存储**
  - Bucket名称：`ai-menu-prod`（或其他唯一名称）
  - 地域：与ECS同区域
  - 权限：私有
  - 已配置CORS：✅

- [ ] **AccessKey**
  - AccessKeyId：`___________________`
  - AccessKeySecret：`___________________`（保密！）

### 3. DeepSeek API
- [ ] 账号已注册
- [ ] 已充值（建议¥100起）
- [ ] API Key已创建：`sk-___________________`

### 4. 域名配置
- [ ] 域名：`ai-menu.tech` 已购买
- [ ] 是否已备案：□ 是 / □ 否 / □ 不确定
- [ ] DNS管理后台可登录

---

## 第二阶段：后端部署（预计2-3小时）

### 5. ECS服务器初始化
- [ ] SSH已登录：`ssh root@[ECS_IP]`
- [ ] 系统已更新：`apt update && apt upgrade -y`
- [ ] Node.js 20.x 已安装
- [ ] pnpm 已安装
- [ ] Docker 已安装
- [ ] Docker Compose 已安装

### 6. 部署后端代码
- [ ] 代码已克隆到：`/opt/ai-menu`
- [ ] 依赖已安装：`pnpm install`
- [ ] `.env` 文件已创建并配置
  - [ ] DATABASE_URL 已填写
  - [ ] OSS配置已填写
  - [ ] DEEPSEEK_API_KEY 已填写
  - [ ] JWT_SECRET 已生成随机值（不要用默认值！）
  - [ ] CORS_ORIGIN 已配置

### 7. Redis部署
- [ ] Redis容器已启动
- [ ] 测试连接成功：`docker ps | grep redis`

### 8. 数据库初始化
- [ ] RDS白名单已添加ECS IP
- [ ] 数据库连接测试成功
- [ ] 数据库迁移已运行：`pnpm tsx scripts/run-migration.ts`
- [ ] 管理员账号已创建：
  - 用户名：`___________________`
  - 密码：`___________________`（记录在安全地方！）

### 9. 后端服务启动
- [ ] PM2 已安装
- [ ] 后端服务已启动：`pm2 start ...`
- [ ] 设置开机自启：`pm2 startup && pm2 save`
- [ ] 服务状态正常：`pm2 status`
- [ ] 健康检查通过：`curl http://localhost:8080/health`

### 10. Nginx配置（可选但推荐）
- [ ] Nginx 已安装
- [ ] 配置文件已创建
- [ ] Nginx 已启动并设为开机自启
- [ ] 通过Nginx访问成功：`curl http://[ECS_IP]/health`

### 11. HTTPS配置（域名备案后）
- [ ] 域名已备案（如未备案，跳过此步骤）
- [ ] Let's Encrypt证书已申请
- [ ] HTTPS访问成功：`curl https://api.ai-menu.tech/health`

---

## 第三阶段：前端部署（预计1小时）

### 12. Vercel项目创建
- [ ] 已登录Vercel
- [ ] 项目已导入
- [ ] Root Directory设为：`frontend`
- [ ] 构建命令：`pnpm build`
- [ ] 环境变量已配置：
  - [ ] `NEXT_PUBLIC_API_URL` = `https://api.ai-menu.tech`
    （如后端未备案，填写：`http://[ECS_IP]:8080`）

### 13. 首次部署
- [ ] 点击Deploy
- [ ] 构建成功（等待3-5分钟）
- [ ] 临时域名可访问：`https://ai-menu-100.vercel.app`

### 14. 自定义域名配置
- [ ] **用户前端域名**
  - 在Vercel添加：`app.ai-menu.tech`
  - DNS记录已配置：CNAME `app` → `cname.vercel-dns.com`
  - 域名已生效：✅
  - 访问测试：https://app.ai-menu.tech

- [ ] **管理后台域名**
  - 在Vercel添加：`admin.ai-menu.tech`
  - DNS记录已配置：CNAME `admin` → `cname.vercel-dns.com`
  - 域名已生效：✅
  - 访问测试：https://admin.ai-menu.tech/admin/login

---

## 第四阶段：DNS配置

### 15. DNS记录检查
- [ ] `app.ai-menu.tech` → CNAME → `cname.vercel-dns.com`
- [ ] `admin.ai-menu.tech` → CNAME → `cname.vercel-dns.com`
- [ ] `api.ai-menu.tech` → A记录 → `[ECS_IP]`（如已备案）
- [ ] DNS已生效（使用 `nslookup` 或 `dig` 验证）

---

## 第五阶段：功能测试

### 16. 后端API测试
- [ ] 健康检查：`curl https://api.ai-menu.tech/health`
- [ ] 登录API：
  ```bash
  curl -X POST https://api.ai-menu.tech/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"your_password"}'
  ```
- [ ] 返回JWT token：✅

### 17. 用户端功能测试
访问：https://app.ai-menu.tech

- [ ] 首页正常显示
- [ ] 注册功能：
  - [ ] 填写表单
  - [ ] 提交成功
  - [ ] 跳转到上传页面
- [ ] 登录功能：
  - [ ] 输入账号密码
  - [ ] 登录成功
- [ ] 文件上传：
  - [ ] 选择Excel文件
  - [ ] 上传成功
  - [ ] 解析状态显示
- [ ] 菜品配置：
  - [ ] 查看解析的菜品
  - [ ] 设置菜品类型
  - [ ] 保存成功
- [ ] 菜单生成：
  - [ ] 点击"生成菜单"
  - [ ] AI生成成功
  - [ ] 下载Excel

### 18. 管理后台功能测试
访问：https://admin.ai-menu.tech/admin/login

- [ ] 登录页面正常显示
- [ ] 使用admin账号登录成功
- [ ] **Dashboard**
  - [ ] 统计数据正常显示
  - [ ] 图表正常渲染
- [ ] **菜品管理**
  - [ ] 菜品列表正常显示
  - [ ] 搜索功能正常
  - [ ] 编辑菜品功能正常
- [ ] **菜单管理**
  - [ ] 菜单列表正常显示
  - [ ] 查看菜单详情正常
- [ ] **门店管理**
  - [ ] 门店列表正常显示
  - [ ] 编辑门店功能正常
- [ ] **用户管理**
  - [ ] 用户列表正常显示
- [ ] **设置**
  - [ ] 页面正常显示

---

## 第六阶段：安全检查

### 19. 安全配置验证
- [ ] JWT_SECRET 不是默认值（已替换为随机字符串）
- [ ] 数据库密码强度足够（16位以上，包含大小写字母+数字+特殊字符）
- [ ] OSS Bucket权限为"私有"
- [ ] .env文件未提交到Git
- [ ] ECS安全组只开放必要端口（22, 80, 443, 8080）
- [ ] RDS白名单只包含ECS IP（未对公网开放）
- [ ] 管理员密码已修改（不使用弱密码）

---

## 第七阶段：性能和监控

### 20. 性能测试
- [ ] API响应时间测试：
  ```bash
  time curl https://api.ai-menu.tech/health
  ```
  响应时间：`_____` ms（建议 < 500ms）

- [ ] 前端加载速度测试：
  - 首页加载时间：`_____` s（建议 < 3s）
  - 管理后台加载时间：`_____` s

### 21. 监控配置（可选）
- [ ] PM2日志查看正常：`pm2 logs`
- [ ] 服务器监控（使用阿里云云监控或其他工具）
- [ ] 错误告警已配置

---

## 第八阶段：文档和交接

### 22. 文档整理
- [ ] 所有账号信息已记录（存放在安全的地方）
- [ ] 密码已记录（建议使用密码管理器）
- [ ] 部署文档已交付
- [ ] 操作手册已交付

### 23. 培训和交接
- [ ] 管理员账号已交付给甲方
- [ ] 管理后台使用方法已演示
- [ ] 常见问题已说明
- [ ] 技术支持联系方式已提供

---

## 📊 部署完成统计

- **总耗时**：`_____` 小时
- **遇到的问题数**：`_____` 个
- **月度费用**：¥`_____` 元
- **部署日期**：`____年__月__日`
- **部署人员**：`___________________`

---

## ✅ 最终验证

所有测试通过后，在此签字确认：

- **技术负责人**：___________________ 日期：___________
- **甲方验收人**：___________________ 日期：___________

---

## 📞 技术支持

部署过程中遇到问题？

1. 查看《生产环境部署指南.md》
2. 查看服务器日志：`pm2 logs ai-menu-backend`
3. 联系开发者：lyratng@163.com

---

**🎉 恭喜！完成所有检查项后，系统已成功上线！**

