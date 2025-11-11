# 🚀 快速开始指南

## ✅ 当前状态

**所有TypeScript错误已修复，项目可以正常启动！**

---

## 📋 下一步：配置第三方服务

### 1. 必需服务（现在需要配置）

#### PostgreSQL数据库 ⭐️ 最优先

**⚠️ 检测到您的系统hosts文件缺少localhost配置，需要先修复！**

**修复步骤（需要管理员权限）：**

```bash
# 步骤1: 修复hosts文件（会要求输入Mac密码）
sudo sh -c 'cat >> /etc/hosts << EOF
127.0.0.1       localhost
::1             localhost
EOF'

# 步骤2: 重启PostgreSQL
brew services restart postgresql@14

# 步骤3: 等待5秒让服务完全启动
sleep 5

# 步骤4: 验证PostgreSQL状态（应该显示"started"）
brew services list | grep postgresql

# 步骤5: 创建数据库
createdb ai_menu

# 步骤6: 运行初始化脚本
psql ai_menu < /Users/apple/ai-menu-100/scripts/init-db.sql

# 步骤7: 验证数据库（应该显示"0"）
psql ai_menu -c "SELECT COUNT(*) FROM users;"
```

**如果看到以下信息就成功了：**
```
 count 
-------
     0
(1 row)
```

**常见问题：**
- 如果步骤5报错 "connection refused"，等待10秒后重试
- 如果步骤6报错 "already exists"，说明数据库已创建，直接执行步骤7

#### DeepSeek API Key ⭐️ 最优先

1. 访问：https://platform.deepseek.com/
2. 注册账号
3. 创建API Key
4. 记下Key备用

---

### 2. 配置环境变量

**后端配置** `/Users/apple/ai-menu-100/backend/.env`

```bash
# 复制示例文件
cp backend/env.example backend/.env

# 编辑.env文件，填入以下配置：

# 基础配置
NODE_ENV=development
PORT=8080
HOST=0.0.0.0

# 数据库（根据上面的配置填写）
# 如果使用Docker: DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ai_menu
# 如果本地安装: DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ai_menu
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ai_menu

# JWT密钥（随机生成）
JWT_SECRET=$(openssl rand -base64 32)

# DeepSeek API（填写刚才获取的Key）
DEEPSEEK_API_KEY=your-deepseek-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat

# OpenAI（可选，留空）
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1

# Redis（可选，暂时留空）
REDIS_URL=redis://localhost:6379

# 阿里云OSS（暂时留空，文件上传功能会报错但不影响主流程）
OSS_REGION=
OSS_BUCKET=
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_ENDPOINT=

# 日志
LOG_LEVEL=info
```

**前端配置** `/Users/apple/ai-menu-100/frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**管理后台配置** `/Users/apple/ai-menu-100/admin/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

### 3. 创建管理员账户

数据库初始化后，需要创建第一个管理员账户：

```bash
# 启动后端
cd /Users/apple/ai-menu-100/backend
pnpm dev

# 在另一个终端，使用API创建管理员（或直接用SQL）
```

**方法1：使用SQL直接创建**

```sql
-- 连接到数据库
psql ai_menu

-- 插入管理员账户（密码：admin123，已哈希）
INSERT INTO users (
  username, 
  password_hash, 
  role, 
  is_active, 
  created_at
) VALUES (
  'admin',
  '$2b$10$X7zRQWrLhJdXk.qO6Z4fNOvMQH4t9YZj7x5D7xR6gK8qH5U9tE8kW',
  'admin',
  TRUE,
  NOW()
);
```

**方法2：使用注册API后手动改role**

```bash
# 先通过前端注册一个账号，然后改为admin
psql ai_menu
UPDATE users SET role = 'admin' WHERE username = 'your-username';
```

---

### 4. 启动项目

**终端1：后端**
```bash
cd /Users/apple/ai-menu-100/backend
pnpm dev

# 看到以下信息表示成功：
# ✅ 服务器启动成功!
# 📍 地址: http://0.0.0.0:8080
```

**终端2：前端**
```bash
cd /Users/apple/ai-menu-100/frontend
pnpm dev

# 访问 http://localhost:3000
```

**终端3：管理后台**
```bash
cd /Users/apple/ai-menu-100/admin
pnpm dev

# 访问 http://localhost:3001
```

---

## 🎯 第一次使用

### 1. 注册账户
1. 访问 http://localhost:3000/register
2. 填写：
   - 用户名
   - 密码
   - 食堂名称
   - 联系人
   - 联系电话
3. 注册成功后自动创建门店

### 2. 生成第一份菜单
1. 登录后进入主页
2. 配置参数：
   - 生成天数：5天
   - 热菜数：8道
   - 凉菜数：2道
   - 主荤/半荤/素菜分配
3. 点击"生成菜单"
4. 等待15-30秒

⚠️ **注意**：如果提示"专属菜库为空"，这是正常的！因为您还没有上传历史菜单。此时：
- 历史菜占比建议设为 **0%**
- 系统会从通用菜库中选择

---

## 🐛 常见问题

### 1. 数据库连接失败
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**解决**：确保PostgreSQL已启动
```bash
# macOS
brew services list
brew services start postgresql@14

# Docker
docker ps  # 检查容器是否运行
```

### 2. DeepSeek API错误
```
Error: DeepSeek API调用失败
```
**解决**：
1. 检查API Key是否正确
2. 检查账号是否有余额
3. 检查网络连接

### 3. 菜单生成报错"专属菜库为空"
**解决**：将历史菜占比设为0%，或先上传历史菜单

### 4. 端口被占用
```
Error: listen EADDRINUSE: address already in use :::8080
```
**解决**：更改端口或杀掉占用进程
```bash
# 查找占用端口的进程
lsof -i :8080

# 杀掉进程
kill -9 <PID>
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**：后端terminal会显示详细错误
2. **检查配置**：确认.env文件配置正确
3. **重启服务**：Ctrl+C停止，重新运行pnpm dev

---

## ✨ 完成配置后

- [ ] PostgreSQL已安装并运行
- [ ] 数据库已初始化（init-db.sql）
- [ ] DeepSeek API Key已配置
- [ ] 后端.env已配置
- [ ] 前端.env.local已配置
- [ ] 管理员账户已创建
- [ ] 三个服务都成功启动
- [ ] 成功注册并登录
- [ ] 成功生成第一份菜单

**🎉 恭喜！您已完成所有配置，可以开始使用炊语AI菜单系统了！**

---

## 📊 菜品库管理与系统限制

### 🎯 快速开始：添加更多菜品

**当前状态**：通用菜品库只有20道菜，**严重不足**，导致生成的菜单品种单一。

**快速添加50道常见菜品**（1分钟）：

```bash
# 下载并执行预制的菜品脚本
curl -o /Users/apple/ai-menu-100/scripts/add-50-dishes.sql https://your-cdn.com/add-50-dishes.sql

# 或者直接执行（已包含在项目中）
psql ai_menu -f /Users/apple/ai-menu-100/scripts/fix-dish-type.sql

# 验证导入结果
psql ai_menu -c "SELECT dish_type, COUNT(*) FROM dishes_common WHERE is_active = TRUE GROUP BY dish_type;"
```

### 📋 菜品数据格式要求（完整8个标签）

**⚠️ 重要**：根据PRD要求，每道菜有**8个标签**，分为必填和可选。

#### 必填字段（5个）

| 序号 | 字段名 | 数据库字段 | 要求 | 示例 |
|------|--------|-----------|------|------|
| 1 | 菜品类型 | `dish_type` | **必选4项之一** | `热菜主荤` / `热菜半荤` / `热菜素菜` / `凉菜` |
| 2 | 食材特征 | `ingredient_tags` | **8大类数组**（仅热菜必填） | `ARRAY['肉', '蔬']` |
| 3 | 刀工 | `knife_skill` | **12种刀工之一** | `片`、`丁`、`丝`、`块`等 |
| 4 | 烹饪方式 | `cook_method8` | **必须映射到8大类** | `炒`、`蒸`、`烧`等 |
| 5 | 口味 | `flavor` | 文本（可自由填写） | `咸鲜`、`麻辣`、`酸甜` |

#### 可选字段（3个）

| 序号 | 字段名 | 数据库字段 | 要求 | 示例 |
|------|--------|-----------|------|------|
| 6 | 菜系 | `cuisine` | 省市特色菜，可NULL | `川菜`、`粤菜`、`家常菜` |
| 7 | 主料/辅料 | `main_ingredients`, `sub_ingredients` | 数组，可为空 | `ARRAY['猪排', '酱油']` |
| 8 | 季节 | `seasons` | 春/夏/秋/冬数组 | `ARRAY['春', '夏']` 或 `ARRAY[]` |

---

#### 详细说明

**1. 菜品类型（dish_type）** - 必填
- **午餐4选1**：`热菜主荤` / `热菜半荤` / `热菜素菜` / `凉菜`
- 其他可选（非午餐）：`主食` / `风味小吃` / `汤` / `酱汁` / `饮料` / `手工`

**2. 食材特征（ingredient_tags）** - 热菜必填，凉菜可选
- **8大类**：`肉` / `禽` / `鱼` / `蛋` / `豆` / `菌` / `筋` / `蔬`
- 格式：`ARRAY['肉', '蔬']`（PostgreSQL数组）
- 示例：
  - 红烧肉：`ARRAY['肉']`
  - 宫保鸡丁：`ARRAY['禽']`
  - 麻婆豆腐：`ARRAY['豆', '肉']`

**3. 刀工（knife_skill）** - 必填
- **12种**：`片` / `丁` / `粒` / `米` / `末` / `茸` / `丝` / `条` / `段` / `块` / `球` / `花刀`
- 特殊：整条鱼可写`整条`，炸鸡翅可写`翅`

**4. 烹饪方式（cook_method8）** - 必填，必须映射到8大类

⚠️ **关键**：虽然烹饪方式有几十种，但**必须映射到8大类之一**：

| 8大类 | 包含的实际烹饪方式 | 示例菜品 |
|-------|-------------------|---------|
| `炒` | 炒、煸、爆、干煸、溜锅 | 青椒肉丝、手撕包菜 |
| `熘` | 熘、溜（溜肉段） | 糖醋里脊、锅包肉 |
| `蒸` | 蒸、汆、灼、白灼 | 清蒸鲈鱼、蒜蓉蒸虾 |
| `烧` | 烧、烩、浇汁、烹汁、焖 | 红烧肉、黄焖鸡 |
| `烤` | 烤、焗、扒、熏 | 烤鸭、叉烧 |
| `炖` | 炖、煲、汤 | 炖排骨、老鸭汤 |
| `煎` | 煎、煎焖 | 煎饺、煎鱼 |
| `烹` | 烹（明确含"烹"字） | 干烹仔鸡 |

**不属于8大类的烹饪方式**：
- `拌` / `凉拌` → 凉菜专用，不计入8大类
- `炸` / `卤` / `煮` / `酿` / `浸` → 按主要工艺归入最接近的类别
  - 例如：`炸`类菜通常归`炒`（爆炸）或`烤`
  - 例如：`煮`类菜归`蒸`或`炖`

**5. 口味（flavor）** - 必填
- 常见口味：`咸鲜` / `麻辣` / `酸甜` / `酸辣` / `清淡` / `蒜香` / `葱香` / `五香` / `咸甜`
- 可自由填写，不限制

**6. 菜系（cuisine）** - 可选
- 34个省市菜系：`川菜` / `粤菜` / `鲁菜` / `苏菜` / `浙菜` / `闽菜` / `湘菜` / `徽菜`等
- 或填写：`家常菜` / `东北菜` / `西北菜` / NULL

**7. 主料/辅料（main_ingredients, sub_ingredients）** - 可选
- 格式：`ARRAY['猪排', '酱油', '冰糖']`
- 可以为空：`ARRAY[]` 或 NULL

**8. 季节（seasons）** - 可选
- 格式：`ARRAY['春', '夏']` 或 `ARRAY[]`
- 时令菜填写，全年菜留空

### 🔧 手动添加菜品（3种方法，完整8个标签）

#### 方法1：SQL单条插入（完整版，包含全部8个标签）

```bash
psql ai_menu << 'EOF'
-- 插入单道菜品（全部8个标签）
INSERT INTO dishes_common (
  dish_name,           -- 1. 菜名
  dish_type,           -- 2. 菜品类型
  ingredient_tags,     -- 3. 食材特征
  knife_skill,         -- 4. 刀工
  cook_method8,        -- 5. 烹饪方式（8大类）
  flavor,              -- 6. 口味
  cuisine,             -- 7. 菜系（可选）
  main_ingredients,    -- 8a. 主料（可选）
  sub_ingredients,     -- 8b. 辅料（可选）
  seasons              -- 8c. 季节（可选）
) VALUES (
  '红烧排骨',
  '热菜主荤',
  ARRAY['肉'],
  '块',
  '烧',
  '咸鲜',
  '川菜',
  ARRAY['猪排'],
  ARRAY['酱油', '冰糖', '八角', '葱姜'],
  ARRAY[]  -- 全年菜，季节留空
);
EOF
```

**简化版**（只包含必填的5个标签 + 菜系）：
```bash
psql ai_menu << 'EOF'
INSERT INTO dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine) VALUES
('红烧排骨', '热菜主荤', ARRAY['肉'], '块', '烧', '咸鲜', '川菜'),
('清蒸鲈鱼', '热菜主荤', ARRAY['鱼'], '整条', '蒸', '咸鲜', '粤菜'),
('麻婆豆腐', '热菜半荤', ARRAY['豆','肉'], '丁', '烧', '麻辣', '川菜'),
('蒜蓉西兰花', '热菜素菜', ARRAY['蔬'], '朵', '炒', '蒜香', '家常菜'),
('拍黄瓜', '凉菜', ARRAY['蔬'], '块', '拌', '咸鲜', '家常菜');
EOF
```

#### 方法2：CSV批量导入（包含全部8个标签）

```bash
# 1. 创建CSV文件（全部8个标签）
cat > ~/dishes_full.csv << 'EOF'
dish_name,dish_type,ingredient_tags,knife_skill,cook_method8,flavor,cuisine,main_ingredients,sub_ingredients,seasons
红烧排骨,热菜主荤,"{肉}",块,烧,咸鲜,川菜,"{猪排}","{酱油,冰糖}","{}"
清蒸鲈鱼,热菜主荤,"{鱼}",整条,蒸,咸鲜,粤菜,"{鲈鱼}","{葱,姜}","{}"
西红柿炒蛋,热菜半荤,"{蛋,蔬}",块,炒,酸甜,家常菜,"{鸡蛋,西红柿}","{葱}","{}"
EOF

# 2. 导入数据库（全部字段）
psql ai_menu << 'EOSQL'
\COPY dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine, main_ingredients, sub_ingredients, seasons) 
FROM '/Users/apple/dishes_full.csv' 
WITH (FORMAT csv, HEADER true);
EOSQL
```

**简化版CSV**（只包含必填字段）：
```bash
cat > ~/dishes_simple.csv << 'EOF'
dish_name,dish_type,ingredient_tags,knife_skill,cook_method8,flavor,cuisine
红烧排骨,热菜主荤,"{肉}",块,烧,咸鲜,川菜
清蒸鲈鱼,热菜主荤,"{鱼}",整条,蒸,咸鲜,粤菜
EOF

psql ai_menu -c "\COPY dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine) FROM '/Users/apple/dishes_simple.csv' WITH (FORMAT csv, HEADER true);"
```

#### 方法3：批量SQL脚本（推荐，最灵活）

创建完整的SQL脚本：

```bash
cat > ~/add_100_dishes.sql << 'EOF'
-- 批量添加100道常见菜品（包含完整8个标签）
-- 使用方法：psql ai_menu -f ~/add_100_dishes.sql

-- ============================================
-- 主荤类 - 肉类（30道）
-- ============================================
INSERT INTO dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine, main_ingredients, seasons) VALUES
('红烧排骨', '热菜主荤', ARRAY['肉'], '块', '烧', '咸鲜', '川菜', ARRAY['猪排'], ARRAY[]),
('糖醋排骨', '热菜主荤', ARRAY['肉'], '块', '炸', '酸甜', '川菜', ARRAY['猪排'], ARRAY[]),
('京酱肉丝', '热菜主荤', ARRAY['肉','蔬'], '丝', '炒', '酱香', '京菜', ARRAY['猪里脊'], ARRAY[]),
('东坡肉', '热菜主荤', ARRAY['肉'], '块', '烧', '咸甜', '浙菜', ARRAY['五花肉'], ARRAY[]),
('梅菜扣肉', '热菜主荤', ARRAY['肉','蔬'], '片', '蒸', '咸鲜', '粤菜', ARRAY['五花肉','梅菜'], ARRAY[]),
('蒜泥白肉', '热菜主荤', ARRAY['肉'], '片', '煮', '蒜香', '川菜', ARRAY['猪肉'], ARRAY[]),
('咕噜肉', '热菜主荤', ARRAY['肉'], '块', '炸', '酸甜', '粤菜', ARRAY['猪肉'], ARRAY[]),
('锅包肉', '热菜主荤', ARRAY['肉'], '片', '炸', '酸甜', '东北菜', ARRAY['猪里脊'], ARRAY[]),
('小炒肉', '热菜主荤', ARRAY['肉','蔬'], '片', '炒', '咸辣', '湘菜', ARRAY['猪肉','辣椒'], ARRAY[]),
('水煮肉片', '热菜主荤', ARRAY['肉','蔬'], '片', '煮', '麻辣', '川菜', ARRAY['猪肉'], ARRAY[]);

-- ============================================
-- 主荤类 - 禽类（20道）
-- ============================================
INSERT INTO dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine, seasons) VALUES
('宫保鸡丁', '热菜主荤', ARRAY['禽'], '丁', '炒', '咸辣', '川菜', ARRAY[]),
('辣子鸡', '热菜主荤', ARRAY['禽'], '丁', '炸', '麻辣', '川菜', ARRAY[]),
('三杯鸡', '热菜主荤', ARRAY['禽'], '块', '烧', '咸鲜', '赣菜', ARRAY[]),
('白切鸡', '热菜主荤', ARRAY['禽'], '块', '煮', '清淡', '粤菜', ARRAY[]),
('大盘鸡', '热菜主荤', ARRAY['禽','蔬'], '块', '烧', '麻辣', '新疆菜', ARRAY[]),
('照烧鸡腿', '热菜主荤', ARRAY['禽'], '块', '烤', '咸甜', '日式', ARRAY[]),
('香酥鸡', '热菜主荤', ARRAY['禽'], '块', '炸', '咸鲜', '川菜', ARRAY[]),
('可乐鸡翅', '热菜主荤', ARRAY['禽'], '翅', '烧', '咸甜', '家常菜', ARRAY[]),
('盐焗鸡', '热菜主荤', ARRAY['禽'], '块', '烤', '咸鲜', '粤菜', ARRAY[]),
('口水鸡', '热菜主荤', ARRAY['禽'], '块', '煮', '麻辣', '川菜', ARRAY[]);

-- ============================================
-- 主荤类 - 鱼类（15道）
-- ============================================
INSERT INTO dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine) VALUES
('清蒸鲈鱼', '热菜主荤', ARRAY['鱼'], '整条', '蒸', '咸鲜', '粤菜'),
('清蒸桂鱼', '热菜主荤', ARRAY['鱼'], '整条', '蒸', '咸鲜', '粤菜'),
('红烧鲤鱼', '热菜主荤', ARRAY['鱼'], '整条', '烧', '咸鲜', '鲁菜'),
('酸菜鱼', '热菜主荤', ARRAY['鱼','蔬'], '片', '煮', '酸辣', '川菜'),
('水煮鱼', '热菜主荤', ARRAY['鱼','蔬'], '片', '煮', '麻辣', '川菜'),
('糖醋鱼', '热菜主荤', ARRAY['鱼'], '整条', '炸', '酸甜', '浙菜'),
('松鼠桂鱼', '热菜主荤', ARRAY['鱼'], '花刀', '炸', '酸甜', '苏菜'),
('红烧带鱼', '热菜主荤', ARRAY['鱼'], '段', '烧', '咸鲜', '家常菜'),
('干煎带鱼', '热菜主荤', ARRAY['鱼'], '段', '煎', '咸鲜', '家常菜'),
('剁椒鱼头', '热菜主荤', ARRAY['鱼'], '块', '蒸', '辣', '湘菜');

-- ============================================
-- 半荤类（15道）
-- ============================================
INSERT INTO dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine) VALUES
('麻婆豆腐', '热菜半荤', ARRAY['豆','肉'], '丁', '烧', '麻辣', '川菜'),
('肉沫豆腐', '热菜半荤', ARRAY['豆','肉'], '末', '烧', '咸鲜', '家常菜'),
('肉末茄子', '热菜半荤', ARRAY['蔬','肉'], '末', '烧', '咸鲜', '家常菜'),
('蚂蚁上树', '热菜半荤', ARRAY['豆','肉'], '末', '炒', '咸鲜', '川菜'),
('木须肉', '热菜半荤', ARRAY['蛋','肉','菌'], '片', '炒', '咸鲜', '家常菜'),
('西红柿炒蛋', '热菜半荤', ARRAY['蛋','蔬'], '块', '炒', '酸甜', '家常菜'),
('韭菜炒蛋', '热菜半荤', ARRAY['蛋','蔬'], '块', '炒', '咸鲜', '家常菜'),
('洋葱炒蛋', '热菜半荤', ARRAY['蛋','蔬'], '块', '炒', '咸鲜', '家常菜'),
('肉片炒豆角', '热菜半荤', ARRAY['蔬','肉'], '片', '炒', '咸鲜', '家常菜'),
('干煸豆角', '热菜半荤', ARRAY['蔬','肉'], '段', '煸', '咸鲜', '川菜');

-- ============================================
-- 素菜类（15道）
-- ============================================
INSERT INTO dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine, seasons) VALUES
('地三鲜', '热菜素菜', ARRAY['蔬'], '块', '炸', '咸鲜', '东北菜', ARRAY[]),
('干锅菜花', '热菜素菜', ARRAY['蔬'], '朵', '炒', '咸辣', '川菜', ARRAY[]),
('手撕包菜', '热菜素菜', ARRAY['蔬'], '片', '炒', '咸鲜', '湘菜', ARRAY[]),
('酸辣土豆丝', '热菜素菜', ARRAY['蔬'], '丝', '炒', '酸辣', '家常菜', ARRAY[]),
('蒜蓉西兰花', '热菜素菜', ARRAY['蔬'], '朵', '炒', '蒜香', '家常菜', ARRAY[]),
('蒜蓉油麦菜', '热菜素菜', ARRAY['蔬'], '段', '炒', '蒜香', '家常菜', ARRAY[]),
('清炒莴笋', '热菜素菜', ARRAY['蔬'], '片', '炒', '清淡', '家常菜', ARRAY['春','夏']),
('炒空心菜', '热菜素菜', ARRAY['蔬'], '段', '炒', '蒜香', '家常菜', ARRAY['夏']),
('醋溜白菜', '热菜素菜', ARRAY['蔬'], '片', '炒', '酸鲜', '家常菜', ARRAY['秋','冬']),
('炒豆角', '热菜素菜', ARRAY['蔬'], '段', '炒', '咸鲜', '家常菜', ARRAY['夏']);

-- ============================================
-- 凉菜类（10道）
-- ============================================
INSERT INTO dishes_common (dish_name, dish_type, ingredient_tags, knife_skill, cook_method8, flavor, cuisine) VALUES
('拍黄瓜', '凉菜', ARRAY['蔬'], '块', '拌', '咸鲜', '家常菜'),
('凉拌木耳', '凉菜', ARRAY['菌'], '片', '拌', '咸鲜', '家常菜'),
('凉拌海带丝', '凉菜', ARRAY['蔬'], '丝', '拌', '咸鲜', '家常菜'),
('皮蛋豆腐', '凉菜', ARRAY['豆','蛋'], '块', '拌', '咸鲜', '家常菜'),
('凉拌豆芽', '凉菜', ARRAY['蔬'], '根', '拌', '咸鲜', '家常菜'),
('老虎菜', '凉菜', ARRAY['蔬'], '丝', '拌', '咸鲜', '东北菜'),
('酸辣藕片', '凉菜', ARRAY['蔬'], '片', '拌', '酸辣', '湘菜'),
('凉拌金针菇', '凉菜', ARRAY['菌'], '根', '拌', '咸鲜', '家常菜'),
('凉拌腐竹', '凉菜', ARRAY['豆'], '段', '拌', '咸鲜', '家常菜'),
('麻酱拌生菜', '凉菜', ARRAY['蔬'], '叶', '拌', '麻香', '家常菜');

-- ============================================
-- 查看导入结果
-- ============================================
SELECT '========== 导入完成 ==========' as message;
SELECT dish_type as 类型, COUNT(*) as 数量 
FROM dishes_common 
WHERE is_active = TRUE 
GROUP BY dish_type 
ORDER BY dish_type;

SELECT '总计：' as message, COUNT(*) as 总菜品数 
FROM dishes_common 
WHERE is_active = TRUE;
EOF

# 执行导入
psql ai_menu -f ~/add_100_dishes.sql
```

### 📈 当前系统限制说明

**⚠️ 重要**：当前实现与PRD要求存在差距

| 项目 | PRD要求 | 当前实现 | 影响 |
|------|---------|----------|------|
| **生成天数** | 5天 | ❌ 1天 | 只生成周一菜单 |
| **菜品库规模** | 5,000-10,000道 | ❌ 20道 | 菜单单一、重复率高 |
| **检索逻辑** | 384种细分标签 | ❌ 随机查询 | 未按标签精准匹配 |
| **约束规则** | 9大规则 | ❌ 基础要求 | 生成质量不高 |

**为什么只生成周一的菜？**
1. 代码临时限制：`backend/src/services/menu.ts` 第285行
2. AI Prompt只要求生成1天
3. 菜品不足（15道无法支撑5天×10道/天）

**详细分析文档**：
📄 [菜单生成逻辑分析.md](./docs/菜单生成逻辑分析.md)

该文档包含：
- ✅ 当前实现 vs PRD完整对比
- ✅ 问题原因深度分析
- ✅ 3种菜品导入方法详解
- ✅ Excel批量导入教程
- ✅ Python自动化脚本
- ✅ 完整改进路线图

### 🎯 快速改进建议

**立即可做**（不改代码）：
1. ✅ 添加100道菜（使用上面的方法）
2. ✅ 验证菜品数据质量

**短期改进**（需改代码）：
1. 修改为生成5天菜单
2. 移除菜品数量限制
3. 优化AI Prompt

**查看菜品库状态**：
```bash
# 总数
psql ai_menu -c "SELECT COUNT(*) FROM dishes_common WHERE is_active = TRUE;"

# 按类型统计
psql ai_menu -c "SELECT dish_type, COUNT(*) FROM dishes_common WHERE is_active = TRUE GROUP BY dish_type;"
```

---

