#!/bin/bash

# 炊语AI菜单系统 - 后端启动脚本

echo "🚀 启动后端服务..."

# 1. 清理旧进程
echo "📌 清理8080端口..."
lsof -ti :8080 | xargs kill -9 2>/dev/null || true

# 2. 进入后端目录
cd /Users/apple/ai-menu-100/backend

# 3. 启动后端
echo "🎯 启动Fastify服务器..."
pnpm dev

# 注意：这个脚本会占用终端，如果需要后台运行，请用：
# nohup ./start-backend.sh > /tmp/backend.log 2>&1 &

