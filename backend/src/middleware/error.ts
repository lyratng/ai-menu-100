import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

/**
 * 全局错误处理器
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Zod验证错误
  if (error instanceof ZodError) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: '请求参数验证失败',
        details: error.errors,
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  // 自定义业务错误
  if (error.statusCode && error.statusCode < 500) {
    return reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code || 'BAD_REQUEST',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  // 服务器内部错误
  console.error('Internal Server Error:', error);
  
  return reply.code(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : error.message,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * 404错误处理器
 */
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.code(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由 ${request.method} ${request.url} 不存在`,
    },
    timestamp: new Date().toISOString(),
  });
}

