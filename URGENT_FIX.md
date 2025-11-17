# 🚨 紧急修复指南

## 问题1：数据库缺少 updated_at 字段

### ❌ 错误信息
```
column "updated_at" of relation "menus" does not exist
```

### ✅ 修复步骤（在ECS上执行）

```bash
# 登录ECS
ssh root@8.140.9.139

# 添加 updated_at 字段
PGPASSWORD='Yan660328' psql -h pgm-2zehfdn8016w3674.pg.rds.aliyuncs.com -U ai_menu_admin -d ai_menu << 'EOF'
-- 添加 updated_at 字段
ALTER TABLE menus ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 将现有记录的 updated_at 设置为 created_at
UPDATE menus SET updated_at = created_at WHERE updated_at IS NULL;

-- 验证
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'menus' AND column_name = 'updated_at';
EOF
```

---

## 问题2：管理员登录失败

### 原因分析
前端访问：`https://api.ai-menu.tech/auth/login`（用户登录端点）
应该访问：`https://api.ai-menu.tech/api/admin/login`（管理员登录端点）

### ✅ 修复方法（检查前端）

管理员登录应该访问：`POST /api/admin/login`
- 用户名：`admin`
- 密码：`Yan660328`

---

## 问题3：历史菜品数量不足

### ❌ 错误信息
```
您的历史菜品数量不足（当前0道，建议至少50道），建议先上传更多历史菜单或将历史菜占比设为0%
```

### ✅ 临时解决方案

**方案1：上传历史菜单（推荐）**
在用户端上传至少50份历史菜单

**方案2：将历史菜占比设为0%**
在生成菜单时，将「历史菜占比」设置为 0%

---

## 🚀 快速修复命令

### 一键修复数据库
```bash
ssh root@8.140.9.139 "PGPASSWORD='Yan660328' psql -h pgm-2zehfdn8016w3674.pg.rds.aliyuncs.com -U ai_menu_admin -d ai_menu -c \"ALTER TABLE menus ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; UPDATE menus SET updated_at = created_at WHERE updated_at IS NULL;\""
```

### 验证修复
```bash
# 检查 menus 表结构
ssh root@8.140.9.139 "PGPASSWORD='Yan660328' psql -h pgm-2zehfdn8016w3674.pg.rds.aliyuncs.com -U ai_menu_admin -d ai_menu -c '\\d menus'"

# 查看 menus 表数据
ssh root@8.140.9.139 "PGPASSWORD='Yan660328' psql -h pgm-2zehfdn8016w3674.pg.rds.aliyuncs.com -U ai_menu_admin -d ai_menu -c 'SELECT id, title, created_at, updated_at FROM menus LIMIT 5;'"
```

---

## 📋 完整测试流程

### 1. 修复数据库
```bash
# 执行上面的一键修复命令
```

### 2. 重启后端服务
```bash
ssh root@8.140.9.139
pm2 restart ai-menu-backend
pm2 logs ai-menu-backend --lines 20
```

### 3. 测试管理员登录
访问：https://admin.ai-menu.tech/login
- 用户名：`admin`
- 密码：`Yan660328`

### 4. 测试用户注册
访问：https://ai-menu.tech/register
- 完成注册流程

### 5. 测试菜单生成
- 登录后访问主页
- 点击「生成新菜单」
- 将「历史菜占比」设为 0%
- 生成菜单

---

## 🔍 检查管理员登录问题

如果管理员还是登录不了，请提供：

1. **前端浏览器控制台的完整错误日志**
2. **Network标签中的请求详情：**
   - Request URL
   - Request Method
   - Status Code
   - Request Headers
   - Request Payload
   - Response

3. **后端日志：**
```bash
ssh root@8.140.9.139
pm2 logs ai-menu-backend --lines 50
```

---

## ⚠️ 常见问题

### Q1: 数据库修复后还是报错？
A: 重启后端服务：`pm2 restart ai-menu-backend`

### Q2: 管理员登录一直显示密码错误？
A: 确认访问的是 `https://admin.ai-menu.tech/login`，并且使用账号 `admin` / `Yan660328`

### Q3: 生成菜单失败？
A: 临时方案：将「历史菜占比」设为 0%，或先上传历史菜单

---

## 📞 需要帮助？

如果修复后仍有问题，请提供：
1. 执行了哪些命令
2. 完整的错误日志
3. 浏览器Network标签的截图

