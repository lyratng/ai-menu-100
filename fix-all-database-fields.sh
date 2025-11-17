#!/bin/bash

# 一键修复所有数据库缺失字段

DB_HOST="pgm-2zehfdn8016w3674.pg.rds.aliyuncs.com"
DB_USER="ai_menu_admin"
DB_NAME="ai_menu"
DB_PASSWORD="Yan660328"

echo "🔧 开始修复数据库字段..."
echo ""

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'

-- 1. 修复 menus 表缺少 updated_at 字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menus' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE menus ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        UPDATE menus SET updated_at = created_at WHERE updated_at IS NULL;
        RAISE NOTICE '✅ menus.updated_at 字段已添加';
    ELSE
        RAISE NOTICE '✓ menus.updated_at 字段已存在';
    END IF;
END $$;

-- 2. 修复 generation_events 表缺少 model_used 字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generation_events' AND column_name = 'model_used'
    ) THEN
        ALTER TABLE generation_events ADD COLUMN model_used VARCHAR(100) DEFAULT 'deepseek-chat';
        RAISE NOTICE '✅ generation_events.model_used 字段已添加';
    ELSE
        RAISE NOTICE '✓ generation_events.model_used 字段已存在';
    END IF;
END $$;

-- 3. 显示所有表的字段信息（验证）
\echo ''
\echo '📋 验证 menus 表字段：'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'menus' 
ORDER BY ordinal_position;

\echo ''
\echo '📋 验证 generation_events 表字段：'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'generation_events' 
ORDER BY ordinal_position;

\echo ''
\echo '✅ 数据库修复完成！'

EOF

echo ""
echo "✅ 所有字段修复完成！"

