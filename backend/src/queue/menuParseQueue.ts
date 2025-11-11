import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from './connection.js';
import { parseMenuAndUpsertDishes } from '../services/menuParse.js';

export interface MenuParseJobData {
  menuId: string;
  storeId: string;
  fileName: string;
}

// 创建队列
export const menuParseQueue = new Queue<MenuParseJobData>('menu-parse', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // 失败重试3次
    backoff: {
      type: 'exponential',
      delay: 2000, // 初始延迟2秒
    },
    removeOnComplete: {
      age: 24 * 3600, // 24小时后删除已完成的任务
      count: 100, // 保留最近100个已完成的任务
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7天后删除失败的任务
    },
  },
});

// 创建Worker处理任务
export const menuParseWorker = new Worker<MenuParseJobData>(
  'menu-parse',
  async (job: Job<MenuParseJobData>) => {
    console.log(`\n🔄 开始处理菜单解析任务: ${job.id}`);
    console.log(`📋 菜单ID: ${job.data.menuId}`);
    console.log(`🏪 门店ID: ${job.data.storeId}`);
    console.log(`📄 文件名: ${job.data.fileName}`);
    
    try {
      // 更新进度：0% - 开始解析
      await job.updateProgress(0);
      
      // 调用解析服务
      await parseMenuAndUpsertDishes(
        job.data.menuId,
        job.data.storeId,
        (progress) => {
          // 更新进度
          job.updateProgress(progress);
        }
      );
      
      // 更新进度：100% - 完成
      await job.updateProgress(100);
      
      console.log(`✅ 菜单解析任务完成: ${job.id}`);
      
      return { success: true, menuId: job.data.menuId };
    } catch (error: any) {
      console.error(`❌ 菜单解析任务失败: ${job.id}`, error);
      throw error; // 抛出错误以触发重试
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // 同时处理2个任务
  }
);

// 监听Worker事件
menuParseWorker.on('completed', (job) => {
  console.log(`✅ 任务完成: ${job.id}`);
});

menuParseWorker.on('failed', (job, err) => {
  console.error(`❌ 任务失败: ${job?.id}`, err.message);
});

menuParseWorker.on('error', (err) => {
  console.error('❌ Worker错误:', err);
});

console.log('🚀 菜单解析Worker已启动');

/**
 * 添加菜单解析任务到队列
 */
export async function addMenuParseJob(data: MenuParseJobData) {
  const job = await menuParseQueue.add('parse-menu', data, {
    jobId: `parse-${data.menuId}`, // 使用menuId作为jobId，确保幂等
  });
  
  console.log(`📨 菜单解析任务已加入队列: ${job.id}`);
  
  return job;
}

/**
 * 获取任务状态
 */
export async function getJobStatus(jobId: string) {
  const job = await menuParseQueue.getJob(jobId);
  
  if (!job) {
    return null;
  }
  
  const state = await job.getState();
  const progress = job.progress;
  
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    state,
    progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
  };
}

