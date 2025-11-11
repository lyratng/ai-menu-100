import { env } from '../../config/env';
import axios from 'axios';
import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';

// 创建持久连接的axios实例
const deepseekAxios = axios.create({
  baseURL: env.DEEPSEEK_BASE_URL,
  timeout: 120000, // 增加到120秒超时（菜单生成可能需要更长时间）
  headers: {
    'Content-Type': 'application/json',
  },
  httpAgent: new Agent({ keepAlive: true, timeout: 120000 }),
  httpsAgent: new HttpsAgent({ keepAlive: true, timeout: 120000 }),
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用DeepSeek Chat API
 */
/**
 * 带重试的API调用
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 5,  // 增加到5次重试（总共6次尝试）
  delay: number = 3000  // 增加延迟到3秒
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === retries;
      const isRetryable = error.code === 'ECONNRESET' || 
                          error.code === 'ECONNABORTED' ||
                          error.code === 'ETIMEDOUT';
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      console.log(`⚠️  第 ${i + 1} 次尝试失败 (${error.code}), ${delay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('重试失败');
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
  }
): Promise<{
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}> {
  console.log('🔌 准备调用DeepSeek API...');
  console.log(`   模型: ${options?.model || env.LLM_MODEL}`);
  console.log(`   消息数: ${messages.length}`);
  
  const response = await callWithRetry(async () => {
    const res = await deepseekAxios.post<ChatCompletionResponse>(
      '/chat/completions',
      {
        model: options?.model || env.LLM_MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 4000,
      },
      {
        headers: {
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
      }
    );
    return res;
  }); // 使用默认重试参数：5次重试，3秒延迟

  console.log('📥 DeepSeek响应成功');
  console.log(`   Tokens: ${response.data.usage.total_tokens}`);
  console.log(`   内容长度: ${response.data.choices[0].message.content.length} 字符`);

  return {
    content: response.data.choices[0].message.content,
    usage: response.data.usage,
  };
}

/**
 * 生成Embedding（预留）
 */
export async function generateEmbedding(
  text: string
): Promise<number[]> {
  // TODO: 实现embedding生成
  // 当前DeepSeek可能没有公开的embedding API
  // 这里预留接口，后续可以替换为其他embedding服务
  throw new Error('Embedding generation not implemented yet');
}

/**
 * 测试DeepSeek API连接
 */
export async function testDeepSeekConnection(): Promise<boolean> {
  try {
    const result = await chatCompletion([
      { role: 'user', content: '你好' },
    ], {
      max_tokens: 10,
    });
    
    console.log('✅ DeepSeek API连接成功:', result.content);
    return true;
  } catch (error) {
    console.error('❌ DeepSeek API连接失败:', error);
    return false;
  }
}

