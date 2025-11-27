#!/bin/bash

echo "======================================"
echo "🔧 修复重定向循环问题"
echo "======================================"
echo ""

echo "步骤1: 诊断问题..."
echo "======================================"
echo ""

echo "1️⃣ 检查 app.ai-menu.tech 的重定向..."
echo "追踪重定向路径："
curl -L -v https://app.ai-menu.tech 2>&1 | grep -E "< HTTP|< Location" | head -20
echo ""

echo "2️⃣ 检查 admin.ai-menu.tech 的重定向..."
curl -L -v https://admin.ai-menu.tech 2>&1 | grep -E "< HTTP|< Location" | head -20
echo ""

echo "3️⃣ 当前DNS解析状态："
echo "app.ai-menu.tech → $(nslookup app.ai-menu.tech 8.8.8.8 | grep "Address:" | tail -1 | awk '{print $2}')"
echo "admin.ai-menu.tech → $(nslookup admin.ai-menu.tech 8.8.8.8 | grep "Address:" | tail -1 | awk '{print $2}')"
echo "api.ai-menu.tech → $(nslookup api.ai-menu.tech 8.8.8.8 | grep "Address:" | tail -1 | awk '{print $2}')"
echo ""

echo "======================================"
echo "步骤2: 可能的解决方案"
echo "======================================"
echo ""

echo "⚠️  检测到重定向循环！"
echo ""
echo "可能原因："
echo "1. Cloudflare 仍在代理这些域名（橙色云朵）"
echo "2. Cloudflare 有 Page Rules 导致重定向"
echo "3. Vercel 的域名配置有问题"
echo ""
echo "建议操作："
echo "1. 检查 Cloudflare DNS 中 app 和 admin 记录是否也是灰色云朵"
echo "2. 检查 Cloudflare 的 Page Rules（Rules → Page Rules）"
echo "3. 临时使用 Vercel 的默认域名访问"
echo ""
echo "======================================"
echo "✅ 诊断完成！"
echo "======================================"

