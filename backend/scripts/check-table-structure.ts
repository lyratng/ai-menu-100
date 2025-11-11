import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTableStructure() {
  try {
    // 查询stores表结构
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'stores'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 stores表结构:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    console.log('\n');

    // 查询一条stores记录示例
    const sampleResult = await pool.query('SELECT * FROM stores LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('📄 示例记录:');
      console.log(sampleResult.rows[0]);
    } else {
      console.log('⚠️  stores表为空');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

checkTableStructure();



