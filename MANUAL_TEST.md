# 手动测试菜单生成 - 简单步骤

## 问题诊断

从你的错误来看：
```
❌ API请求失败: {url: '/api/menu/generate', method: 'post', hasResponse: false}
🌐 网络错误详情: {message: 'timeout of 150000ms exceeded', code: 'ECONNABORTED'}
```

**问题**：前端超时150秒，后端日志无输出 → 后端可能崩溃或者没收到请求

---

## 手动操作步骤

### 步骤1：检查后端是否运行

在终端运行：
```bash
lsof -i :8080
```

**期望输出**：
```
COMMAND   PID   USER   FD   TYPE   ...
node      xxxxx apple  37u  IPv4   ... *:http-alt (LISTEN)
```

**如果没有输出** → 后端没运行，需要启动：
```bash
cd /Users/apple/ai-menu-100/backend
pnpm dev
```

**让这个终端窗口保持打开！不要关闭！**

---

### 步骤2：查看实时日志

**在另一个新终端窗口**运行：
```bash
tail -f /tmp/backend-debug.log
```

或者如果上面没输出，试试：
```bash
cd /Users/apple/ai-menu-100/backend
pnpm dev
```
**让日志一直显示！**

---

### 步骤3：测试生成菜单

1. 访问：http://localhost:3000
2. 登录
3. 点击"生成菜单"
4. **同时观察后端终端的日志输出**

---

## 关键日志判断

### ✅ 正常情况（应该看到）

```
🍳 开始生成菜单...
📊 检查专属菜库...
🔍 获取菜品数据...
查询通用菜库...
通用菜库: 229道
📊 菜品类型分布: {热菜主荤: 79, ...}
✅ 获取到 229 道菜品
🤖 构建AI Prompt...
📏 Prompt长度: system=1234字符, user=6789字符
💰 预估tokens: 4012
🚀 调用deepseek-chat，请耐心等待...
⏱️  [时间戳] - 开始调用AI
... (等待30-60秒)
⏱️  [时间戳] - AI响应完成
✅ AI响应成功，耗时: 35200ms
💾 保存菜单到数据库...
🎉 菜单生成完成！
```

### ❌ 异常情况

#### 情况A：后端完全没有日志
**说明**：请求根本没到后端
**原因**：
- 后端进程崩溃了
- 端口不对
- CORS问题

**解决**：重启后端，确保看到：
```
✅ 服务器启动成功!
📍 地址: http://0.0.0.0:8080
```

#### 情况B：卡在"开始调用AI"
**说明**：DeepSeek API没有响应
**原因**：
- Prompt太长
- 网络问题
- DeepSeek服务繁忙

**解决**：
1. 等待最多100秒（后端会自动超时）
2. 如果超时，稍后重试
3. 如果持续失败，需要简化Prompt

#### 情况C：看到错误信息
**说明**：具体错误
**解决**：把错误信息发给我

---

## 快速测试命令（一行搞定）

**方法1：完全重启**
```bash
# 在终端运行这一行（复制粘贴）
lsof -ti :8080 | xargs kill -9 2>/dev/null; sleep 2; cd /Users/apple/ai-menu-100/backend && pnpm dev
```

**让这个终端保持运行！观察日志！**

然后在浏览器点击"生成菜单"

---

## 如果还是不行

### 方案A：查看完整后端代码有无语法错误

```bash
cd /Users/apple/ai-menu-100/backend
pnpm run build
```

如果有错误会显示出来。

### 方案B：检查环境变量

```bash
cat /Users/apple/ai-menu-100/backend/.env | grep DEEPSEEK
```

应该看到：
```
DEEPSEEK_API_KEY=sk-b74e7f38bf77468d8076e64db390155a
```

### 方案C：测试DeepSeek API是否可用

```bash
curl -X POST https://api.deepseek.com/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-b74e7f38bf77468d8076e64db390155a" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "你好"}],
    "max_tokens": 10
  }'
```

应该看到JSON响应，不是错误。

---

## 简化测试方案（如果还是超时）

如果一直超时，我们可以：

### 临时方案：生成1天菜单测试

修改 `backend/src/services/menu.ts` 第286行：
```typescript
// 改回简化版，只生成1天
const systemPrompt = `你是一位经验丰富的厨师长。请为团餐食堂生成一天的午餐菜谱。

【重要】菜名规则：
必须严格使用提供的菜品来源中的菜名，不得修改。

【输出要求】：
严格按照JSON格式输出：
{
  "monday": [
    {
      "name": "菜品名称",
      "description": "简短介绍",
      "cookingMethod": "烹饪方法"
    }
  ]
}`;
```

然后重启后端测试。

---

## 我需要的信息

**如果还是失败，请截图或复制以下内容给我：**

1. 后端终端的**完整输出**（从启动到生成菜单结束）
2. 前端浏览器控制台的错误信息
3. 运行这个命令的输出：
   ```bash
   tail -200 /tmp/backend-debug.log
   ```

---

## 最简单的测试方法

1. **打开2个终端窗口**

2. **终端1** - 运行后端并保持打开：
   ```bash
   cd /Users/apple/ai-menu-100/backend
   pnpm dev
   ```

3. **终端2** - 备用（如果需要运行其他命令）

4. **浏览器** - 访问 http://localhost:3000，点击生成菜单

5. **观察终端1的日志输出**

6. **把终端1的所有输出复制给我**

---

现在，请按上面的步骤操作，然后告诉我看到了什么！

