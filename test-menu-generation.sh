#!/bin/bash

echo "=================================="
echo "🧪 菜单生成测试脚本"
echo "=================================="
echo ""

# 清空旧日志
echo "1️⃣  清空旧日志..."
> /tmp/backend.log
echo "✅ 日志已清空"
echo ""

# 确认后端运行
echo "2️⃣  检查后端状态..."
if lsof -i :8080 > /dev/null 2>&1; then
  echo "✅ 后端正在运行 (端口8080)"
else
  echo "❌ 后端未运行，正在启动..."
  cd /Users/apple/ai-menu-100/backend
  pnpm dev > /tmp/backend.log 2>&1 &
  sleep 5
  echo "✅ 后端已启动"
fi
echo ""

# 确认前端运行
echo "3️⃣  检查前端状态..."
if lsof -i :3000 > /dev/null 2>&1; then
  echo "✅ 前端正在运行 (端口3000)"
else
  echo "⚠️  前端未运行，请手动启动："
  echo "   cd /Users/apple/ai-menu-100/frontend && pnpm dev"
fi
echo ""

# 查看数据库菜品统计
echo "4️⃣  数据库菜品统计..."
psql ai_menu -c "
SELECT 
  dish_type as 菜品类型, 
  COUNT(*) as 数量
FROM dishes_common 
WHERE is_active = TRUE
GROUP BY dish_type 
ORDER BY 数量 DESC;
" 2>/dev/null
echo ""

# 提示用户操作
echo "=================================="
echo "📋 下一步操作："
echo "=================================="
echo ""
echo "1. 访问前端：http://localhost:3000"
echo "2. 登录账号"
echo "3. 点击【生成菜单】按钮"
echo ""
echo "4. 在新终端窗口查看实时日志："
echo "   tail -f /tmp/backend.log"
echo ""
echo "   或过滤关键信息："
echo "   tail -f /tmp/backend.log | grep --line-buffered \"🍳\\|⏱️\\|✅\\|❌\\|📏\\|💰\""
echo ""
echo "=================================="
echo "⏱️  预计生成时间：30-60秒"
echo "=================================="
echo ""

# 等待用户生成菜单
echo "请在前端点击生成菜单，然后按Enter继续..."
read

# 显示日志摘要
echo ""
echo "📊 生成结果日志摘要："
echo "=================================="
tail -100 /tmp/backend.log | grep -E "开始生成菜单|Prompt长度|预估tokens|AI响应成功|生成菜单失败|菜单生成完成"
echo "=================================="
echo ""

# 显示完整日志
echo "查看完整日志请运行："
echo "  tail -200 /tmp/backend.log"
echo ""
echo "或查看实时日志："
echo "  tail -f /tmp/backend.log"

