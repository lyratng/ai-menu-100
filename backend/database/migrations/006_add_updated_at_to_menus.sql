-- 为 menus 表添加 updated_at 字段
-- 执行命令：
-- PGPASSWORD='Yan660328' psql -h pgm-2zehfdn8016w3674.pg.rds.aliyuncs.com -U ai_menu_admin -d ai_menu -f 006_add_updated_at_to_menus.sql

-- 添加 updated_at 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'menus' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE menus ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- 将现有记录的 updated_at 设置为 created_at
        UPDATE menus SET updated_at = created_at WHERE updated_at IS NULL;
        
        RAISE NOTICE '✅ updated_at 字段已添加到 menus 表';
    ELSE
        RAISE NOTICE '✅ updated_at 字段已存在';
    END IF;
END $$;

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menus' AND column_name = 'updated_at';

