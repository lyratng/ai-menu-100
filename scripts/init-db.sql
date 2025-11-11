-- 炊语智能菜单生成系统 - 数据库初始化脚本
-- 基于PRD数据模型设计

-- ============================================
-- 1. 启用扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector用于embedding（预留）

-- ============================================
-- 2. 门店表
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  default_config JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 门店初始化配置
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name)
);

COMMENT ON TABLE stores IS '门店表';
COMMENT ON COLUMN stores.default_config IS '门店初始化配置（早餐/午餐/晚餐/夜宵的默认菜品数量）';

-- ============================================
-- 3. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'store_manager', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.role IS '角色：admin=管理员, store_manager=门店管理员, viewer=查看者';

CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 4. 通用菜品库（人工筛选维护）
-- ============================================
CREATE TABLE IF NOT EXISTS dishes_common (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_name TEXT NOT NULL UNIQUE,
  dish_type TEXT NOT NULL,  -- 热菜主荤/热菜半荤/热菜素菜/凉菜/主食/风味小吃/汤/酱汁/饮料/手工
  ingredient_tags TEXT[] DEFAULT '{}',  -- 食材特征：肉/禽/鱼/蛋/豆/菌/筋/蔬
  knife_skill TEXT,  -- 刀工：片/丁/粒/米/末/茸/丝/条/段/块/球/花刀
  cuisine TEXT,  -- 菜系
  cook_method8 TEXT NOT NULL,  -- 8大烹饪法：炒/熘/蒸/烧/烤/炖/煎/烹
  flavor TEXT,  -- 口味
  main_ingredients TEXT[] DEFAULT '{}',  -- 主料
  sub_ingredients TEXT[] DEFAULT '{}',  -- 辅料
  seasons TEXT[] DEFAULT '{}',  -- 季节：春/夏/秋/冬
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 分析信息
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE dishes_common IS '通用菜品库（人工维护）';
COMMENT ON COLUMN dishes_common.cook_method8 IS '8大烹饪法归一：炒/熘/蒸/烧/烤/炖/煎/烹';

CREATE INDEX idx_dishes_common_type ON dishes_common(dish_type);
CREATE INDEX idx_dishes_common_method ON dishes_common(cook_method8);
CREATE INDEX idx_dishes_common_name ON dishes_common(dish_name);

-- ============================================
-- 5. 门店专属菜品库（上传解析时写入）
-- ============================================
CREATE TABLE IF NOT EXISTS dishes_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  dish_name TEXT NOT NULL,
  dish_type TEXT NOT NULL,
  ingredient_tags TEXT[] DEFAULT '{}',
  knife_skill TEXT,
  cuisine TEXT,
  cook_method8 TEXT NOT NULL,
  flavor TEXT,
  main_ingredients TEXT[] DEFAULT '{}',
  sub_ingredients TEXT[] DEFAULT '{}',
  seasons TEXT[] DEFAULT '{}',
  common_dish_id UUID REFERENCES dishes_common(id) ON DELETE SET NULL,  -- 关联到通用库
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(store_id, dish_name)
);

COMMENT ON TABLE dishes_store IS '门店专属菜品库';
COMMENT ON COLUMN dishes_store.common_dish_id IS '关联到通用菜品库ID（后续人工对齐）';

CREATE INDEX idx_dishes_store_store ON dishes_store(store_id);
CREATE INDEX idx_dishes_store_type ON dishes_store(dish_type);
CREATE INDEX idx_dishes_store_method ON dishes_store(cook_method8);
CREATE INDEX idx_dishes_store_name ON dishes_store(store_id, dish_name);

-- ============================================
-- 6. 菜单表（上传与生成统一）
-- ============================================
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('uploaded', 'generated')),
  title TEXT,
  days INT NOT NULL DEFAULT 5,
  meal_type TEXT NOT NULL DEFAULT 'lunch',  -- breakfast/lunch/dinner/supper
  
  -- 菜单项（仅菜名和dish_id引用）
  menu_items_json JSONB NOT NULL,
  
  -- 生成选项（生成=用户选择，上传=AI推导）
  gen_options_json JSONB,
  
  -- 实际统计
  menu_stats_json JSONB,
  
  -- Embedding向量（预留RAG用）
  embedding_menu vector(1536),
  
  -- 历史菜占比
  used_history_ratio NUMERIC(5,2),
  
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  meta_json JSONB NOT NULL DEFAULT '{}'::jsonb  -- pipeline_status等
);

COMMENT ON TABLE menus IS '菜单表（上传与生成统一）';
COMMENT ON COLUMN menus.source_type IS 'uploaded=上传, generated=生成';
COMMENT ON COLUMN menus.menu_items_json IS '菜单项JSON（仅菜名和dish_id）';
COMMENT ON COLUMN menus.gen_options_json IS '生成选项JSON';
COMMENT ON COLUMN menus.menu_stats_json IS '实际统计JSON';

CREATE INDEX idx_menus_store ON menus(store_id);
CREATE INDEX idx_menus_source ON menus(source_type);
CREATE INDEX idx_menus_created ON menus(created_at DESC);
CREATE INDEX idx_menus_items_gin ON menus USING GIN (menu_items_json);
CREATE INDEX idx_menus_gen_opts_gin ON menus USING GIN (gen_options_json);
CREATE INDEX idx_menus_stats_gin ON menus USING GIN (menu_stats_json);
CREATE INDEX idx_menus_meta_gin ON menus USING GIN (meta_json);

-- ============================================
-- 7. OSS文件登记表
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  uploader_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  oss_bucket TEXT NOT NULL,
  oss_key TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  purpose TEXT,  -- 'history_menu_upload', 'generated_menu_download'等
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE files IS 'OSS文件登记表';

CREATE INDEX idx_files_store ON files(store_id);
CREATE INDEX idx_files_purpose ON files(purpose);

-- ============================================
-- 8. 解析队列表（异步任务）
-- ============================================
CREATE TABLE IF NOT EXISTS parse_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'parsing', 'success', 'failed')),
  progress INT DEFAULT 0,  -- 0-100
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE parse_queue IS '菜单解析队列';

CREATE INDEX idx_parse_queue_status ON parse_queue(status);
CREATE INDEX idx_parse_queue_menu ON parse_queue(menu_id);

-- ============================================
-- 9. 认证事件表
-- ============================================
CREATE TABLE IF NOT EXISTS auth_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'login', 'logout')),
  ip INET,
  ua TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta_json JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE auth_events IS '认证事件表';

CREATE INDEX idx_auth_events_user ON auth_events(user_id);
CREATE INDEX idx_auth_events_type ON auth_events(type);
CREATE INDEX idx_auth_events_created ON auth_events(created_at DESC);

-- ============================================
-- 10. 生成事件表
-- ============================================
CREATE TABLE IF NOT EXISTS generation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  latency_ms INT,
  model TEXT,  -- 'deepseek-chat', 'gpt-5-chat'等
  prompt_tokens INT,
  output_tokens INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta_json JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE generation_events IS '菜单生成事件表';

CREATE INDEX idx_gen_events_store ON generation_events(store_id);
CREATE INDEX idx_gen_events_status ON generation_events(status);
CREATE INDEX idx_gen_events_created ON generation_events(created_at DESC);

-- ============================================
-- 11. 使用事件表
-- ============================================
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,  -- 'menu_view', 'menu_export', 'menu_delete'等
  event_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta_json JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE usage_events IS '用户使用事件表';

CREATE INDEX idx_usage_events_store ON usage_events(store_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_created ON usage_events(created_at DESC);

-- ============================================
-- 12. 审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete'等
  object_type TEXT NOT NULL,  -- 'store', 'user', 'menu', 'dish'等
  object_id UUID,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS '审计日志表';

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_object ON audit_logs(object_type, object_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 13. 创建初始管理员账号
-- ============================================
-- 默认管理员账号: admin / admin123456
-- ⚠️ 生产环境请立即修改密码！
INSERT INTO users (username, password_hash, role, is_active)
VALUES (
  'admin',
  '$2b$10$rZ5qF7nYZpJ8KjxZWYxO0.8XJmf9wvQxCVJKZPzC2YqXxGYqnlTZS',  -- admin123456
  'admin',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 14. 创建视图（用于Dashboard）
-- ============================================

-- DAU视图
CREATE OR REPLACE VIEW v_dau AS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  COUNT(DISTINCT user_id) AS dau
FROM auth_events
WHERE type = 'login'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- 门店活跃度视图
CREATE OR REPLACE VIEW v_store_activity AS
SELECT 
  s.id,
  s.name,
  s.is_active,
  COUNT(DISTINCT m.id) FILTER (WHERE m.source_type = 'generated') AS generated_count,
  COUNT(DISTINCT m.id) FILTER (WHERE m.source_type = 'uploaded') AS uploaded_count,
  MAX(m.created_at) AS last_active_at
FROM stores s
LEFT JOIN menus m ON s.id = m.store_id
GROUP BY s.id, s.name, s.is_active
ORDER BY last_active_at DESC NULLS LAST;

-- ============================================
-- 完成
-- ============================================
SELECT '✅ 数据库初始化完成！' AS message;
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = 'public';

