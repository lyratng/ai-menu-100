#!/bin/bash

# 修复数据库缺失字段脚本

echo "🔧 开始修复数据库..."
echo ""

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST="pgm-2zehfdn8016w3674.pg.rds.aliyuncs.com"
DB_USER="ai_menu_admin"
DB_NAME="ai_menu"
DB_PASSWORD="Yan660328"

echo -e "${YELLOW}1. 检查 menus 表是否缺少 updated_at 字段...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d menus" | grep updated_at

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ menus 表缺少 updated_at 字段${NC}"
    echo ""
    echo -e "${YELLOW}2. 添加 updated_at 字段...${NC}"
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'menus' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE menus ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        UPDATE menus SET updated_at = created_at WHERE updated_at IS NULL;
        RAISE NOTICE '✅ updated_at 字段已添加';
    END IF;
END $$;
EOF

    echo -e "${GREEN}✅ 字段添加完成${NC}"
else
    echo -e "${GREEN}✅ updated_at 字段已存在${NC}"
fi

echo ""
echo -e "${YELLOW}3. 验证 menus 表结构...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'menus' ORDER BY ordinal_position;"

echo ""
echo -e "${GREEN}✅ 数据库修复完成！${NC}"

