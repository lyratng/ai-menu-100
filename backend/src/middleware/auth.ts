import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, extractToken, JWTPayload } from '../utils/jwt';

// 扩展Fastify Request类型，添加user字段
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * 认证中间件 - 验证JWT token
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = extractToken(request.headers.authorization);
    
    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未提供认证token',
        },
      });
    }
    
    const payload = verifyToken(token);
    request.user = payload;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token无效或已过期',
      },
    });
  }
}

/**
 * 管理员权限中间件
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未认证',
      },
    });
  }
  
  if (request.user.role !== 'admin') {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '需要管理员权限',
      },
    });
  }
}

/**
 * 门店管理员权限中间件
 */
export async function storeManagerMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未认证',
      },
    });
  }
  
  const allowedRoles = ['admin', 'store_manager'];
  if (!allowedRoles.includes(request.user.role)) {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '需要门店管理员权限',
      },
    });
  }
}

