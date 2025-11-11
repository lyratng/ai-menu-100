import { testDeepSeekConnection, chatCompletion } from '../src/services/ai/deepseek';
import dotenv from 'dotenv';

dotenv.config();

async function testDeepSeek() {
  console.log('🧪 测试DeepSeek API连接...\n');
  
  // 测试1: 简单问候
  console.log('📝 测试1: 简单问候');
  try {
    const result = await chatCompletion([
      { role: 'user', content: '你好，请回复"你好"' }
    ], {
      max_tokens: 20,
      temperature: 0.1,
    });
    console.log('✅ 测试1成功:', result.content);
    console.log(`   Tokens: ${result.usage.total_tokens}\n`);
  } catch (error: any) {
    console.error('❌ 测试1失败:', error.message);
    console.error('   错误代码:', error.code);
    console.error('   错误详情:', error.response?.data || error.stack?.split('\n')[0]);
    return; // 如果简单测试失败，后续测试也不进行了
  }

  // 测试2: 生成少量菜名
  console.log('📝 测试2: 生成3道菜名');
  try {
    const result = await chatCompletion([
      { 
        role: 'system', 
        content: '你是一位中餐厨师长。' 
      },
      { 
        role: 'user', 
        content: '请生成3道简单的中餐菜名，用JSON数组格式返回，例如：["宫保鸡丁", "红烧肉", "清炒西兰花"]' 
      }
    ], {
      max_tokens: 100,
      temperature: 0.7,
    });
    console.log('✅ 测试2成功:', result.content);
    console.log(`   Tokens: ${result.usage.total_tokens}\n`);
  } catch (error: any) {
    console.error('❌ 测试2失败:', error.message);
    console.error('   错误代码:', error.code);
    return;
  }

  // 测试3: 生成完整的一天菜单（模拟实际场景）
  console.log('📝 测试3: 生成一天的菜单（4道菜）');
  try {
    const systemPrompt = `你是一位在中国团餐行业工作多年的经验丰富的厨师长。请为团餐食堂生成一天的午餐菜谱。`;
    
    const userPrompt = `请从以下菜品中选取，生成一天的午餐菜谱（3道热菜 + 1道凉菜）：

热菜主荤: 可乐鸡翅、红烧肉、糖醋里脊
热菜素菜: 清炒西兰花、蒜蓉油麦菜、醋溜白菜
凉菜: 拍黄瓜、凉拌木耳

请严格按照JSON格式输出：
{
  "dishes": [
    { "name": "菜品名称", "description": "简介20字", "cookingMethod": "烹饪方法20字" }
  ]
}`;

    const startTime = Date.now();
    const result = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      max_tokens: 800,
      temperature: 0.7,
    });
    const duration = Date.now() - startTime;
    
    console.log('✅ 测试3成功！');
    console.log(`   耗时: ${duration}ms (${(duration/1000).toFixed(1)}秒)`);
    console.log(`   Tokens: ${result.usage.total_tokens}`);
    console.log(`   响应长度: ${result.content.length} 字符`);
    console.log(`   响应内容:\n${result.content.substring(0, 200)}...\n`);
  } catch (error: any) {
    console.error('❌ 测试3失败:', error.message);
    console.error('   错误代码:', error.code);
    if (error.response) {
      console.error('   HTTP状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
    return;
  }

  console.log('\n🎉 所有测试通过！DeepSeek API工作正常。');
  console.log('\n💡 建议:');
  console.log('   1. 如果生成5天菜单仍然失败，可能是prompt太长或网络不稳定');
  console.log('   2. 可以考虑分批生成（每次生成1-2天，而不是5天）');
  console.log('   3. 检查是否需要配置代理或VPN');
}

testDeepSeek().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ 测试出错:', error);
  process.exit(1);
});



