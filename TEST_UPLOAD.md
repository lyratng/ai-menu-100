# 文件上传功能测试指南

## 🔍 问题诊断

### 步骤1：检查浏览器Network（网络）面板

1. 打开浏览器开发者工具（F12 或 右键 → 检查）
2. 切换到 **Network（网络）** 标签
3. 确保勾选了 **Preserve log（保留日志）**
4. 尝试上传文件
5. 查看是否有请求发出

#### 可能的情况：

**情况A：没有任何请求**
- 问题：JavaScript代码未执行或被拦截
- 解决：检查Console有无JavaScript错误

**情况B：请求显示为红色（失败）**
- 点击该请求
- 查看 **Headers** 标签中的 **Status Code**
- 查看 **Response** 标签中的错误信息

**情况C：请求显示为 CORS error**
```
Access to fetch at 'http://localhost:8080/api/menu/upload' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```
- 问题：后端CORS配置
- 解决：检查后端是否真的在运行

---

## 🧪 快速测试

### 测试1：后端健康检查
```bash
curl http://localhost:8080/health
```

**预期结果**：
```json
{
  "status": "ok",
  "database": true,
  "oss": false
}
```

---

### 测试2：测试上传API（使用curl）

```bash
# 首先获取token
# 1. 在浏览器登录后，打开Console
# 2. 输入：sessionStorage.getItem('registerToken')
# 3. 复制token

# 然后测试上传
TOKEN="粘贴你的token"
STORE_ID="你的门店ID（从sessionStorage.getItem('registerUser')中获取）"

# 创建测试Excel文件（如果还没有）
echo "周一,周二,周三,周四,周五
红烧肉,宫保鸡丁,鱼香肉丝,糖醋排骨,回锅肉
可乐鸡翅,香菇烧鸡,红烧带鱼,酸菜鱼,水煮鱼
拍黄瓜,凉拌海带,拍黄瓜,凉拌黄瓜,拍黄瓜" > test_menu.csv

# 测试上传
curl -X POST http://localhost:8080/api/menu/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_menu.csv" \
  -F "store_id=$STORE_ID" \
  -F "meal_type=lunch" \
  -v
```

**预期结果**：
```json
{
  "success": true,
  "data": {
    "menu_id": "uuid",
    "job_id": "parse-uuid",
    "status": "pending_parse",
    "days": 5
  }
}
```

---

### 测试3：在浏览器Console中测试

打开浏览器Console，粘贴以下代码：

```javascript
// 1. 检查token和用户信息
const token = sessionStorage.getItem('registerToken');
const userStr = sessionStorage.getItem('registerUser');
console.log('Token:', token ? '存在' : '不存在');
console.log('User:', userStr);

if (userStr) {
  const user = JSON.parse(userStr);
  console.log('门店ID:', user.storeId || user.store_id);
}

// 2. 创建测试文件
const testContent = `周一,周二,周三,周四,周五
红烧肉,宫保鸡丁,鱼香肉丝,糖醋排骨,回锅肉
可乐鸡翅,香菇烧鸡,红烧带鱼,酸菜鱼,水煮鱼`;

const blob = new Blob([testContent], { type: 'text/csv' });
const testFile = new File([blob], 'test_menu.csv', { type: 'text/csv' });

// 3. 上传测试文件
const formData = new FormData();
formData.append('file', testFile);
formData.append('store_id', JSON.parse(userStr).storeId || JSON.parse(userStr).store_id);
formData.append('meal_type', 'lunch');

console.log('📤 开始测试上传...');

fetch('http://localhost:8080/api/menu/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
})
.then(response => {
  console.log('📨 响应状态:', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('✅ 上传成功:', data);
})
.catch(error => {
  console.error('❌ 上传失败:', error);
});
```

---

## 🐛 常见问题

### 问题1：`store_id是必填参数`

**原因**：前端没有传递 `store_id`

**解决**：已修复，前端现在会传递 `store_id`

**验证**：
```javascript
// 在Console中检查
const userStr = sessionStorage.getItem('registerUser');
const user = JSON.parse(userStr);
console.log('门店ID:', user.storeId || user.store_id);
```

---

### 问题2：`401 Unauthorized`

**原因**：Token无效或过期

**解决**：
```javascript
// 重新登录或检查token
const token = sessionStorage.getItem('registerToken');
console.log('Token:', token);

// 如果没有token，需要重新注册或登录
```

---

### 问题3：网络错误 `Failed to fetch`

**可能原因**：
1. 后端没有运行
2. 端口不对
3. CORS问题

**检查后端**：
```bash
# 检查后端进程
lsof -i :8080

# 重启后端
cd /Users/apple/ai-menu-100/backend
pnpm dev
```

**检查CORS**：
```bash
# 测试CORS preflight
curl -X OPTIONS http://localhost:8080/api/menu/upload \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization" \
  -v
```

应该看到：
```
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Methods: POST
< Access-Control-Allow-Headers: authorization
```

---

### 问题4：Excel解析失败

**原因**：Excel格式不正确

**正确格式**：
- 第一行是表头（包含"周一"、"周二"等）
- 后续行是菜名

**示例**：
| 周一 | 周二 | 周三 | 周四 | 周五 |
|------|------|------|------|------|
| 红烧肉 | 宫保鸡丁 | 鱼香肉丝 | 糖醋排骨 | 回锅肉 |
| 可乐鸡翅 | 香菇烧鸡 | 红烧带鱼 | 酸菜鱼 | 水煮鱼 |

---

## 📊 调试Checklist

请按顺序检查以下项目：

- [ ] 1. 后端正在运行（`lsof -i :8080` 有输出）
- [ ] 2. Redis正在运行（`redis-cli ping` 返回 PONG）
- [ ] 3. 前端可以访问（http://localhost:3000）
- [ ] 4. 用户已注册并有token（`sessionStorage.getItem('registerToken')`）
- [ ] 5. 用户有storeId（查看 `sessionStorage.getItem('registerUser')`）
- [ ] 6. 浏览器Network面板显示请求已发出
- [ ] 7. 请求Status不是红色（不是错误）
- [ ] 8. Console没有JavaScript错误
- [ ] 9. Console没有CORS错误
- [ ] 10. 后端日志显示收到请求

---

## 🎯 当前修复

### 已修复的问题：

1. ✅ 路由冲突（删除了重复的 `upload.ts`）
2. ✅ 前端添加了 `store_id` 和 `meal_type` 参数
3. ✅ 添加了详细的console日志

### 待验证：

请在浏览器中：
1. 打开 **Network** 面板
2. 打开 **Console** 面板
3. 尝试上传文件
4. **截图或复制** Network和Console中的所有信息

---

## 📞 反馈信息

请提供以下信息以便进一步诊断：

1. **浏览器Console输出**（所有console.log）
2. **Network面板**：
   - 请求的URL
   - Status Code
   - Response内容
3. **后端日志**（后端终端的输出）
4. **用户信息**：
   ```javascript
   console.log(sessionStorage.getItem('registerUser'));
   ```

---

**测试时间**：约5分钟  
**难度**：简单  
**需要工具**：浏览器开发者工具

