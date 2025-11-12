import 'fastify';
import { Pool } from 'pg';

declare module 'fastify' {
  interface FastifyInstance {
    pg: Pool;
    authenticate: (request: any, reply: any) => Promise<void>;
    authMiddleware: (request: any, reply: any) => Promise<void>;
    adminMiddleware: (request: any, reply: any) => Promise<void>;
    storeManagerMiddleware: (request: any, reply: any) => Promise<void>;
  }
}

