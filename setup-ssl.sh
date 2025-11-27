#!/bin/bash
set -e

echo "🔐 开始配置 SSL 证书..."

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ 请使用 root 权限运行: sudo bash setup-ssl.sh"
  exit 1
fi

# 1. 安装 Certbot
echo "📦 安装 Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# 2. 停止 Nginx
echo "⏸️  停止 Nginx..."
systemctl stop nginx || true

# 3. 获取 SSL 证书
echo "🔑 获取 SSL 证书..."
read -p "请输入你的邮箱地址（用于证书通知）: " email
certbot certonly --standalone -d api.ai-menu.tech --non-interactive --agree-tos --email "$email"

# 4. 配置 Nginx
echo "⚙️  配置 Nginx..."
cat > /etc/nginx/sites-available/api.ai-menu.tech <<'EOF'
# HTTP 跳转 HTTPS
server {
    listen 80;
    server_name api.ai-menu.tech;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name api.ai-menu.tech;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/api.ai-menu.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ai-menu.tech/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/api.ai-menu.tech.access.log;
    error_log /var/log/nginx/api.ai-menu.tech.error.log;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    client_max_body_size 50M;
}
EOF

# 5. 测试并启动 Nginx
echo "🧪 测试 Nginx 配置..."
nginx -t

echo "🚀 启动 Nginx..."
systemctl start nginx
systemctl enable nginx

# 6. 配置自动续期
echo "🔄 配置证书自动续期..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo "✅ SSL 证书配置完成！"
echo ""
echo "📋 验证步骤："
echo "1. 访问 https://api.ai-menu.tech"
echo "2. 检查证书有效性"
echo "3. 测试前端功能"

