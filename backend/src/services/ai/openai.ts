import { env } from '../../config/env';
import axios from 'axios';

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
 * 调用OpenAI Chat API（预留）
 */
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
  if (!env.OPENAI_API_KEY || !env.OPENAI_BASE_URL) {
    throw new Error('OpenAI API未配置');
  }

  try {
    const response = await axios.post<ChatCompletionResponse>(
      `${env.OPENAI_BASE_URL}/chat/completions`,
      {
        model: options?.model || 'gpt-4-turbo-preview',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 4000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  } catch (error: any) {
    console.error('OpenAI API错误:', error.response?.data || error.message);
    throw new Error(`OpenAI API调用失败: ${error.message}`);
  }
}

/**
 * 测试OpenAI API连接
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    if (!env.OPENAI_API_KEY) {
      console.log('⏸️  OpenAI API未配置（预留）');
      return false;
    }
    
    const result = await chatCompletion([
      { role: 'user', content: 'Hello' },
    ], {
      max_tokens: 10,
    });
    
    console.log('✅ OpenAI API连接成功:', result.content);
    return true;
  } catch (error) {
    console.error('❌ OpenAI API连接失败:', error);
    return false;
  }
}

