# 🚀 项目启动指南

## ✅ 配置已完成

- ✅ PostgreSQL数据库已配置
- ✅ DeepSeek API Key已配置
- ✅ 后端环境变量已配置
- ✅ 前端环境变量已配置

---

## 📱 启动步骤

### 1. 启动后端（终端1）

```bash
cd /Users/apple/ai-menu-100/backend
pnpm dev
```

**成功标志：** 看到类似以下输出
```
Server listening at http://0.0.0.0:8080
✅ 服务器启动成功!
```

**如果有错误：** 仔细查看错误信息，常见问题：
- 数据库连接失败 → 检查PostgreSQL是否运行 `brew services list`
- 端口被占用 → 修改 `backend/.env` 中的 `PORT=8081`

---

### 2. 启动前端（终端2）

**等后端启动成功后，再开一个新终端：**

```bash
cd /Users/apple/ai-menu-100/frontend
pnpm dev
```

**成功标志：** 看到
```
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

然后访问：**http://localhost:3000**

---

### 3. 启动管理后台（终端3，可选）

```bash
cd /Users/apple/ai-menu-100/admin
pnpm dev
```

访问：**http://localhost:3001**

---

## 🎯 第一次使用

### 步骤1: 注册账户

1. 打开浏览器访问 **http://localhost:3000/register**
2. 填写表单：
   - 用户名：例如 `admin`
   - 密码：例如 `admin123`
   - 食堂名称：例如 `测试食堂`
   - 联系人：您的名字
   - 联系电话：您的电话
3. 点击注册

**注册成功后会自动登录**

---

### 步骤2: 生成第一份菜单

1. 登录后进入主页
2. 配置参数：
   - **生成天数**：5天
   - **午/晚餐**：午餐
   - **热菜总数**：8道
   - **凉菜数**：2道
   - **主荤菜**：3道
   - **半荤菜**：3道
   - **素热菜**：2道
   - **历史菜占比**：0%（因为还没有上传历史菜单）

3. 点击 **"生成菜单"** 按钮
4. 等待 **15-30秒**（AI生成需要时间）
5. 查看生成的菜单！

---

## ⚠️ 重要提示

### 关于"历史菜占比"

第一次使用时，专属菜库是空的，所以：
- ✅ 把"历史菜占比"设为 **0%**
- ✅ 系统会从通用菜库中选择菜品
- 📤 后续可以通过上传Excel历史菜单来丰富专属菜库

### 关于通用菜库

目前通用菜库（`dishes_common`表）是空的！这意味着：
- ❌ 第一次生成可能会失败
- ✅ 需要先添加一些通用菜品数据

---

## 🍳 添加测试菜品数据

在开始生成菜单前，需要先添加一些菜品到数据库。运行以下命令：

```bash
psql ai_menu << 'EOF'
-- 插入测试菜品到通用菜库
INSERT INTO dishes_common (dish_name, dish_type, cook_method8, ingredient_tags, knife_skill, flavor, is_spicy) VALUES
('宫保鸡丁', 'hot_dish', '爆炒', ARRAY['鸡肉', '花生'], '丁', '咸鲜', true),
('麻婆豆腐', 'hot_dish', '烧', ARRAY['豆腐', '猪肉'], '丁', '麻辣', true),
('红烧肉', 'hot_dish', '烧', ARRAY['猪肉'], '块', '咸甜', false),
('清蒸鲈鱼', 'hot_dish', '蒸', ARRAY['鱼'], '整条', '咸鲜', false),
('西红柿炒鸡蛋', 'hot_dish', '爆炒', ARRAY['西红柿', '鸡蛋'], '块', '酸甜', false),
('青椒肉丝', 'hot_dish', '爆炒', ARRAY['青椒', '猪肉'], '丝', '咸鲜', false),
('糖醋里脊', 'hot_dish', '炸', ARRAY['猪肉'], '条', '酸甜', false),
('鱼香肉丝', 'hot_dish', '爆炒', ARRAY['猪肉', '木耳'], '丝', '咸鲜', true),
('回锅肉', 'hot_dish', '爆炒', ARRAY['猪肉', '青椒'], '片', '咸鲜', true),
('水煮鱼', 'hot_dish', '煮', ARRAY['鱼', '豆芽'], '片', '麻辣', true),
('黄焖鸡', 'hot_dish', '烧', ARRAY['鸡肉', '土豆'], '块', '咸鲜', false),
('小炒肉', 'hot_dish', '爆炒', ARRAY['猪肉', '青椒'], '片', '咸鲜', true),
('蒜蓉西兰花', 'hot_dish', '爆炒', ARRAY['西兰花', '大蒜'], '朵', '咸鲜', false),
('干煸豆角', 'hot_dish', '煸', ARRAY['豆角', '猪肉'], '段', '咸鲜', false),
('手撕包菜', 'hot_dish', '爆炒', ARRAY['包菜'], '片', '咸鲜', false),
('酸辣土豆丝', 'cold_dish', '拌', ARRAY['土豆'], '丝', '酸辣', true),
('凉拌黄瓜', 'cold_dish', '拌', ARRAY['黄瓜'], '条', '咸鲜', false),
('凉拌木耳', 'cold_dish', '拌', ARRAY['木耳'], '片', '咸鲜', false),
('拍黄瓜', 'cold_dish', '拌', ARRAY['黄瓜'], '块', '咸鲜', false),
('凉拌海带丝', 'cold_dish', '拌', ARRAY['海带'], '丝', '咸鲜', false);

-- 查看插入的数据
SELECT COUNT(*) as total_dishes FROM dishes_common;
EOF
```

**看到 `total_dishes | 20` 就成功了！**

---

## 🔍 验证一切正常

运行以下命令检查：

```bash
# 1. 检查数据库
psql ai_menu -c "SELECT COUNT(*) FROM dishes_common;"
# 应该显示 20

# 2. 检查后端API
curl http://localhost:8080/api/health 2>/dev/null || echo "后端未启动"

# 3. 检查前端
curl http://localhost:3000 2>/dev/null | head -5 || echo "前端未启动"
```

---

## 🎉 开始使用

一切就绪后：

1. 访问 http://localhost:3000
2. 注册/登录
3. 配置参数（历史菜占比设为0%）
4. 点击"生成菜单"
5. 等待15-30秒
6. 查看您的第一份AI生成菜单！

---

## 🆘 遇到问题？

### 后端启动失败
```bash
# 查看详细错误
cd /Users/apple/ai-menu-100/backend
pnpm dev
# 仔细阅读错误信息
```

### 前端启动失败
```bash
# 查看详细错误
cd /Users/apple/ai-menu-100/frontend
pnpm dev
```

### 菜单生成失败
- 检查后端terminal是否有错误日志
- 确认DeepSeek API Key是否正确
- 确认通用菜库有数据（运行上面的SQL）

---

**祝您使用愉快！** 🚀

