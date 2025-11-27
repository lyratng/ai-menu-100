#!/bin/bash

echo "======================================"
echo "🔍 AI菜单系统 - ECS状态检查脚本"
echo "======================================"
echo ""

# 1. 检查Nginx
echo "1️⃣ 检查Nginx状态..."
if command -v nginx &> /dev/null; then
    nginx -v 2>&1
    echo "✅ Nginx已安装"
    echo ""
    
    # 检查Nginx是否运行
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo "✅ Nginx正在运行"
    else
        echo "❌ Nginx未运行"
    fi
    echo ""
    
    # 列出Nginx配置文件
    echo "📁 Nginx配置文件："
    ls -lh /etc/nginx/sites-enabled/ 2>/dev/null || echo "目录不存在"
    echo ""
else
    echo "❌ Nginx未安装"
    echo ""
fi

# 2. 检查SSL证书
echo "2️⃣ 检查SSL证书..."
if command -v certbot &> /dev/null; then
    certbot --version
    echo "✅ Certbot已安装"
    echo ""
    certbot certificates 2>&1 | head -20
else
    echo "❌ Certbot未安装（需要安装才能配置HTTPS）"
fi
echo ""

# 3. 检查后端服务
echo "3️⃣ 检查后端服务..."
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
else
    echo "❌ PM2未安装"
fi

# 4. 检查后端配置
echo "4️⃣ 检查后端环境变量..."
if [ -f /opt/ai-menu/backend/.env ]; then
    echo "✅ .env文件存在"
    echo ""
    echo "关键配置（隐藏敏感信息）："
    grep -E "^(PORT|NODE_ENV|CORS_ORIGIN|HOST)" /opt/ai-menu/backend/.env
    echo ""
    echo "数据库配置："
    grep "^DATABASE_URL" /opt/ai-menu/backend/.env | sed 's/:.*/:*****/'
    echo ""
else
    echo "❌ .env文件不存在"
fi

# 5. 测试后端是否运行
echo "5️⃣ 测试后端API..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ 后端API正常运行 (HTTP $response)"
else
    echo "❌ 后端API无响应 (HTTP $response)"
fi
echo ""

# 6. 检查端口占用
echo "6️⃣ 检查端口占用..."
echo "端口8080: $(lsof -i:8080 -t 2>/dev/null | wc -l) 个进程"
echo "端口80: $(lsof -i:80 -t 2>/dev/null | wc -l) 个进程"
echo "端口443: $(lsof -i:443 -t 2>/dev/null | wc -l) 个进程"
echo ""

# 7. 检查防火墙
echo "7️⃣ 检查防火墙状态..."
if command -v ufw &> /dev/null; then
    ufw status
else
    echo "ℹ️ UFW未安装"
fi
echo ""

echo "======================================"
echo "✅ 检查完成！"
echo "======================================"

