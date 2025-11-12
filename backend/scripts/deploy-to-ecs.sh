#!/bin/bash

# ================================
# AI菜单系统 - 后端部署脚本
# ================================
# 用途：在阿里云ECS上快速部署后端服务
# 使用：chmod +x deploy-to-ecs.sh && ./deploy-to-ecs.sh

set -e  # 遇到错误立即退出

echo "================================"
echo "AI菜单系统 - 后端自动部署脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}请使用root用户运行此脚本${NC}"
  echo "sudo ./deploy-to-ecs.sh"
  exit 1
fi

# ================================
# 1. 检查并安装依赖
# ================================
echo -e "${YELLOW}步骤 1/8: 检查系统依赖...${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js未安装，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "✓ Node.js已安装: $(node --version)"
fi

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo "pnpm未安装，正在安装..."
    npm install -g pnpm
else
    echo "✓ pnpm已安装: $(pnpm --version)"
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "Docker未安装，正在安装..."
    curl -fsSL https://get.docker.com | bash
    systemctl start docker
    systemctl enable docker
else
    echo "✓ Docker已安装: $(docker --version)"
fi

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "PM2未安装，正在安装..."
    npm install -g pm2
else
    echo "✓ PM2已安装: $(pm2 --version)"
fi

echo ""

# ================================
# 2. 创建项目目录
# ================================
echo -e "${YELLOW}步骤 2/8: 创建项目目录...${NC}"

PROJECT_DIR="/opt/ai-menu"

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
    echo "✓ 项目目录已创建: $PROJECT_DIR"
else
    echo "✓ 项目目录已存在: $PROJECT_DIR"
fi

cd $PROJECT_DIR
echo ""

# ================================
# 3. 拉取代码
# ================================
echo -e "${YELLOW}步骤 3/8: 拉取代码...${NC}"

if [ ! -d ".git" ]; then
    echo "首次部署，请输入GitHub仓库地址:"
    read -p "仓库地址: " REPO_URL
    git clone $REPO_URL .
else
    echo "更新代码..."
    git pull origin main
fi

echo "✓ 代码已更新"
echo ""

# ================================
# 4. 安装依赖
# ================================
echo -e "${YELLOW}步骤 4/8: 安装依赖...${NC}"

cd backend
pnpm install

echo "✓ 依赖安装完成"
echo ""

# ================================
# 5. 配置环境变量
# ================================
echo -e "${YELLOW}步骤 5/8: 配置环境变量...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}未找到.env文件！${NC}"
    echo "请先创建.env文件并填写配置。"
    echo "参考模板: .env.production.example"
    echo ""
    read -p "是否现在创建.env文件? (y/n): " CREATE_ENV
    
    if [ "$CREATE_ENV" = "y" ]; then
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env
            echo "✓ 已从模板创建.env文件"
            echo ""
            echo -e "${YELLOW}请编辑.env文件并填写实际配置:${NC}"
            echo "vim .env"
            echo ""
            echo "填写完成后，重新运行此脚本。"
        else
            echo -e "${RED}未找到.env.production.example模板文件${NC}"
        fi
        exit 1
    else
        echo "退出部署。请先创建.env文件。"
        exit 1
    fi
else
    echo "✓ .env文件已存在"
    
    # 检查关键配置
    echo "检查配置项..."
    
    if grep -q "JWT_SECRET=请替换为32位以上随机字符串" .env; then
        echo -e "${RED}警告: JWT_SECRET未修改！请立即修改为随机值。${NC}"
        echo ""
        echo "生成随机JWT_SECRET:"
        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
        echo ""
        read -p "是否继续部署? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            exit 1
        fi
    fi
    
    if ! grep -q "DATABASE_URL=postgres://" .env; then
        echo -e "${RED}警告: DATABASE_URL未配置！${NC}"
        exit 1
    fi
    
    if ! grep -q "DEEPSEEK_API_KEY=sk-" .env; then
        echo -e "${RED}警告: DEEPSEEK_API_KEY未配置！${NC}"
        exit 1
    fi
    
    echo "✓ 配置检查通过"
fi

echo ""

# ================================
# 6. 启动Redis
# ================================
echo -e "${YELLOW}步骤 6/8: 启动Redis...${NC}"

if docker ps | grep -q redis; then
    echo "✓ Redis容器已在运行"
else
    echo "启动Redis容器..."
    docker run -d \
        --name redis \
        --restart always \
        -p 6379:6379 \
        redis:7-alpine
    
    sleep 2
    
    if docker ps | grep -q redis; then
        echo "✓ Redis启动成功"
    else
        echo -e "${RED}Redis启动失败！${NC}"
        exit 1
    fi
fi

echo ""

# ================================
# 7. 初始化数据库
# ================================
echo -e "${YELLOW}步骤 7/8: 初始化数据库...${NC}"

read -p "是否需要运行数据库迁移? (首次部署选y) (y/n): " RUN_MIGRATION

if [ "$RUN_MIGRATION" = "y" ]; then
    echo "运行数据库迁移..."
    pnpm tsx -r dotenv/config scripts/run-migration.ts
    echo "✓ 数据库迁移完成"
    
    read -p "是否需要创建管理员账号? (y/n): " CREATE_ADMIN
    if [ "$CREATE_ADMIN" = "y" ]; then
        echo ""
        echo "创建管理员账号:"
        pnpm tsx -r dotenv/config scripts/create-admin.ts
    fi
else
    echo "跳过数据库迁移"
fi

echo ""

# ================================
# 8. 启动后端服务
# ================================
echo -e "${YELLOW}步骤 8/8: 启动后端服务...${NC}"

# 检查端口是否被占用
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "端口8080已被占用，停止旧进程..."
    lsof -ti:8080 | xargs kill -9 || true
    sleep 2
fi

# 停止旧服务（如果存在）
if pm2 list | grep -q "ai-menu-backend"; then
    echo "停止旧服务..."
    pm2 stop ai-menu-backend
    pm2 delete ai-menu-backend
fi

# 启动新服务
echo "启动后端服务..."
cd $PROJECT_DIR/backend
pm2 start pnpm --name "ai-menu-backend" -- tsx src/server.ts

# 设置开机自启
pm2 startup systemd -u root --hp /root
pm2 save

echo "✓ 后端服务启动成功"
echo ""

# ================================
# 9. 验证部署
# ================================
echo -e "${YELLOW}验证部署...${NC}"

sleep 3

# 检查PM2状态
if pm2 list | grep -q "ai-menu-backend.*online"; then
    echo "✓ PM2状态: 运行中"
else
    echo -e "${RED}✗ PM2状态: 异常${NC}"
    pm2 logs ai-menu-backend --lines 20
    exit 1
fi

# 检查健康检查
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✓ 健康检查: 通过"
else
    echo -e "${RED}✗ 健康检查: 失败${NC}"
    pm2 logs ai-menu-backend --lines 20
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}部署成功！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "服务信息:"
echo "  - 端口: 8080"
echo "  - 进程: ai-menu-backend"
echo "  - 日志: pm2 logs ai-menu-backend"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs ai-menu-backend"
echo "  重启服务: pm2 restart ai-menu-backend"
echo "  停止服务: pm2 stop ai-menu-backend"
echo ""
echo "测试API:"
echo "  curl http://localhost:8080/health"
echo ""
echo -e "${YELLOW}下一步：配置Nginx反向代理（可选）${NC}"
echo ""

