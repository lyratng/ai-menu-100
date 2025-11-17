#!/bin/bash

# ================================
# AI菜单系统 - ECS初始化脚本
# ================================
# 用途：首次登录ECS后，自动安装所有必需环境
# 使用方法：
#   1. SSH登录到ECS
#   2. 复制此脚本内容，保存为 init.sh
#   3. chmod +x init.sh
#   4. ./init.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}AI菜单系统 - ECS环境初始化${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# ================================
# 1. 更新系统
# ================================
echo -e "${YELLOW}[1/7] 更新系统...${NC}"
apt update
apt upgrade -y
echo -e "${GREEN}✓ 系统更新完成${NC}"
echo ""

# ================================
# 2. 安装基础工具
# ================================
echo -e "${YELLOW}[2/7] 安装基础工具...${NC}"
apt install -y curl git vim wget lsof net-tools
echo -e "${GREEN}✓ 基础工具安装完成${NC}"
echo ""

# ================================
# 3. 安装Node.js 20.x
# ================================
echo -e "${YELLOW}[3/7] 安装Node.js 20.x...${NC}"
if command -v node &> /dev/null; then
    echo "Node.js已安装: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js安装完成: $(node --version)${NC}"
fi
echo ""

# ================================
# 4. 安装pnpm
# ================================
echo -e "${YELLOW}[4/7] 安装pnpm...${NC}"
if command -v pnpm &> /dev/null; then
    echo "pnpm已安装: $(pnpm --version)"
else
    npm install -g pnpm
    echo -e "${GREEN}✓ pnpm安装完成: $(pnpm --version)${NC}"
fi
echo ""

# ================================
# 5. 安装Docker
# ================================
echo -e "${YELLOW}[5/7] 安装Docker...${NC}"
if command -v docker &> /dev/null; then
    echo "Docker已安装: $(docker --version)"
else
    curl -fsSL https://get.docker.com | bash
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✓ Docker安装完成: $(docker --version)${NC}"
fi
echo ""

# ================================
# 6. 安装PM2
# ================================
echo -e "${YELLOW}[6/7] 安装PM2...${NC}"
if command -v pm2 &> /dev/null; then
    echo "PM2已安装: $(pm2 --version)"
else
    npm install -g pm2
    echo -e "${GREEN}✓ PM2安装完成: $(pm2 --version)${NC}"
fi
echo ""

# ================================
# 7. 验证安装
# ================================
echo -e "${YELLOW}[7/7] 验证安装...${NC}"
echo ""
echo -e "${GREEN}===== 环境检查 =====${NC}"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "pnpm: $(pnpm --version)"
echo "Docker: $(docker --version)"
echo "PM2: $(pm2 --version)"
echo "Git: $(git --version)"
echo -e "${GREEN}===================${NC}"
echo ""

# ================================
# 完成
# ================================
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ 环境初始化完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "下一步："
echo "1. 克隆项目代码到 /opt/ai-menu"
echo "2. 配置后端 .env 文件"
echo "3. 启动服务"
echo ""
echo "参考文档: docs/生产环境部署指南.md"
echo ""

