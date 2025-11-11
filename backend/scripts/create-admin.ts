/**
 * 创建管理员账号脚本
 * 使用方法: tsx backend/scripts/create-admin.ts <username> <password> [fullName] [email]
 */

import { hash } from 'bcrypt';
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

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ 使用方法: tsx backend/scripts/create-admin.ts <username> <password> [fullName] [email]');
    console.error('\n示例:');
    console.error('  tsx backend/scripts/create-admin.ts admin admin123');
    console.error('  tsx backend/scripts/create-admin.ts admin admin123 "系统管理员" "admin@ai-menu.tech"');
    process.exit(1);
  }

  const [username, password, fullName = '管理员', email = ''] = args;

  try {
    console.log('\n🔐 创建管理员账号...');
    console.log('=====================================');
    console.log(`账号: ${username}`);
    console.log(`姓名: ${fullName}`);
    console.log(`邮箱: ${email || '(未设置)'}`);
    console.log('=====================================\n');

    // 生成密码哈希
    const passwordHash = await hash(password, 10);

    // 插入管理员记录
    const result = await db.query(
      `INSERT INTO admin_users (username, password_hash, full_name, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) 
       DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email,
         updated_at = NOW()
       RETURNING id, username, full_name, email, created_at`,
      [username, passwordHash, fullName, email || null]
    );

    const admin = result.rows[0];
    
    console.log('✅ 管理员账号创建/更新成功！');
    console.log('\n账号信息:');
    console.log(`  ID: ${admin.id}`);
    console.log(`  账号: ${admin.username}`);
    console.log(`  姓名: ${admin.full_name}`);
    console.log(`  邮箱: ${admin.email || '(未设置)'}`);
    console.log(`  创建时间: ${admin.created_at}`);
    console.log('\n⚠️  请妥善保管密码，建议首次登录后立即修改！\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ 创建管理员账号失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();

