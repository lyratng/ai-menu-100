/**
 * 运行数据库迁移脚本
 * 使用方法: tsx backend/scripts/run-migration.ts <migration-file>
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

async function runMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('❌ 使用方法: tsx backend/scripts/run-migration.ts <migration-file>');
    console.error('\n示例:');
    console.error('  tsx backend/scripts/run-migration.ts 003_create_admin_users.sql');
    process.exit(1);
  }

  try {
    const sqlPath = join(__dirname, '../database/migrations', migrationFile);
    console.log(`\n📄 读取SQL文件: ${sqlPath}`);
    
    const sql = readFileSync(sqlPath, 'utf-8');
    console.log('✅ SQL文件读取成功\n');
    console.log('🚀 执行迁移...');
    console.log('=====================================\n');
    
    await db.query(sql);
    
    console.log('\n✅ 迁移执行成功！\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ 迁移执行失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

