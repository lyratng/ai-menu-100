import OSS from 'ali-oss';
import { env } from '../config/env';
import { randomBytes } from 'crypto';
import { extname } from 'path';

// 创建OSS客户端
const client = new OSS({
  region: env.OSS_REGION,
  accessKeyId: env.OSS_ACCESS_KEY_ID,
  accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  bucket: env.OSS_BUCKET,
  endpoint: env.OSS_ENDPOINT,
});

/**
 * 生成唯一文件名
 */
function generateFileName(originalName: string, prefix?: string): string {
  const ext = extname(originalName);
  const randomString = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const fileName = `${timestamp}-${randomString}${ext}`;
  
  return prefix ? `${prefix}/${fileName}` : fileName;
}

/**
 * 上传文件到OSS
 */
export async function uploadFile(
  file: Buffer,
  originalName: string,
  prefix?: string
): Promise<{
  key: string;
  url: string;
  size: number;
}> {
  try {
    const fileName = generateFileName(originalName, prefix);
    const result = await client.put(fileName, file);
    
    return {
      key: fileName,
      url: result.url,
      size: file.length,
    };
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw new Error('文件上传失败');
  }
}

/**
 * 上传Buffer到OSS（直接返回URL）
 */
export async function uploadBuffer(
  buffer: Buffer,
  ossPath: string
): Promise<string> {
  try {
    const result = await client.put(ossPath, buffer);
    return result.url;
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw new Error('文件上传失败');
  }
}

/**
 * 从OSS下载文件
 */
export async function downloadFile(key: string): Promise<Buffer> {
  try {
    const result = await client.get(key);
    return result.content as Buffer;
  } catch (error) {
    console.error('OSS下载失败:', error);
    throw new Error('文件下载失败');
  }
}

/**
 * 删除OSS文件
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    await client.delete(key);
  } catch (error) {
    console.error('OSS删除失败:', error);
    throw new Error('文件删除失败');
  }
}

/**
 * 生成签名URL（用于临时访问）
 */
export async function getSignedUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  try {
    const url = client.signatureUrl(key, {
      expires: expiresInSeconds,
    });
    return url;
  } catch (error) {
    console.error('生成签名URL失败:', error);
    throw new Error('生成访问链接失败');
  }
}

/**
 * 测试OSS连接
 */
export async function testOSSConnection(): Promise<boolean> {
  try {
    await client.list({
      'max-keys': 1,
    });
    console.log('✅ OSS连接成功');
    return true;
  } catch (error) {
    console.error('❌ OSS连接失败:', error);
    return false;
  }
}

