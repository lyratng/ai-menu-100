#!/usr/bin/env node

/**
 * 环境变量配置检查脚本
 * 用途：检查.env文件中的配置是否完整和正确
 * 使用：node check-env.js
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 必需的环境变量
const REQUIRED_VARS = {
  DATABASE_URL: {
    description: '数据库连接字符串',
    pattern: /^postgres:\/\/[\w]+:[\w]+@[\w\-\.]+:\d+\/[\w]+$/,
    example: 'postgres://user:password@host:5432/database',
  },
  REDIS_URL: {
    description: 'Redis连接字符串',
    pattern: /^redis:\/\/.+/,
    example: 'redis://localhost:6379',
  },
  QUEUE_REDIS_URL: {
    description: '队列Redis连接字符串',
    pattern: /^redis:\/\/.+/,
    example: 'redis://localhost:6379',
  },
  OSS_REGION: {
    description: '阿里云OSS区域',
    pattern: /^oss-cn-[\w]+$/,
    example: 'oss-cn-beijing',
  },
  OSS_BUCKET: {
    description: '阿里云OSS Bucket名称',
    pattern: /^[\w\-]+$/,
    example: 'ai-menu-prod',
  },
  OSS_ACCESS_KEY_ID: {
    description: '阿里云AccessKeyId',
    pattern: /^LTAI[\w]+$/,
    example: 'LTAI5txxxxxxxxxxxx',
  },
  OSS_ACCESS_KEY_SECRET: {
    description: '阿里云AccessKeySecret',
    pattern: /^[\w]{30,}$/,
    example: 'xxxxxxxxxxxxxxxxxxxxxx',
  },
  OSS_ENDPOINT: {
    description: '阿里云OSS Endpoint',
    pattern: /^https?:\/\/oss-cn-[\w\-\.]+$/,
    example: 'https://oss-cn-beijing.aliyuncs.com',
  },
  DEEPSEEK_API_KEY: {
    description: 'DeepSeek API Key',
    pattern: /^sk-[\w]{20,}$/,
    example: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  DEEPSEEK_BASE_URL: {
    description: 'DeepSeek API Base URL',
    pattern: /^https?:\/\/.+/,
    example: 'https://api.deepseek.com/v1',
  },
  JWT_SECRET: {
    description: 'JWT密钥',
    pattern: /^.{32,}$/,
    example: '至少32位的随机字符串',
    warning: '生产环境必须使用随机值！',
  },
  JWT_EXPIRES_IN: {
    description: 'JWT过期时间',
    pattern: /^\d+[dhms]$/,
    example: '7d',
  },
  PORT: {
    description: '服务器端口',
    pattern: /^\d+$/,
    example: '8080',
  },
  NODE_ENV: {
    description: '运行环境',
    pattern: /^(development|production|test)$/,
    example: 'production',
  },
  CORS_ORIGIN: {
    description: '允许的CORS源',
    pattern: /^https?:\/\/.+/,
    example: 'https://app.ai-menu.tech,https://admin.ai-menu.tech',
  },
};

// 可选的环境变量
const OPTIONAL_VARS = [
  'HOST',
  'LOG_LEVEL',
  'EMBEDDING_MODEL',
  'LLM_MODEL',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'ALIYUN_SLS_PROJECT',
  'ALIYUN_SLS_LOGSTORE',
  'ALIYUN_SLS_ENDPOINT',
];

// 危险的默认值（生产环境不应使用）
const DANGEROUS_DEFAULTS = {
  JWT_SECRET: [
    'your_jwt_secret_min_32_chars_random_string',
    'your_jwt_secret_min_32_chars_random_string_here',
    'your-secret-key-change-in-production',
    '请替换为32位以上随机字符串',
    'change-this-secret-key-in-production',
  ],
  DATABASE_URL: [
    'postgres://user:password@localhost:5432/ai_menu',
  ],
};

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('❌ 错误: .env 文件不存在！', 'red');
    log('', 'reset');
    log('请先创建 .env 文件:', 'yellow');
    log('  cp .env.production.example .env', 'cyan');
    log('  vim .env', 'cyan');
    log('', 'reset');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        env[key.trim()] = value;
      }
    }
  });

  return env;
}

function checkEnv() {
  log('', 'reset');
  log('================================', 'cyan');
  log('环境变量配置检查', 'cyan');
  log('================================', 'cyan');
  log('', 'reset');

  const env = loadEnv();
  let hasError = false;
  let hasWarning = false;

  // 检查必需变量
  log('检查必需的环境变量:', 'blue');
  log('', 'reset');

  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    const value = env[key];

    if (!value) {
      log(`❌ ${key}: 缺失`, 'red');
      log(`   说明: ${config.description}`, 'reset');
      log(`   示例: ${config.example}`, 'yellow');
      log('', 'reset');
      hasError = true;
      return;
    }

    if (!config.pattern.test(value)) {
      log(`❌ ${key}: 格式错误`, 'red');
      log(`   当前值: ${value}`, 'reset');
      log(`   示例: ${config.example}`, 'yellow');
      log('', 'reset');
      hasError = true;
      return;
    }

    // 检查危险默认值
    if (DANGEROUS_DEFAULTS[key] && DANGEROUS_DEFAULTS[key].includes(value)) {
      log(`⚠️  ${key}: 使用了默认值（不安全）`, 'yellow');
      log(`   说明: ${config.warning || '生产环境请修改为实际值'}`, 'yellow');
      log('', 'reset');
      hasWarning = true;
      return;
    }

    log(`✓ ${key}: OK`, 'green');
  });

  log('', 'reset');

  // 检查可选变量
  log('检查可选的环境变量:', 'blue');
  log('', 'reset');

  OPTIONAL_VARS.forEach(key => {
    const value = env[key];
    if (value) {
      log(`✓ ${key}: ${value}`, 'green');
    } else {
      log(`- ${key}: 未设置（可选）`, 'reset');
    }
  });

  log('', 'reset');

  // 生产环境特殊检查
  if (env.NODE_ENV === 'production') {
    log('生产环境安全检查:', 'blue');
    log('', 'reset');

    // JWT_SECRET长度检查
    if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
      log('⚠️  JWT_SECRET长度不足32位', 'yellow');
      hasWarning = true;
    }

    // 数据库是否使用localhost
    if (env.DATABASE_URL && env.DATABASE_URL.includes('localhost')) {
      log('⚠️  DATABASE_URL使用了localhost（生产环境应使用远程数据库）', 'yellow');
      hasWarning = true;
    }

    // CORS检查
    if (env.CORS_ORIGIN && !env.CORS_ORIGIN.startsWith('https://')) {
      log('⚠️  CORS_ORIGIN应使用HTTPS', 'yellow');
      hasWarning = true;
    }

    log('', 'reset');
  }

  // 总结
  log('================================', 'cyan');
  if (hasError) {
    log('检查结果: 失败 ❌', 'red');
    log('', 'reset');
    log('请修复上述错误后重试', 'red');
    process.exit(1);
  } else if (hasWarning) {
    log('检查结果: 通过（有警告）⚠️', 'yellow');
    log('', 'reset');
    log('建议修复警告项以提高安全性', 'yellow');
    process.exit(0);
  } else {
    log('检查结果: 完全通过 ✅', 'green');
    log('', 'reset');
    log('配置正确，可以启动服务！', 'green');
    process.exit(0);
  }
}

// 生成随机JWT_SECRET
function generateJWTSecret() {
  const crypto = require('crypto');
  const secret = crypto.randomBytes(32).toString('hex');
  log('', 'reset');
  log('生成的JWT_SECRET（请复制到.env文件）:', 'green');
  log('', 'reset');
  log(secret, 'cyan');
  log('', 'reset');
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--generate-jwt')) {
  generateJWTSecret();
} else if (args.includes('--help') || args.includes('-h')) {
  log('', 'reset');
  log('环境变量配置检查脚本', 'cyan');
  log('', 'reset');
  log('用法:', 'yellow');
  log('  node check-env.js              检查环境变量配置', 'reset');
  log('  node check-env.js --generate-jwt   生成随机JWT_SECRET', 'reset');
  log('  node check-env.js --help           显示帮助', 'reset');
  log('', 'reset');
} else {
  checkEnv();
}

