# 炊语智能菜单生成系统 PRD

[TOC]

## 项目概述

搭建一个web，已有域名 ai-menu.tech, 最后要求网站可以不翻墙就能正常使用，用户地区在中国

“炊语”智能菜单生成系统

中间需要用到的在第三方网站开账户（比如阿里云的相关产品）的，请先预留出来接口，最后梳理出一整份文档md放在代码文件夹里面，说明需要开哪些账户，按什么格式命名，填写什么信息等等，需要我提供什么信息，最后我们再一起把这些第三方产品接进来，完善web的搭建

## 数据库存储说明

说明：后台数据库有两种存储形式，一种是菜品dish，一种是菜单menu. 

菜品dish分为两类，一类是独属于某个食堂的，一类是通用的给所有食堂用的，需要单独作为一个标签来标明；其他的标签是7如下这些种类：

1. 菜品类型：热菜主荤/热菜半荤/热菜素菜/凉菜/主食/风味小吃/汤/酱汁/饮料/手工，对于以下午餐菜单生成，只涉及热菜主荤、热菜半荤、热菜素菜、凉菜这四种

2. （仅对于热菜）食材特征：肉/禽/鱼/蛋/豆/菌/筋/蔬，共8种

3. 刀工：片、丁、粒、米、末、茸、丝、条、段、块、球、花刀，共12种

4. 菜系：34个省市自治区特色菜，在此不穷举；有些菜不属于任何一个菜系，所以可能会void

5. 烹饪方式： 炒、熘、蒸、烧、烤、炖、煎、烹、炸、焗、 煨、浇汁、烩、汆、灼（、 ⽩灼）、 焖、淋、煲、 卤、扒、熏、煮、煸、酿、爆、 烹汁、汤、浸、拌（、 凉拌）、 溜等；在此不穷举

6. 口味：过多，不穷举，且随时有新的口味的菜加入菜品库

7. 主料、辅料：具体到牛肉、牛腩、翅中、多春鱼这样的，不穷举

8. 季节：春夏秋冬，有些菜是时令菜，有些不是

菜单menu分为两类，一类是用户自己手动上传的，还有一类是我们这个网站AI生成的，这两类都是归属于这个食堂自己id底下的。

每一次ai生成完后会自动存储到生成的菜单数据库里面，并且把生成时候的选项也记录下来。前端页面的7种选项，当时是用户自己操作的，记录下：

1. 每天热菜总数

2. 每天主荤热菜数量

3. 每天半荤热菜数量

4. 每天素菜热菜数量

5. 每天凉菜数量

6. 人员配置是否紧缺

7. 使用到的烹饪方法（炒、熘、蒸、烧、烤、炖、煎、烹8种烹饪方法，多选）

8. 辣味菜占比（如果用户选的是不辣那么0，如果选的微辣那么0.15，如果选的中辣那么0.30）

9. 是否满足每餐风味不少于5种：true/false

10. 每餐原材料多样性是否满足要求：无要求/不少于4种/不少于5种/不少于6种

11. 再加一个字段

    ```js
    "analysis": {
          "auto_parsed": false,
          "confidence": 1.0,
          "status": "generated_by_system"
        }
    ```


用户上传的菜单，也会在上传的那一刻自动触发AI，来解析两种东西：1. 把每一道菜单拎出来都解析出相应的7种标签，并且把一周的所有菜（及其解析后结果）存储到“独属于这个食堂的菜品数据库”里面；2. 把这整个菜单menu解析出来如下信息（完全对应AI生成的菜单记录下来的选项参数）：

1. 每天热菜总数

2. 平均每天主荤热菜数量（用总的主荤热菜数量除以5）

3. 平均每天半荤热菜数量

4. 平均每天素菜热菜数量

5. 每天凉菜数量

6. 人员配置是否紧缺（如果每天的复杂刀工菜品出现在小于等于两道，那么判断为紧缺，如果有超过两道的天数，则判断为宽裕）

7. 使用到的烹饪方法（从炒、熘、蒸、烧、烤、炖、煎、烹8种烹饪方法中选择，多选）

8. 辣味菜占比（用辣菜数量除以总的菜的数量并化成小数点后两位的数）

9. 是否满足每餐风味不少于5种：true/false

10. 每餐原材料多样性是否满足要求：无要求/不少于4种/不少于5种/不少于6种（这个需要AI去判断，肉、禽、鱼、蛋、豆、筋、菌、蔬8种之中，每餐都出现了几样，如果五天里每天都满足出现了大于等于4/5/6种，那么就是选不少于4/5/6种，往要求严苛了算，如果有的天数不符合，那么就选择无要求）

11. 再加一个字段

    ```js
    "analysis": {
          "auto_parsed": true,
          "confidence": （让AI来衡量一下这个标注总体的置信度如何）,
          "status": "uploaded_by_user"
        }
    ```

### **一、数据模型（ER 与字段）**

#### 1) dishes_common（通用菜库，人工后期筛选用）

> 你决定“上传时只入食堂库，后期人工再筛进通用库”。因此通用库主要靠运营迁移，不自动写入。

- id UUID PK
- dish_name TEXT NOT NULL
- dish_type TEXT NOT NULL —（热菜主荤/热菜半荤/热菜素菜/凉菜/主食/风味小吃/汤/酱汁/饮料/手工）
- ingredient_tags TEXT[] —（肉/禽/鱼/蛋/豆/菌/筋/蔬，可多选；仅热菜时有意义）
- knife_skill TEXT NULL  —（片/丁/粒/米/末/茸/丝/条/段/块/球/花刀）
- cuisine TEXT NULL    —（34 地方菜系或 NULL）
- cook_method8 TEXT NOT NULL —（**八大归一法**：炒/熘/蒸/烧/烤/炖/煎/烹）
- flavor TEXT NULL    —（自由文本，可多样，不穷举）
- main_ingredients TEXT[] NULL
- sub_ingredients TEXT[] NULL
- seasons TEXT[] NULL   —（春/夏/秋/冬，或空数组）
- analysis JSONB NOT NULL DEFAULT ‘{}’ —（统一结构，见下）
- created_at TIMESTAMPTZ DEFAULT now()
- is_active BOOLEAN DEFAULT TRUE

> 备注：通用库**不参与自动写入**，只人工迁移。字段与 store 库保持一致，方便复制。

#### 2) dishes_store（食堂专属菜库，上传解析时必须写入）

- id UUID PK
- store_id UUID NOT NULL
- dish_name TEXT NOT NULL
- dish_type TEXT NOT NULL
- ingredient_tags TEXT[]
- knife_skill TEXT NULL
- cuisine TEXT NULL
- cook_method8 TEXT NOT NULL
- flavor TEXT NULL
- main_ingredients TEXT[] NULL
- sub_ingredients TEXT[] NULL
- seasons TEXT[] NULL
- common_dish_id UUID NULL —（**可选**，后续人工对齐到通用库时填）
- analysis JSONB NOT NULL DEFAULT ‘{}’
- created_at TIMESTAMPTZ DEFAULT now()
- is_active BOOLEAN DEFAULT TRUE

**唯一性建议**（避免同店同名疯狂重复）：

- 唯一约束 (store_id, dish_name)；若确实需同名不同做法，可追加 variant_hash 之类区分，这里先不启用。

**analysis 统一结构（两表同用）**：

```json
{
  "auto_parsed": true|false,
  "confidence": 0.0-1.0,
  "status": "uploaded_by_user" | "generated_by_system" | "human_verified"
}
```

#### 3) menus（菜单，上传与生成共用一张表，字段一致）

顶层字段:

- id UUID PK
- org_id UUID NULL
- store_id UUID NOT NULL
- source_type TEXT CHECK IN (‘uploaded’,‘generated’)
- title TEXT NULL
- days INT NOT NULL DEFAULT 5
- meal_type TEXT NOT NULL DEFAULT ‘lunch’
- menu_items_json JSONB NOT NULL —**仅存菜名与 dish_id 引用（#11 你说“可以有”，此处就落地为必填引用）**
- gen_options_json JSONB NULL —**上传也写入，填“推导出的等价选项”，保持命名统一**
- menu_stats_json JSONB NULL —（统计汇总：实际数量、辣度占比、方法覆盖等）
- embedding_menu VECTOR(1536) NULL
- used_history_ratio NUMERIC(5,2) NULL —（仅生成有意义，上传可 NULL）
- created_by_user_id UUID NULL
- created_at TIMESTAMPTZ DEFAULT now()
- is_active BOOLEAN DEFAULT TRUE
- meta_json JSONB NOT NULL DEFAULT ‘{}’ —（如 review_status、解析流水线状态等）

##### menu_items_json（统一结构）

> 只列**菜名**与**对应 store 菜库 dish_id**（上传时异步解析完成后补写 dish_id；初始可先用 null 占位）

```json
{
  "days": [
    {
      "day_label": "周一",
      "lunch": [
        { "dish_name": "可乐鸡翅", "dish_id": "uuid-or-null" },
        { "dish_name": "青笋炒肉片", "dish_id": "uuid-or-null" },
        { "dish_name": "蒜蓉西兰花", "dish_id": "uuid-or-null" },
        { "dish_name": "拍黄瓜", "dish_id": "uuid-or-null" }
      ]
    },
    {
      "day_label": "周二",
      "lunch": [
        { "dish_name": "红烧排骨", "dish_id": "uuid-or-null" },
        { "dish_name": "宫保鸡丁", "dish_id": "uuid-or-null" },
        { "dish_name": "清炒圆白菜", "dish_id": "uuid-or-null" },
        { "dish_name": "凉拌黄瓜", "dish_id": "uuid-or-null" }
      ]
    }
  ]
}
```

> 解析任务结束后：**必须补齐 dish_id**（指向 dishes_store.id），这样菜单→菜的映射固定下来，后续检索/统计就稳定。

##### gen_options_json（上传与生成统一命名）

> 对“生成菜单”是**用户当时选项**；

> 对“上传菜单”是**AI 推断出的等价选项**；

> 两者字段完全一致，analysis 子字段标识来源与可信度。

```json
{
  "hot_dish_total_per_day": 9,          // 每天热菜总数
  "main_meat_per_day": 3,               // 每天主荤热菜数量（上传=平均）
  "half_meat_per_day": 3,               // 每天半荤热菜数量（上传=平均）
  "veggie_hot_per_day": 3,              // 每天素菜热菜数量（上传=平均）
  "cold_per_day": 1,                    // 每天凉菜数量（上传=平均）

  "staffing_tight": true,               // 人员配置是否紧缺（上传按刀工规则推断）
  "cook_method8_used": ["炒","烧","蒸"], // **仅八大类**（上传做映射）
  "spicy_ratio_target": 0.00,           // 生成：0/0.15/0.30；上传：按实际辣菜占比四舍五入到 0/0.15/0.30
  "flavor_diversity_required": false,   // 是否满足“每餐口味≥5种”
  "ingredient_diversity_requirement": "无要求", // /≥4/≥5/≥6（上传按“五天全满足才算”）
  "used_history_ratio":0.3

  "embedding_menu": [
    0.12, -0.45, 0.07, 0.33, "... 直到1536维 ..."
  ],

  "used_history_ratio": 0.70,//用户在选项中选择的值，0，0.3,0.5,0.7,1

  "created_by_user_id": "6b2a4d28-c42b-4ad3-b157-7e964c80a12b",
  "created_at": "2025-10-27T10:15:00+08:00",

  "is_active": true,
  
  "analysis": {
    "auto_parsed": true|false,
    "confidence": 0.0-1.0,
    "status": "uploaded_by_user" | "generated_by_system"
  }
}
```

> 说明：

- 你要求“上传推断为**平均/等价**参数”，因此这里就按你的规则生成**per_day 平均**。
- spicy_ratio_target（上传）：把实际辣菜占比 0.00~1.00 映射到 {0, 0.15, 0.30} 中**最接近**的一个值，便于后续规则筛选。
- “只允许八大烹饪法”要求：解析时用**映射字典**归一到 {炒/熘/蒸/烧/烤/炖/煎/烹}。

##### menu_stats_json（两类菜单都写）

> 这是“**实际观测**”统计，区别于上面的“用户参数/等价参数”。字段一致，便于横向对比。

```json
{
  "actual_main_meat_per_day": 3,
  "actual_half_meat_per_day": 3,
  "actual_veggie_hot_per_day": 3,
  "actual_cold_per_day": 1,

  "actual_spicy_ratio": 0.11,              // 辣菜占比（0~1，两位小数）
  "methods_used8": ["炒","烧","拌","炖"], // 解析后再映射到八大；“拌”不在八大中，可不计或忽略
  "passed_flavor_diversity": true,         // “五天里大多数天≥5种” or 你要求“每天都≥5种”？（你已确认：每天都满足才算 true → 我们按更严）
  "ingredient_diversity_actual": "≥5",     // 实际判定：无/≥4/≥5/≥6（**上传=五天全满足**才给该值，否则“无”）
  
  "embedding_menu": [
    0.12, -0.45, 0.07, 0.33, "... 直到1536维 ..."
  ],

  "used_history_ratio": 0.47,//实际观测的历史菜单占比

  "created_by_user_id": "6b2a4d28-c42b-4ad3-b157-7e964c80a12b",
  "created_at": "2025-10-27T10:15:00+08:00",

  "is_active": true,

  "analysis": {
    "auto_parsed": true|false,
    "confidence": 0.0-1.0,
    "status": "uploaded_by_user" | "generated_by_system" | "human_verified"
  }
}
```

> 注意：你第 9 条确认“**全 5 天都得满足**才算”，因此 passed_flavor_diversity 也按**严规则**执行。

### **二、异步解析流水线（不阻塞用户）**

> 你第 5 条要求“不让用户等”，因此采用**先落库、后异步解析**的模式。

**/menu/upload 流程**

1. 立即落库 menus：

   

   - source_type='uploaded'
   - 写入原始 menu_items_json（dish_id 可先置 null）
   - gen_options_json=null、menu_stats_json=null
   - meta_json.pipeline_status='pending_parse'
   - 立刻返回 menu_id 给前端（不阻塞）

   

2. 推送异步任务（Queue/Job）：parse_menu_and_upsert_dishes(store_id, menu_id)

3. 后台解析任务执行：

   a. **逐菜解析** → 标注 7 类标签 → **归一 cook_method 到八大** → **UPSERT 到 dishes_store**（analysis.auto_parsed=true，status='uploaded_by_user'）。

   b. 用解析结果推导**等价 gen_options_json**（你的 1~10 条参数）并填 analysis.auto_parsed=true。

   c. 计算 menu_stats_json（实际数量/辣度/方法/多样性），填 analysis.auto_parsed=true。

   d. 回填 menu_items_json.days[].lunch[].dish_id。

   e. 生成/重算 embedding_menu。

   f. 更新 meta_json.pipeline_status='parsed'。

> **幂等**：以 menu_id 为幂等键；重复任务不重复插入。

> **失败重试**：失败时 meta_json.pipeline_status='parse_failed'，记录 error。

**/menu/generate 流程**

- 同步写入（或半同步）：
  - source_type='generated'
  - gen_options_json = 用户页面选择（analysis.auto_parsed=false, status=‘generated_by_system’）
  - menu_stats_json = 生成器产出（analysis.auto_parsed=false）
  - 同步 upsert dishes_store（以“生成菜名”也入专属库，status=‘generated_by_system’）
  - embedding 同步/异步均可（建议异步）
  - meta_json.pipeline_status='generated'

### **三、关键校验与映射**

#### 1) 八大烹饪法归一（强制）

- 词典（示例）：
  - 炒系 → 炒/煸/爆/溜（*溜=熘*）→ 归“炒”或“熘”？
    - 你指定保留“熘”这个类，因此：
      - 含“熘/溜/溜肉”等 → “熘”；
      - 否则“炒/煸/爆/干煸”等 → “炒”。
  - 蒸系 → 蒸/汆/灼/白灼 → 统一“蒸”
  - 烧系 → 烧/烹汁/烩/浇汁 → 统一“烧”
  - 烤系 → 烤/焗/扒/熏 → 统一“烤”
  - 炖系 → 炖/煲/汤（炖汤） → 统一“炖”
  - 煎系 → 煎/煎焖 → 统一“煎”
  - 烹系 → “烹”（明确词命中）
  - 其他（卤/煮/拌/凉拌/…）→ **忽略**（不进入八大列表）

> 这保证 cook_method8_used/methods_used8 **只会出现八大成员**。

#### **2) 人员紧缺推断（上传）**

- “若**每天**复杂刀工（丝/丁/片等）菜品数 ≤ 2，则紧缺；如存在任意一天 > 2，则宽裕”。
- 刀工复杂清单：["片","丁","丝","末","茸","粒","米","条","段","块","球","花刀"]（**全算复杂**，阈值=2）

#### **3) 多样性判定（上传）**

- 原材料多样性：以 8 大原材料类（肉/禽/鱼/蛋/豆/菌/筋/蔬）为全集；**每餐**统计出现类目的个数；
- 若**5 天全部**达到阈值（≥4/≥5/≥6），则返回相应级别；否则“无要求”。
- 口味多样性：**每天**口味种类≥5；5 天**全满足**才算 true（你选的更严口径）。

### **四、统一 analysis 字段（两端一致）**

- **dishes_store / dishes_common / menus / gen_options_json / menu_stats_json** 中的 analysis 子段都统一成：

```json
{
  "auto_parsed": true|false,
  "confidence": 0.00-1.00,
  "status": "uploaded_by_user" | "generated_by_system" | "human_verified"
}
```

- 这样上传与生成**完全同名**，便于 RAG 混检与规则过滤。

### **五、SQL（核心表与索引）**

> 只放“新增或与你现在不同的关键位”，便于你合并到迁移里。

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 通用菜库（人工筛选入）
CREATE TABLE IF NOT EXISTS dishes_common (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_name TEXT NOT NULL,
  dish_type TEXT NOT NULL,
  ingredient_tags TEXT[],
  knife_skill TEXT,
  cuisine TEXT,
  cook_method8 TEXT NOT NULL,   -- 炒/熘/蒸/烧/烤/炖/煎/烹
  flavor TEXT,
  main_ingredients TEXT[],
  sub_ingredients  TEXT[],
  seasons TEXT[],
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 食堂专属菜库（上传解析时必须落这里）
CREATE TABLE IF NOT EXISTS dishes_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL,
  dish_name TEXT NOT NULL,
  dish_type TEXT NOT NULL,
  ingredient_tags TEXT[],
  knife_skill TEXT,
  cuisine TEXT,
  cook_method8 TEXT NOT NULL,
  flavor TEXT,
  main_ingredients TEXT[],
  sub_ingredients  TEXT[],
  seasons TEXT[],
  common_dish_id UUID NULL REFERENCES dishes_common(id),
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (store_id, dish_name)
);

-- 菜单（上传与生成统一）
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NULL,
  store_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('uploaded','generated')),
  title TEXT,
  days INT NOT NULL DEFAULT 5,
  meal_type TEXT NOT NULL DEFAULT 'lunch',

  -- 仅菜名与 dish_id 引用（dish_id 初始可 null，解析后回填）
  menu_items_json JSONB NOT NULL,

  -- 生成参数（上传=AI推导的等价参数；生成=用户选择）
  gen_options_json JSONB,
  -- 实际统计（两类都写）
  menu_stats_json JSONB,

  embedding_menu VECTOR(1536),
  used_history_ratio NUMERIC(5,2),

  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  meta_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_dishes_store_by_store ON dishes_store(store_id);
CREATE INDEX IF NOT EXISTS idx_dishes_store_name ON dishes_store(store_id, dish_name);
CREATE INDEX IF NOT EXISTS idx_menus_store_source ON menus(store_id, source_type);
CREATE INDEX IF NOT EXISTS idx_menus_items_gin ON menus USING GIN (menu_items_json);
CREATE INDEX IF NOT EXISTS idx_menus_genopts_gin ON menus USING GIN (gen_options_json);
CREATE INDEX IF NOT EXISTS idx_menus_stats_gin ON menus USING GIN (menu_stats_json);
CREATE INDEX IF NOT EXISTS idx_menus_meta_gin  ON menus USING GIN (meta_json);

CREATE INDEX IF NOT EXISTS idx_menus_embedding
  ON menus USING ivfflat (embedding_menu vector_cosine_ops) WITH (lists = 100);
```

### **六、关键接口与伪实现（Cursor 可直接生成 TS）**

#### **1) 上传菜单（异步解析，不阻塞）**

POST /menu/upload

**Request**

```json
{
  "orgId": "uuid-or-null",
  "storeId": "uuid",
  "createdByUserId": "uuid-or-null",
  "title": "可选",
  "menuItems": {
    "days": [
      { "day_label": "周一", "lunch": ["可乐鸡翅","青笋炒肉片","蒜蓉西兰花","拍黄瓜"] },
      { "day_label": "周二", "lunch": ["红烧排骨","宫保鸡丁","清炒圆白菜","凉拌黄瓜"] }
    ]
  }
}
```

**Sync 落库（立即返回）**

- source_type='uploaded'
- menu_items_json 转换为含 dish_id:null 的结构
- 其余解析字段先置空；meta_json.pipeline_status='pending_parse'
- 返回 menuId

**后台 Job：parse_menu_and_upsert_dishes(menuId, storeId)**

- 逐菜解析 → 归一八大 → UPSERT dishes_store（analysis.auto_parsed=true,status='uploaded_by_user'）
- 回填 dish_id 到 menu_items_json
- 推导 **gen_options_json（等价参数）**（含 analysis）
- 计算 **menu_stats_json**（含 analysis）
- 生成 **embedding_menu**
- meta_json.pipeline_status='parsed'

## **2) 生成菜单（同步/半同步）**

POST /menu/generate

- body = 你前端 1~10 项选项 + 生成结果的菜名列表（含周结构）
- 同步：写 menus（source_type='generated'）、写 gen_options_json（analysis=false, status=‘generated_by_system’）、写 menu_stats_json
- 同步 upsert dishes_store（status=‘generated_by_system’）
- 异步生成 embedding_menu（或同步视性能）

### **七、提示词**（用于解析用户上传的菜单）

#### System 提示词（固定写死）

```json
你是一名团餐数据解析员，职责是：从“某食堂上传的一周午餐菜单”（仅有菜名）中，自动解析两类数据：
(1) 菜级别：把每道菜解析成结构化标签，形成食堂专属菜库的 upsert 数据（dishes_store_upserts）；
(2) 菜单级别：根据整周菜单计算 gen_options_json（等价生成参数）与 menu_stats_json（实际统计），并给出 menu_items_json（仅含菜名与 dish_id:null 占位，由后端回填）。

【唯一输出要求】
- 你必须只输出一个 JSON 对象，且满足下方“输出 JSON Schema”。
- 不要输出任何自然语言、注释、反引号、解释。
- 所有枚举与字段名必须与 Schema 完全一致。
- 数值字段若要求“0~1小数”，一律保留两位小数；若要求“整数”，四舍五入取整。

【菜级别解析（dishes_store_upserts）规则】
1) 字段与取值：
   - dish_name: 原始菜名（字符串）
   - dish_type: 枚举（以下其一）
     ["热菜主荤","热菜半荤","热菜素菜","凉菜","主食","风味小吃","汤","酱汁","饮料","手工"]
     * 本次菜单仅午餐，可出现前四类；若你判断为其他类也可按规则填。
   - ingredient_tags: 从下列 8 大原料类中多选，未出现则为空数组：
     ["肉","禽","鱼","蛋","豆","菌","筋","蔬"]
     * 仅热菜有意义；凉菜也可据名称判断是否有“蔬”等。
   - knife_skill: 可为空或从
     ["片","丁","粒","米","末","茸","丝","条","段","块","球","花刀"]
     中选其一（按菜名常识推断）
   - cuisine: 34 省市自治区菜系名或 null（不确定则 null）
   - cook_method8: 将实际烹饪方式**归一映射**到 8 大类之一，必填：
     ["炒","熘","蒸","烧","烤","炖","煎","烹"]
     ★ 映射字典（只保留 8 大之一）：
       - 炒系 → "炒"：炒/煸/爆/干煸/急火快炒/溜锅等（不含“熘”专指）
       - 熘系 → "熘"：熘/溜（“溜肉段”也算熘）
       - 蒸系 → "蒸"：蒸/汆/灼/白灼 等
       - 烧系 → "烧"：烧/烩/浇汁/烹汁 等
       - 烤系 → "烤"：烤/焗/扒/熏 等
       - 炖系 → "炖"：炖/煲/（炖）汤 等
       - 煎系 → "煎"：煎/煎焖 等
       - 烹系 → "烹"：明确含“烹”字眼
       - 其他（卤/煮/拌/凉拌/酿/汤/浸/爆（若非爆炒）等）→ **忽略并不入 8 大**；如必须二选一，则按主要工艺常识归入最相近的一类（如“卤煮”→“煮”归“蒸系？否”，更近似“炖/煮”→选“炖”或“烧”，二者取更常见的一种，一般“卤煮”→“煮”近“烧/炖”，优先“炖”）
       ★ 如无法判断，选最常见的“炒”
   - flavor: 口味（字符串，自由文本，如“甜”、“酸辣”、“五香”、“清淡”），未知则 null
   - main_ingredients / sub_ingredients: 字符串数组，未知留空数组
   - seasons: ["春","夏","秋","冬"] 的子集，无法判断则空数组
   - analysis: 统一结构：
     {
       "auto_parsed": true,
       "confidence": 0.00~1.00（两位小数，小数点形式）,
       "status": "uploaded_by_user"
     }

2) 唯一性：同一 store 内（由后端填）同名菜建议唯一；本输出不做去重，由后端 UPSERT。

【菜单级解析（gen_options_json / menu_stats_json / menu_items_json）规则】
1) menu_items_json：
   结构为：
   {
     "days": [
       { "day_label": "周一", "lunch": [ { "dish_name":"xxx", "dish_id": null }, ... ] },
       ...
     ]
   }
   仅列菜名，dish_id 必须置 null（后端回填）。

2) gen_options_json（上传菜单的“等价生成参数”）字段与取值（全部必有）：
   {
     "hot_dish_total_per_day": <整数>,      // 每天热菜总数 = (主荤+半荤+素热菜) 的日均值，四舍五入
     "main_meat_per_day": <整数>,           // 平均每天主荤数，四舍五入
     "half_meat_per_day": <整数>,           // 平均每天半荤数，四舍五入
     "veggie_hot_per_day": <整数>,          // 平均每天素热菜数，四舍五入
     "cold_per_day": <整数>,                // 平均每天凉菜数，四舍五入

     "staffing_tight": <true|false>,        // 人员紧缺：若“任意一天”复杂刀工菜数 > 2 ⇒ false（宽裕）；否则 true（紧缺）
     "cook_method8_used": <string[]>,       // 本周覆盖到的 8 大烹饪法（只选 8 大；去重）
     "spicy_ratio_target": <0.00|0.15|0.30>,// 将“实际辣菜占比”映射到最近的 0/0.15/0.30
     "flavor_diversity_required": <true|false>, // 口味多样性：只有“5 天全部满足 每餐≥5种口味”才为 true
     "ingredient_diversity_requirement": "无要求"|"不少于4种"|"不少于5种"|"不少于6种",
       // 统计每餐 8 大原料类出现的种类数（肉/禽/鱼/蛋/豆/菌/筋/蔬），
       // 若“5 天全部”都 ≥6 ⇒ "不少于6种"；否则若“5 天全部”都 ≥5 ⇒ "不少于5种"；否则若“5 天全部”都 ≥4 ⇒ "不少于4种"；否则 "无要求"

     "analysis": {
       "auto_parsed": true,
       "confidence": 0.00~1.00,
       "status": "uploaded_by_user"
     }
   }

3) menu_stats_json（实际统计，口径与 gen_options_json 对齐）：
   {
     "actual_main_meat_per_day": <整数>,
     "actual_half_meat_per_day": <整数>,
     "actual_veggie_hot_per_day": <整数>,
     "actual_cold_per_day": <整数>,

     "actual_spicy_ratio": <0.00~1.00 两位小数>, // 辣菜占比=本周“辣菜总数/总菜数”
     "methods_used8": <string[]>,                 // 8 大中的覆盖集合
     "passed_flavor_diversity": <true|false>,     // “5 天全部满足 每餐≥5种口味”才为 true
     "ingredient_diversity_actual": "无"|"≥4"|"≥5"|"≥6",

     "analysis": {
       "auto_parsed": true,
       "confidence": 0.00~1.00,
       "status": "uploaded_by_user"
     }
   }

【复杂刀工定义】
以下皆视为“复杂刀工”：["片","丁","粒","米","末","茸","丝","条","段","块","球","花刀"]  
“某天复杂刀工菜数”= 当天被判为上述任一刀工的菜的数量。  
若存在“任意一天”>2 ⇒ staffing_tight=false（宽裕）；否则 true（紧缺）。

【辣菜判定与口味多样性】
- 辣菜：菜名或常识明显带辣（如“辣/麻辣/香辣/剁椒/宫保/鱼香/椒/川味/湘味/红油/爆辣”等）即计为辣。  
- 口味多样性：枚举口味类别（示例：酸/甜/咸/鲜/辣/麻/香/清淡/酱香/蒜香/葱香/椒麻…），按菜名常识尽量区分；  
  一餐中计入不同取向的口味种类数，**每天都≥5** 才判 true。

【输出 JSON Schema（顶层）】
{
  "dishes_store_upserts": [
    {
      "dish_name": "string",
      "dish_type": "string",
      "ingredient_tags": ["string"],
      "knife_skill": "string|null",
      "cuisine": "string|null",
      "cook_method8": "string",
      "flavor": "string|null",
      "main_ingredients": ["string"],
      "sub_ingredients": ["string"],
      "seasons": ["string"],
      "analysis": {
        "auto_parsed": true,
        "confidence": 0.00,
        "status": "uploaded_by_user"
      }
    }
  ],
  "menu_items_json": {
    "days": [
      {
        "day_label": "string",
        "lunch": [
          { "dish_name": "string", "dish_id": null }
        ]
      }
    ]
  },
  "gen_options_json": {
    "hot_dish_total_per_day": 0,
    "main_meat_per_day": 0,
    "half_meat_per_day": 0,
    "veggie_hot_per_day": 0,
    "cold_per_day": 0,
    "staffing_tight": true,
    "cook_method8_used": ["string"],
    "spicy_ratio_target": 0.00,
    "flavor_diversity_required": false,
    "ingredient_diversity_requirement": "无要求",
    "analysis": {
      "auto_parsed": true,
      "confidence": 0.00,
      "status": "uploaded_by_user"
    }
  },
  "menu_stats_json": {
    "actual_main_meat_per_day": 0,
    "actual_half_meat_per_day": 0,
    "actual_veggie_hot_per_day": 0,
    "actual_cold_per_day": 0,
    "actual_spicy_ratio": 0.00,
    "methods_used8": ["string"],
    "passed_flavor_diversity": false,
    "ingredient_diversity_actual": "无",
    "analysis": {
      "auto_parsed": true,
      "confidence": 0.00,
      "status": "uploaded_by_user"
    }
  }
}
```

#### User 提示词模板（把 Excel 转成结构化天-菜清单后放这里）

```json
【门店信息】
store_id: {{STORE_ID}}

【一周午餐菜单（Excel 已转成结构化，按天列出菜名数组）】
{
  "days": [
    { "day_label": "周一", "lunch": ["可乐鸡翅","青笋炒肉片","蒜蓉西兰花","拍黄瓜"] },
    { "day_label": "周二", "lunch": ["红烧排骨","宫保鸡丁","清炒圆白菜","凉拌黄瓜"] },
    { "day_label": "周三", "lunch": ["红烧牛腩","木耳炒鸡蛋","蒜蓉油麦菜","拍黄瓜"] },
    { "day_label": "周四", "lunch": ["香菇烧鸡腿","鱼香肉丝","蒜蓉西蓝花","凉拌海带丝"] },
    { "day_label": "周五", "lunch": ["红烧带鱼","青椒土豆丝","清炒上海青","拍黄瓜"] }
  ]
}

请严格按照 System 中的“输出 JSON Schema”直接输出 JSON。
```

## 用户流程

### 【注册登录界面】

一个标题：「炊语」智能菜单生成系统

下面有一行说明性文字，字号较小：万千菜肴，由 AI 帮你挑选搭配

两个主要按钮：

1. 注册：点击进入新用户首次注册界面
2. 登录：点击进入老用户用账号密码的二次登录界面

### 【首次注册界面】

填写“账号”和“密码”，再次确认密码；

需要初始化的菜的数量（让用户可以手动上调/下调/输入）：

1. 早餐（作为一个可以折叠的标题，底下有这些具体的选项。这个早餐标题默认折叠）
   - 凉菜：默认5道
   - 咸菜：默认5道
   - 西餐糕点：默认3道
   - 汤粥类（含特色风味）：默认5道
   - 花色（特色）主食：默认15道
   - 蛋类：默认2道
2. 午餐（也是一个可折叠标题，默认展开）
   - 凉菜：默认4（以下省略所有“默认”字样）
   - 热菜：18
   - 汤粥：4
   - 西餐糕点：3
   - 花色主食：7
   - 特色风味食品：6
3. 晚餐（可折叠标题，默认折叠）
   - 凉菜：4
   - 热菜：18
   - 汤粥：4
   - 西餐糕点：2
   - 花色主食：6
   - 特色风味食品：7
4. 夜宵（默认折叠）
   - 凉菜：4
   - 热菜：3
   - 汤粥：3
   - 花色主食：6
   - 特色风味食品：2

选择完了之后页底有一个“保存”按钮，点击进入“首次登录界面 - 2”

### 【首次注册界面 - 2】

有一个大的「上传历史菜单」按钮，是一个大的米灰色的容器，保证高级感

下面有一行字说明：请上传1-8份历史菜单 Excel 作为参考，也可跳过此步骤

再下方是一个用户用来完成提交的按钮，当用户没有上传excel时，这个按钮显示“跳过”，当用户上传了（最多8份excel）这个按钮变成“提交”，然后点击则完成注册

用户上传的菜单会经历：

1. 自动提取excel中的字段
2. 像【数据库存储说明】篇章里面描述的，经过异步地调用AI并解析，解析出dish和menu数据存储到数据库相应位置。此时不影响用户前端接着使用
3. 解析状态实时反馈：
   - 在页面顶部有一个**解析状态栏**（固定悬浮），显示当前解析队列状态
   - 状态栏内容：「正在解析 2/5 份菜单」或「所有菜单解析完成」
   - 点击状态栏可展开查看详细队列：
     - 每份菜单显示：菜单名称、状态（排队中/解析中/解析成功/解析失败）、进度条
     - 解析失败的菜单后面有"重新解析"按钮
   - 状态栏会自动刷新（轮询或WebSocket），解析完成后3秒自动收起

### 【二次登录界面】

填写账号和密码即可登录，进入主页；

底下应该有一个“忘记密码？”字样，点击将弹出“请联系管理员重置账户”字样提示

账号和密码的信息需储存在数据库里

### 【主页】

页面的布局：中央有一个巨大的容器放置所有的选项，然后在容器的顶上应该有四个像书签一样的标签，分别是早餐、午餐、晚餐、夜宵。点击对应的书签可以更换底下容器里面的选项内容，对应的书签会有被选中的效果，但是总体不改变这个容器的大小；一上来默认在"午餐"这个书签；

**选项记忆逻辑**：
- 用户在同一会话期间（未刷新页面）修改的选项会保留
- 刷新页面或重新登录后，选项恢复为该食堂的默认配置（即首次注册时或管理员配置的数量）
- 每次点击"生成菜单"后，该次使用的所有选项参数会永久保存到数据库（menus表的gen_options_json字段），方便用户在"查看生成菜单"页面查看历史生成时使用的参数

UI的设计应该符合「UI设计风格.md」里面的简洁高级感，中间容器的颜色要设计得高级

在这个容器的下方应该首先有一个「模型选择」的选项，可以选择GPT5-chat 和Deepseek-Chat两个选项，默认是deepseek-chat；这个地方在开始搭建代码的时候不用直接搭建完整，把接口留出来，然后我再提供两个模型的api key；
再下放有一个总的「生成菜单」按钮，它的右边应该齐平的还有一个「查看生成菜单」的按钮：当用户已经点击了一次生成菜单并且有已经生成菜单时，这个「生成菜单」自动变成「再次生成」字样；右边的「查看生成菜单」按钮始终保存此用户上一次生成结果

两个按钮点击效果都采用弹窗形式，弹出一张大的卡片，占据整个页面的大约50%面积，其余部分遮罩；

「生成菜单」：用户点击之后，自动根据上方容器里面用户手动选择的选项们，拼凑到prompt里面，交给用户选择的大模型，等待AI回复；此时，这个按钮显示“菜单生成中”并有加载旋转动效；等到AI给了回复，自动弹窗，弹出的卡片是一个完整的表格，横轴是周一到周五，纵轴的大标题是早餐/午餐/晚餐/夜宵（容器上面的四个书签，由用户旋转），纵轴小标题是细分的那些热菜、凉菜、风味等，如果AI回复失败，会采用一个「兜底菜单」进行输出。
「再次生成」则是覆盖刚刚生成过的东西，以用户选择的相同选项再让AI生成一遍。
表格里的每一道菜都是一个按钮，点进去可以再出现一个弹窗，显示一张菜的简介的卡片，具体的字段会由下文json格式规定统一。

「查看生成菜单」：是用户最近一次生成过的菜单储存在这里，也是以弹窗的相同形式显示；
表格里的每一道菜都是一个按钮，点进去可以再出现一个弹窗，显示一张菜的简介的卡片。

#### 【容器和四个书签】

其中点击“早餐”/“晚餐”/“夜宵”三个按钮底下容器里面都显示“功能开发中，敬请期待”，此时点击底下的菜单生成按钮也会提示“功能开发中”；目前只有午餐这个菜单生成功能是可用的

#### 【午餐生成的容器内选项及逻辑】

分为两种模式：「菜品规则判断」vs「菜单相似度匹配」

在这个容器的最顶端有一个导航栏，分为这两个选项，左和右，默认是左边「菜品规则判断」；选中不同模式，会切换下部分容器里面的选项，同时也切换生成菜单的逻辑，走的时候两条不同的路线

##### 【菜品规则判断模式】

总体思路：有多条（10+条）对菜单的约束条件，最终要满足这样的限制，生成一周五天的午餐菜单。菜品选取自「数据库」里面的dishes，这个数据库dishes会储存越来越多的菜名，在菜品上变得越来越丰富

###### ***前端涉及的用户选项（在容器内部）***

1. 主荤菜数量：默认是「午餐热菜数量」的1/3，取整，用户可以手动调节
   半荤菜数量：默认是「午餐热菜数量」的1/3，取整，用户可以手动调节
   素菜数量：默认是「午餐热菜数量」的1/3，取整，用户可以手动调节
   保证三种菜加起来之和是午餐热菜数量
2. 人员配置：紧缺/宽裕（默认紧缺）
3. 历史菜占比：0%，30%，50%，70%，100%这几个选项（默认50）
4. ~~设备紧缺情况（多选）：没有蒸屉/没有烤箱/没有炖锅/没有烧炉（默认什么都不选）~~
   可以使用的烹饪方式：炒、熘、蒸、烧、烤、炖、煎、烹（8个选项默认全选，用户可以手动点击以去除勾选，比如如果他没有蒸锅，那么就不选蒸）
5. 辣味要求：不辣/微辣/中辣（默认不辣）
6. 口味多样性：每餐口味不少于五种（选择是或者否，打钩与否即可，默认不选）
7. 原材料多样性：无要求/不少于4种/不少于5种/不少于6种（默认无要求）

###### ***数据库里菜品存储格式***

每一道菜会具有如下标签：

1. 菜品类型：热菜主荤/热菜半荤/热菜素菜/凉菜/主食/风味小吃/汤/酱汁/饮料/手工，对于一下午餐菜单生成，只涉及热菜主荤、热菜半荤、热菜素菜、凉菜这四种
2. （仅对于热菜）食材特征：肉/禽/鱼/蛋/豆/菌/筋/蔬，共8种
3. 刀工：片、丁、粒、米、末、茸、丝、条、段、块、球、花刀，共12种

以上三点是作为工作流中的第一步「规则判断」来筛选的；

4. 菜系：34个省市自治区特色菜，在此不穷举；有些菜不属于任何一个菜系，所以可能会void
5. 烹饪方式： 炒、熘、蒸、烧、烤、炖、煎、烹、炸、焗、 煨、浇汁、烩、汆、灼（、 ⽩灼）、 焖、淋、煲、 卤、扒、熏、煮、煸、酿、爆、 烹汁、汤、浸、拌（、 凉拌）、 溜等；在此不穷举
6. 口味：过多，不穷举，且随时有新的口味的菜加入菜品库
7. 主料、辅料：具体到牛肉、牛腩、翅中、多春鱼这样的，不穷举
8. 季节：春夏秋冬，有些菜是时令菜，有些不是

以上4到8共五点，作为工作流中的第二步「AI筛选整合」来生成最终的菜单结果。

‼️注意：数据库尚未真实建立，需要你这边再写代码的过程中给我搭好框架，并预留出接口，告诉我数据应该以什么格式上传到什么地方，尤其包括比如如上8条标签该以什么字段或格式来命名，确保我输入数据库的数据和你写的代码能对应起来。

###### ***工作流***

**「前置工作」**

1. 有一个完整的菜品库（有5,000到10,000道菜，这是一直接在数据库里面的，人工打好标签）以及用户上传的1-8份历史菜单（共几百道菜一般），两个菜品来源

2. 计算最终总共要生成多少道菜（即一周菜单里面包含的菜的数量）：（「午餐热菜数量」+「午餐凉菜数量」）*5=「一周菜品总数」
3. 计算有多少菜要取自完整菜品库，多少道菜取自用户上传历史菜单：「一周菜品总数」*「历史菜占比」（用户选择的0,30,50,70,100%中的某一个）=「一周历史菜数」；「一周菜品总数」-「一周历史菜数」=「一周菜品库菜数」
4. 菜品类型总共4种（主荤、半荤、素菜、凉菜）× 食材特征8种 × 刀工12种 = 384种，每种检索10道菜，384*10=3840，为「需要检索的菜品总数」，3840×「历史菜占比」=「历史菜检索数」，3840-「历史菜检索数」=「菜品库检索数」，计算出以上所述所有数值

**「正式工作」**

1. 从「菜品库」里面将384个细分标签（相当于筛选了3层标签）里面的每一个标签都检索出10×(1-「历史菜占比」)道菜，注意是***随机选取***出；如果这个细分标签总共的菜数不够这么多，就全部抽取出来
2. 从「历史菜单」的所有菜品里面将384个细分标签每一个标签都检索出10×(「历史菜占比」)道菜，注意也是***随机选取***；如果这个细分标签总共的菜数不够这么多，就全部抽取出来
3. **重要检查**：如果用户专属菜库（dishes_store）为空或菜品数量过少（<50道），且历史菜占比>0，需要在生成前给用户明确提示："您的专属菜库菜品数量不足，建议先上传历史菜单或将历史菜占比设为0%"，并询问用户是否继续生成（若继续，则从通用菜库补充）
4. 现在我们总共拥有了「需要检索的菜品总数」这么多道菜，调用AI （deepseek-chat或者gpt5-chat），提示词如下：

```javascript
{
  "systemPrompt": "你是一位在中国团餐行业工作多年的经验丰富的厨师长。请严格按照以下【开菜规则】，为团餐食堂生成一周五天的午餐菜谱。",
  
  "promptTemplate": {
    "基础要求": "请从以下{{菜品来源}}中选取菜品，为团餐食堂生成一周五天的午餐菜谱，每天包含{{热菜个数}}个热菜和{{凉菜个数}}个凉菜，其中热菜里面包含{{主荤个数}}个主荤菜、{{半荤个数}}个半荤菜、{{素菜个数}}个素菜。",
    
    "【重要】菜名使用规则": "你必须严格使用{{菜品来源}}中提供的菜名，不得自行创造或修改菜名。输出的菜名必须与菜品来源中的某一道菜完全一致（逐字匹配）。如果菜品来源中没有合适的菜，优先调整其他约束条件，而不是修改菜名。"
    
    "开菜规则": [
      "1. 设备可实现性：在炒、熘、蒸、烧、烤、炖、煎、烹8种烹饪方式中，可以使用的烹饪方式是{{可以使用的烹饪方式}}，如果没有提及可以使用那么严禁出现这样的烹饪方式的菜",
      "2. 成本控制：一餐避免重复出现高成本食材/菜品，如水产品、牛羊肉",
      "3. 食材多样性：一餐内，主要食材不得重复（例如：鸡翅、鸡腿、鸡胸、鸡爪是不同食材）",
      "4. 原材料多样性：{{原材料多样性要求}}",
      "5. 辣味菜数量要求：{{辣味菜要求}}",
      "6. 刀工多样性：{{刀工复杂性限制}}",
      "7. 调味品多样性：{{调味品多样性要求}}",
      "8. 烹饪方式多样性：每周菜单必须出现炒、熘、蒸、烧、烤、炖、煎、烹8种烹饪方法中的至少六种",
      "9. 口感多样性：一餐不要出现超过两个勾芡菜"
    ],    
    
    "输出要求": {
            请严格按照JSON格式输出，包含周一到周五的菜单。每道菜品需要包含以下完整信息：
      {
        "monday": [
          {
            "name": "菜品名称（不含分类标签）",
            "description": "菜品的简介，约50-100字，包括菜品特色、口感、营养价值等",
            "cookingMethod": "烹饪步骤，描述性质，50-100字"
          }
        ],
        "tuesday": [...],
        "wednesday": [...],
        "thursday": [...],
        "friday": [...]
      }
    }
  },
  
  "parameterMappings": {
    "可以使用的烹饪方式": {  //炒、熘、蒸、烧、烤、炖、煎、烹
      "炒": "炒",
      "熘": "熘",
      "蒸": "蒸",
      "烧": "烧", 
      "烤": "烤",
      "炖": "炖",
      "煎": "煎",
      "烹": "烹"
    },
      
    "刀工复杂性限制": {
      "人员紧缺": "切丝/丁/片的菜品不超过10%",
      "人员充足": "切丝/丁/片的菜品占比10%-30%"
    }
    
    "辣味菜要求": {
      "不辣": "不要出现辣菜",
      "微辣": "微辣，辣菜在总数量占比约15%",
      "中辣": "中辣，辣菜在总数量占比约30%"
    },
    
    "调味品多样性": {
      "true": "在酸、甜、苦、辣、咸、鲜、麻、香、清淡9种风味之中，每餐出现风味不少于5种",
      "false": "无要求"
    },
    
    "原材料多样性": {
      "4种": "一餐出品的原材料不少于4种",
      "5种": "一餐出品的原材料不少于5种",
      "6种": "一餐出品的原材料不少于6种", 
      "无要求": ""
    },
  
  "apiConfig": {
    "model": "deepseek-chat",
    "temperature": 0.7,
    "maxTokens": 4000,
    "retryOnInvalidCount": true,
    "retryMaxAttempts": 3
  },
    
  "菜品来源":{
    这个地方是把我们找的2880道菜（max是这么多道，如果不够，数量可能比这少）给粘过来。
    具体的格式需要你来确定了数据库里面打标签的方式然后确定!!!!!!!!
    要求是，包含每一道菜的菜名，以及8个标签的信息，都是json字段。
  }
}
```

4. 经AI生成的结果渲染到前端页面（取自上述prompt中"输出要求"里面的json格式）：

   0. 先去根据所有的菜名（输出要求里面的name）回到菜品库中检索，找到那些菜对应的标签，每道菜应该对应8个标签，找到它们并调用出来；**如果AI返回的某个菜名在菜品库中找不到完全匹配的记录（逐字匹配），则该菜的标签信息留空，不调用AI重新标注，直接在前端显示"标签信息缺失"**；

   1. 菜名：渲染成一周菜单表格，横轴是周一到周五，纵轴是菜的类别（主荤、半荤、素菜、凉菜），纵坐标的一个品类可能包含多个菜，就依次排布即可；
   2. 菜品其他信息：把上述菜名表格中的每一格都设计为一个可点击的按钮，点开则弹窗出一张卡片，卡片上包含菜的各类信息：8个标签（菜品库里面标注的那8个，菜品类型、食材特征、刀工、菜系、烹饪方式、口味、主料、季节）；简介（这个地方把description字段渲染过来）；烹饪方法（把cookingMethod字段渲染过来）。如果该菜标签信息缺失，卡片中相应位置显示"标签信息缺失"并用灰色标注。再点以下遮罩范围，卡片再自动关闭。

5. 在生成的菜单表格右上角有一个“下载Excel”按钮，点击可以把这份菜单表格excel下载下来。

##### 【菜单相似度匹配模式】

总体思路：没有那么多约束条件了（可能只有一些简单的硬性规则，比如凉菜、热菜数量之类的），通过RAG来检索「数据库」里面的menus，召回和当前食堂菜单风格近似的菜单，输出给用户

这一部分先保留，先不开发这块“敬请期待”

### 【历史菜单查看页面】

在上一页【主页】的右上角应该有一个按钮，“查看历史菜单”，点击跳转到这个【历史菜单查看页面】。

分两个子页面，一个是【历史生成菜单】，记录用户最近10次生成记录，保留表格（以及点击菜名可以弹窗显示菜名信息卡片的功能）即可。

另一个是【历史上传菜单】，显示用户上传的菜单（没有上传过则为空，上传过则为1到8份），也是以表格的形式呈现即可。每个表格右上角有一个叉，点击可以把这个表格相关的数据从数据库里面删除（包括本地菜品dish里面的数据，可以删掉或者把active的状态调成inactive；以及包括用户手动上传的菜单，在数据库里，也调整成inactive），然后在所有菜单最顶上还有一个加号（做成一个很宽但很扁的长方形容器，中间有个加号），点击加号可以上传更多excel，越往上传的显示在页面越靠上的的位置（如果你想翻到最早上传的，就得一直往下滑到底）。每个食堂最多上传50份菜单，到50了如果用户再点击加号，则提示他，“菜单数量已达上限，请清除一部分菜单”。

### 【管理员查看+管理页面】

#### **0. 入口与总体**

- **域名**：admin.ai-menu.tech

  **选择理由**：与业务前台 ai-menu.tech 物理隔离，更利于安全策略（Cookie、CSP、跨域控制）、后续灰度/限流、Nginx 路由与日志区分；同时避免前台路由冲突。后续如需同域 Cookie，可按需配置二级域共享策略。

- **角色**：管理员（你与甲方同权限，不区分层级）。

- **认证**：账号/密码登录；不做 2FA；支持“忘记密码-邮件重置”（可后补）。

- **软删除**：删除门店/菜单/菜为**软删除**；在列表默认不展示，被删除的数据仍保留在库中用于审计/指标计算。

- **无集团（org）层**：当前仅门店（store）维度。

#### **1. 信息架构（IA）**

左侧主导航（固定）：

1. **概览看板（Dashboard）**
2. **门店管理（Stores）**
3. **菜单库（Menus）**
4. **菜品库（Dishes）**
5. **账号管理（Accounts）**（增删管理账号、改密）
6. **审计日志（Audit Log）**
7. **导入 / 导出（Import / Export）**
8. **API 访问（API Tokens）**
9. **系统设置（Settings）**（少量基础开关）

> 说明：

- > “菜单库”与“菜品库”提供“查看与有限编辑/合并”的能力，遵循你给的限制。

- > “解析/重算/嵌入重建”等后台 Job 不做可视化页（你选择“不展示”），但在相关操作后会后台执行“懒更新”（详见第 7 节）。

#### **2. Dashboard 概览看板**

**2.1 时间维度**

- 顶部时间筛选：**最近 7 天 / 30 天 / 90 天 / 自定义区间**（默认：最近 30 天）。

**2.2 KPI 卡片（上方）**

- **活跃门店数**：区间内有“上传或生成”行为的去重门店数。
- **新增门店数**：区间内**第一次**产生任何行为的门店数。
- **生成菜单数**：source_type=generated 的菜单总数。
- **上传菜单数**：source_type=uploaded 的菜单总数。
- **区间留存（门店）**：基于“在起始窗口 T0 活跃的门店”，在 T1（下一周/下一月）仍活跃的比例（D1/W1/M1 切换，默认 W1）。
- **失败率**：导入失败 + 解析失败 + 生成失败的比例（分母为总尝试次数）。

> 计算定义在第 9 节“指标口径”。

**2.3 图表区**

- **时间序列折线**：每日/每周 “生成菜单数 vs 上传菜单数”。
- **柱状排名**：TOP-10 高频菜（按被引用次数 / 点击生成产生次数）。
- **环形占比**：八大烹饪法覆盖比例（methods_used8 聚合）。
- **条形图**：辣度目标档位占比（0 / 0.15 / 0.30），取 spicy_ratio_target。
- **堆叠柱**：结构分布（主荤/半荤/素/凉）按“日均”聚合后的分布。
- **合规/质量指标**：
  - passed_flavor_diversity 通过率（“每天≥5种口味”为 true 的菜单占比）；
  - ingredient_diversity_actual 分布（≥4 / ≥5 / ≥6 / 无）。

**2.4 筛选器（全局）**

- 门店（store）下拉、多选。
- 来源（uploaded / generated）。
- 是否通过口味多样性。
- 辣度档位（0 / 0.15 / 0.30）。
- 八大烹饪法任意包含（多选）。

**2.5 导出**

- 当前筛选下的**图表数据**与**KPI**，导出为 **Excel / CSV / PDF**。
- 导出的文件命名：dashboard_{daterange}_{timestamp}.xlsx/csv/pdf。

#### **3. 门店管理（Stores）**

**3.1 列表**

- 字段：Store 名称、账号（登录名）、状态（启用/禁用/软删除）、最近活跃时间、累计上传数、累计生成数、创建时间。
- 搜索：支持按名称/账号模糊搜索。
- 筛选：状态、最近活跃（7/30/90 天未活跃）。
- **服务端分页**（你要求管理员页启用）：pageSize=50（默认），支持跳页。

**3.2 操作**

- **新增门店**：输入名称、登录账号、初始密码；创建后可立即使用。
- **修改门店账号/密码**：支持改登录名/改密。
- **修改门店初始化配置**：点击门店详情后，可编辑该门店的菜品数量配置（即用户首次注册时填写的早餐/午餐/晚餐/夜宵各类菜品默认数量），包括：
  - 早餐：凉菜、咸菜、西餐糕点、汤粥类、花色主食、蛋类
  - 午餐：凉菜、热菜、汤粥、西餐糕点、花色主食、特色风味食品
  - 晚餐：凉菜、热菜、汤粥、西餐糕点、花色主食、特色风味食品
  - 夜宵：凉菜、热菜、汤粥、花色主食、特色风味食品
  - 修改后立即生效，影响该门店后续生成菜单时的默认数量
- **禁用/启用**：禁用后无法登录，数据保留。
- **软删除**：标记删除；数据保留、默认列表不展示。
- **批量导入**：Excel 模板（见第 8 节），支持批量创建门店账号。
- **批量导出**：导出门店清单（含状态与活跃度）。

#### **4. 菜单库（Menus）**

**4.1 列表**

- 字段：菜单 ID、门店、来源（uploaded/generated）、标题、创建时间、days、meal_type、是否 active、解析状态（pending_parse / parsed / parse_failed / generated）、辣度档位、八大法覆盖集、是否通过口味多样性、结构“日均”（主/半/素/凉）。
- 筛选：门店、来源、时间区间、辣度档位、八大法、是否通过口味多样性、是否 active、解析状态。
- 搜索：标题/菜单 ID/包含某菜名。
- **服务端分页**：pageSize=50（固定）。

**4.2 详情**

- **信息区**：基础元信息 + gen_options_json（上传为 AI 等价参数；生成为用户当时参数）+ menu_stats_json（实际统计）。
- **菜单明细**：menu_items_json（周一~周五，每天 lunch 列表），**展示 dish_name + dish_id**。
- **不支持编辑菜单内容**（你的选择）。
- **允许删除该菜单（软删除）**：删除后指标“懒更新”。
- 操作：导出此菜单（Excel/CSV/JSON）。

> **懒更新策略**：删除/新增不会立即重算全局指标；看板在下一次周期性汇总或用户刷新时再取实时聚合。

#### **5. 菜品库（Dishes）**

> 只展示 **dishes_store**（食堂专属菜库）。通用库由运营后续人工合并，不在本期页面体现（如需，可后加“迁移到通用库”操作）。

**5.1 列表**

- 字段：菜名、门店、菜品类型、八大法、口味、季节、是否 active、创建时间。
- 检索：按菜名、菜品类型、八大法、季节、是否 active。
- **服务端分页**：pageSize=50。
- **去重视图**（可选）：评估可行就做——“同门店同名”聚合成一行，点击展开看不同标签版本；如果实现成本高可暂缓（你说“不是很重要，由我评估”——建议二期实现）。

**5.2 详情 / 操作**

- 显示七大标签（只读）。
- **不支持编辑标签**（你的选择）。
- **合并工具**：选中两条或多条同名菜，合并为一条主记录；历史引用（menus.menu_items_json 中 dish_id）迁移到主记录；被合并记录设为 inactive。
- 软删除：设为 inactive，不从库中物理删除。
- 导出：当前筛选下的菜清单（Excel/CSV）。

#### **6. 账号管理（Accounts）**

- 列表字段：账号（登录名）、所属门店、状态（启用/禁用/软删除）、最近登录、创建时间。
- 操作：
  - 新增账号（绑定门店）。
  - 修改账号/密码。
  - 禁用/启用。
  - 软删除。
- 无强制首登改密、无密码复杂度校验（你选择“不做”）。
- **危险操作二次确认**：改密、批量禁用/删除。

> 说明：如果“账号即门店登录账号”，此页可与“门店管理”合并；若未来一个门店多个账号，则保留为独立页更清晰。

#### **7. 审计日志（Audit Log）**

- 记录范围：

  - 门店/账号：新增、改名、改密、启用/禁用、软删除。
  - 菜单：上传、生成、删除。
  - 菜：合并、删除（inactive）。
  - 导入/导出：批量导入结果、导出动作。

  

- 字段：时间、操作者、对象类型（Store/Menu/Dish/Account/Export/Import）、对象 ID、操作类型、详情 JSON（前后差异摘要）。

- 检索：对象类型、操作者、时间区间、关键词。

- 留存：**90 天**。

- 导出：当前筛选结果导出 CSV/Excel。

#### **8. 导入 / 导出（Import / Export）**

**8.1 导入**

- **支持 Excel（首期只做 Excel）**。
- 模板下载：
  - **门店导入模板**：store_name, login, password
  - **菜单导入模板**：按“天-菜名”结构表格（提供示例 sheet）；支持“单店单周上传”、“多店多周批量上传”（含 store 标识列）。
- 导入流程：上传文件 → 解析预览（显示有效行/错误行）→ 确认导入 → 写库（菜单为 uploaded）→ 异步解析（懒更新）。
- 失败重试：失败条目导出错误报告（Excel）。

**8.2 导出**

- 门店清单、菜单明细、菜库清单、Dashboard 指标。
- 文件命名：
  - stores_{daterange?}_{timestamp}.xlsx
  - menus_{filters}_{timestamp}.xlsx
  - dishes_{filters}_{timestamp}.xlsx
  - dashboard_{daterange}_{timestamp}.xlsx/csv/pdf

#### **9. API Tokens（只读）**

- 生成只读 Token（展示一次完整明文，后仅可重置）。
- 权限：读取门店、菜单、菜与指标聚合（GET-only）。
- 令牌管理：新增、禁用、删除。
- 限流：基础限流（例如 60 req/min/Token），后端做。
- 文档：给出简单 OpenAPI/Swagger（只读接口）。

#### **10. 系统设置（Settings）**

- 开关项（首期简单）：
  - **软删除显示**：在列表中显示软删除项（默认关闭）。
  - **下载开关**：是否允许导出（默认允许）。
  - **解析失败通知**：是否向管理员发送邮件（默认关闭）。

#### **11. 交互与状态**

**11.1 危险操作确认**

- 删除门店 / 菜单 / 菜（软删除）
- 批量删除 / 批量禁用
- 修改账号密码

弹窗需显示操作影响与不可逆说明（软删除可恢复为启用，但不会自动恢复指标，指标属于懒更新）。

**11.2 懒更新策略**

- 删除/新增菜单、合并菜、不触发立即全局重算。
- 看板在下一次打开/刷新时重新拉取聚合（实时查询 + 必要缓存）。
- 后台可跑**低优先级周期任务**：每日离峰期对“近 90 天”指标做汇总快照，提高看板打开速度。

#### **12. 指标口径（用于后端实现）**

定义简表：

- **活跃门店数（区间）**：在区间内 menus.created_at 有记录（uploaded/generated 任一）的去重 store_id。

- **新增门店数（区间）**：门店第一次出现行为的时间 ∈ 区间。

- **生成菜单数**：source_type='generated' 且 created_at ∈ 区间。

- **上传菜单数**：source_type='uploaded' 且 created_at ∈ 区间。

- **门店留存（W1 默认）**：在周W有行为的门店集合 S，在周 W+1 仍有行为的门店集合 T；留存率 = |S∩T| / |S|。

- **失败率**：导入失败（校验/解析错误）、解析失败（meta_json.pipeline_status='parse_failed'）、生成失败（生成接口异常） / 总尝试次数。

- **八大烹饪法覆盖**：取 menu_stats_json.methods_used8 并聚合去重计数。

- **辣度档位占比**：取 gen_options_json.spicy_ratio_target，按 0 / 0.15 / 0.30 聚合，占全菜单数比例。

- **结构分布（日均）**：

  

  - 主荤/半荤/素/凉：优先用 menu_stats_json 的 actual_*_per_day；没有则回退到 gen_options_json 的 *_per_day。

  

- **口味多样性通过率**：menu_stats_json.passed_flavor_diversity = true 占比。

- **原材料多样性分布**：menu_stats_json.ingredient_diversity_actual 按“≥6/≥5/≥4/无”聚合比例。

#### **13. 列表筛选与字段（落地用）**

**13.1 Menus 列表字段**

- menu_id（可复制）、store、source_type、created_at、status（pending_parse/parsed/…）、spicy_ratio_target、methods_used8（逗号分隔）、passed_flavor_diversity、actual_*_per_day 摘要、is_active。
- 操作：查看详情、导出、软删除。

筛选条件（服务端）：store、多选 source_type、时间、辣度档位、八大法（包含任一）、是否通过口味多样性、解析状态、active。

**13.2 Dishes 列表字段**

- dish_id、store、dish_name、dish_type、cook_method8、flavor、seasons、is_active、created_at。
- 操作：详情、**合并**、软删除、导出。

筛选：store、dish_type、cook_method8、season、active、关键词（菜名）。

#### **14. 审计与风控实现要点**

- 所有变更写入 audit_logs：
  - id, actor_user_id, action, object_type, object_id, before_json, after_json, created_at
- 危险操作二次确认前端弹窗、后端二次校验（避免脚本误调用）。
- 审计导出受 90 天留存限制；超窗数据可通过 DB 直连（内管）导出。

#### **15. API（只读 Token 的初版范围）**

- GET /api/admin/stores?…（列表、筛选、分页）
- GET /api/admin/menus?…（同上）
- GET /api/admin/menus/:id（详情）
- GET /api/admin/dishes?…
- GET /api/admin/dashboard?from=…&to=…&filters=…
- POST /api/admin/tokens（生成）、DELETE /api/admin/tokens/:id、PATCH /api/admin/tokens/:id（禁用）

> Token 放在 Header：Authorization: Bearer <token>；只读、限流。

#### **16. 空态 / 加载 / 错误**

- 空态：无数据时提供“去导入菜单”/“去新增门店”的入口。
- 加载：表格骨架屏、图表 loading 占位。
- 错误：导入失败提供**错误行下载**；解析失败在菜单详情页以**红色 Badge**显示 status，并给“一键重试解析”按钮（后台懒更新）。

#### **17. 后端实现注意**

- **服务端分页**：所有列表均采用 limit/offset 或 cursor 模式，默认 pageSize=50。
- **软删除过滤**：SQL 默认 is_active=true AND deleted_at IS NULL（或统一 is_deleted=false）。
- **懒更新**：删除/合并后不强制触发重算；看板查询走实时 SQL + 轻度缓存（Redis/pg 物化视图二选一，二期优化）。
- **解析 Job**：菜单导入成功后入队；失败写 meta_json.pipeline_status='parse_failed' 与 error_message。
- **合并菜**：迁移 menus.menu_items_json 内 dish_id 引用，原记录 is_active=false，写审计。

#### **18. 版本与扩展**

- **v1（当前）**：无 org 层、无标签编辑、无任务中心展示、无回收站、无 2FA。
- **v1.1**（建议）：去重视图、回收站、一键重试解析、下载权限开关。
- **v2**：引入 org（集团）视角、只读模式、任务中心可视化、细粒度权限（超级管理员/只读管理员）。



## UI设计风格

### 核心设计理念
**极简美学 + AI科技感** - 打造优雅、现代的智能菜单生成与数据展示体验

### 色彩系统

主色调

- **背景色**: `#F5F5F0` - 温暖米白色，营造柔和舒适的视觉体验
- **主色**: `#2C2C2C` - 深灰色，提供足够的对比度而不刺眼
- **边框色**: `#E8E8E3` - 浅灰米色，用于分隔和边框

辅助色

- **禁用色**: `#999` - 中灰色，用于禁用状态和次要文本
- **提示色**: `#666` - 中浅灰，用于说明文字
- **阴影色**: `rgba(0, 0, 0, 0.1)` - 轻微阴影，增加层次感

### 字体系统

字体族

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
```

字体大小层级

- **标题**: 36px (font-weight: 300)
- **副标题**: 24px (font-weight: 300)
- **正文**: 18px (font-weight: 300)
- **说明**: 16px (font-weight: 300)
- **辅助**: 14px (font-weight: 300)

字间距

- **标题**: 1.5px letter-spacing
- **正文**: 0.5px letter-spacing
- **说明**: 0.25px letter-spacing

### 布局系统

间距规范

- **页面边距**: 80px (左右)
- **组件间距**: 48px (主要区块间)
- **内边距**: 16px-32px (按钮、卡片等)
- **安全区域**: 不需要移动端 safe-area，统一边距控制

响应式断点

- **桌面端优先**: 使用 rem / vw 单位
- **主要断点**:
  - max-width: 1200px （标准内容宽度）
  - max-width: 768px （平板）
  - max-width: 480px （手机）
- **内容区域宽度**: 建议居中并限制最大宽度，如 max-width: 1000px; margin: auto;

### 组件设计模式

按钮系统

```css
.analyze-button {
  height: 48px;
  border-radius: 24px;
  background: #E8E8E3;
  color: #999;
  transition: all 0.3s ease;
  font-weight: 300;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.analyze-button:hover {
  background: #2C2C2C;
  color: #FFFFFF;
  box-shadow: 0 4px 16px rgba(44, 44, 44, 0.15);
}
```

卡片系统

```css
.card {
  background: #FFFFFF;
  border: 1px solid #E8E8E3;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}
```

图片容器

```css
.image-container {
  border-radius: 12px;
  overflow: hidden;
  max-width: 40vw;
  aspect-ratio: 1;
  object-fit: cover;
}
```

### 动画效果

过渡动画

- **持续时间**: 0.3s ease
- **交互反馈**: transform: scale(0.95) 或 scale(0.98)
- **透明度变化**: opacity: 0 → 1

加载动画

- **脉冲效果**: loadingPulse 关键帧动画
- **浮动效果**: iconFloat 关键帧动画
- **渐显效果**: 逐行或整体渐显

### 交互模式

触摸反馈

```css
.element:active {
  transform: scale(0.95);
  background: #FAFAFA;
  border-color: #2C2C2C;
}
```

状态切换

- **禁用状态**: 降低对比度，移除交互效果
- **选中状态**: 边框加深，添加阴影
- **加载状态**: 显示加载动画，禁用交互

### 页面结构模式

固定布局

```css
.container {
  min-height: 100vh;
  background: #F5F5F0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  padding: 48px 80px;
  overflow-y: auto;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 1px solid #E8E8E3;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

滚动区域

```css
.scroll-content {
  overflow-y: auto;
  scroll-behavior: smooth;
}
```

### 设计原则

1. 极简主义

- 减少视觉噪音，突出核心内容
- 使用大量留白，营造呼吸感
- 统一的圆角和边框样式

2. 层次分明

- 通过颜色深浅建立信息层级
- 合理的间距和字体大小变化
- 清晰的交互状态反馈

3. 现代感

- 毛玻璃效果和轻微阴影
- 流畅的过渡动画
- 科技感的图标和元素

4. 可访问性

- 足够的颜色对比度
- 清晰的触摸目标区域
- 适配不同屏幕尺寸

### 特殊效果

毛玻璃效果

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

渐显动画

```css
.fade-in {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
```

加载遮罩

```css
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
```

**设计风格关键词**: 极简、优雅、现代、科技感、柔和、专业、可信赖

