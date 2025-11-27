#!/bin/bash

echo "======================================"
echo "🌐 DNS传播检查工具"
echo "======================================"
echo ""

echo "1️⃣ 使用Google DNS查询 (8.8.8.8)..."
nslookup api.ai-menu.tech 8.8.8.8 | grep -A 1 "Name:"
echo ""

echo "2️⃣ 使用Cloudflare DNS查询 (1.1.1.1)..."
nslookup api.ai-menu.tech 1.1.1.1 | grep -A 1 "Name:"
echo ""

echo "3️⃣ 使用阿里DNS查询 (223.5.5.5)..."
nslookup api.ai-menu.tech 223.5.5.5 | grep -A 1 "Name:"
echo ""

echo "4️⃣ 使用系统默认DNS查询..."
nslookup api.ai-menu.tech | grep -A 1 "Name:"
echo ""

echo "======================================"
echo "✅ 如果所有结果都是 8.140.9.139，说明DNS已完全生效！"
echo "⏰ 如果还是 172.67.201.236，请等待5-10分钟后再检查"
echo "======================================"

