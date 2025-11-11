-- 为stores表添加缺失的字段

-- 添加updated_at字段
ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 添加default_config字段（存储门店默认配置）
ALTER TABLE stores ADD COLUMN IF NOT EXISTS default_config JSONB DEFAULT '{}'::jsonb;

-- 为users表添加updated_at字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 创建触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为stores表创建触发器
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为users表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN stores.updated_at IS '更新时间';
COMMENT ON COLUMN stores.default_config IS '门店默认配置（早餐/午餐/晚餐/夜宵各类菜品默认数量）';
COMMENT ON COLUMN users.updated_at IS '更新时间';



