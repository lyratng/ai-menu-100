-- ============================================
-- 完整数据库修复脚本
-- ============================================

-- 1. 修复 menus 表 - 添加 updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menus' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE menus ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        UPDATE menus SET updated_at = created_at WHERE updated_at IS NULL;
        RAISE NOTICE '✅ menus.updated_at 已添加';
    ELSE
        RAISE NOTICE '✓ menus.updated_at 已存在';
    END IF;
END $$;

-- 2. 修复 generation_events 表 - 添加所有缺失字段
DO $$ 
BEGIN
    -- 添加 model_used
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generation_events' AND column_name = 'model_used'
    ) THEN
        ALTER TABLE generation_events ADD COLUMN model_used VARCHAR(100) DEFAULT 'deepseek-chat';
        RAISE NOTICE '✅ generation_events.model_used 已添加';
    ELSE
        RAISE NOTICE '✓ generation_events.model_used 已存在';
    END IF;

    -- 添加 prompt_tokens
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generation_events' AND column_name = 'prompt_tokens'
    ) THEN
        ALTER TABLE generation_events ADD COLUMN prompt_tokens INTEGER DEFAULT 0;
        RAISE NOTICE '✅ generation_events.prompt_tokens 已添加';
    ELSE
        RAISE NOTICE '✓ generation_events.prompt_tokens 已存在';
    END IF;

    -- 添加 completion_tokens
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generation_events' AND column_name = 'completion_tokens'
    ) THEN
        ALTER TABLE generation_events ADD COLUMN completion_tokens INTEGER DEFAULT 0;
        RAISE NOTICE '✅ generation_events.completion_tokens 已添加';
    ELSE
        RAISE NOTICE '✓ generation_events.completion_tokens 已存在';
    END IF;

    -- 添加 latency_ms
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generation_events' AND column_name = 'latency_ms'
    ) THEN
        ALTER TABLE generation_events ADD COLUMN latency_ms INTEGER DEFAULT 0;
        RAISE NOTICE '✅ generation_events.latency_ms 已添加';
    ELSE
        RAISE NOTICE '✓ generation_events.latency_ms 已存在';
    END IF;

    -- 添加 metadata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generation_events' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE generation_events ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ generation_events.metadata 已添加';
    ELSE
        RAISE NOTICE '✓ generation_events.metadata 已存在';
    END IF;
END $$;

-- 验证修复结果
\echo ''
\echo '📋 验证 menus 表字段：'
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'menus' 
ORDER BY ordinal_position;

\echo ''
\echo '📋 验证 generation_events 表字段：'
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'generation_events' 
ORDER BY ordinal_position;

\echo ''
\echo '✅ 数据库修复完成！'

