#!/bin/bash

echo "======================================"
echo "🔍 AI菜单系统 - 完整迁移测试"
echo "======================================"
echo ""

echo "第一步：检查DNS是否生效"
echo "======================================"
echo ""

echo "1️⃣ 检查 api.ai-menu.tech 的DNS解析..."
API_IP=$(nslookup api.ai-menu.tech 8.8.8.8 | grep "Address:" | tail -1 | awk '{print $2}')
echo "当前解析到：$API_IP"

if [ "$API_IP" == "8.140.9.139" ]; then
    echo "✅ DNS已生效！指向正确的ECS服务器"
else
    echo "⏰ DNS还在传播中，当前指向：$API_IP"
    echo "   期望值：8.140.9.139"
    echo ""
    echo "⚠️  请等待5-10分钟后重试"
    exit 1
fi

echo ""
echo "第二步：测试后端API"
echo "======================================"
echo ""

echo "2️⃣ 测试 HTTPS API 健康检查..."
HTTPS_RESPONSE=$(curl -s https://api.ai-menu.tech/health)
echo "响应：$HTTPS_RESPONSE"

if echo "$HTTPS_RESPONSE" | grep -q "status"; then
    echo "✅ HTTPS API 正常工作！"
else
    echo "❌ HTTPS API 返回异常"
    echo "   可能原因：DNS还在传播中，或Cloudflare还在缓存"
    exit 1
fi

echo ""
echo "第三步：测试前端页面"
echo "======================================"
echo ""

echo "3️⃣ 检查前端页面..."
echo "   用户前端：https://app.ai-menu.tech"
echo "   管理后台：https://admin.ai-menu.tech"
echo ""

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.ai-menu.tech)
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://admin.ai-menu.tech)

if [ "$FRONTEND_STATUS" == "200" ]; then
    echo "✅ 用户前端可访问 (HTTP $FRONTEND_STATUS)"
else
    echo "⚠️  用户前端返回 HTTP $FRONTEND_STATUS"
fi

if [ "$ADMIN_STATUS" == "200" ]; then
    echo "✅ 管理后台可访问 (HTTP $ADMIN_STATUS)"
else
    echo "⚠️  管理后台返回 HTTP $ADMIN_STATUS"
fi

echo ""
echo "======================================"
echo "✅ 所有检查完成！"
echo "======================================"
echo ""
echo "📋 下一步："
echo "1. 打开浏览器访问 https://app.ai-menu.tech"
echo "2. 按 F12 打开开发者工具"
echo "3. 查看 Console 和 Network 标签"
echo "4. 尝试注册/登录功能"
echo "5. 检查是否有 API 错误"
echo ""
echo "🎉 如果所有功能正常，迁移就成功了！"

