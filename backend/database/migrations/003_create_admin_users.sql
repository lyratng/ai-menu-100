-- 创建管理员用户表
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- 插入默认管理员账号（密码：admin123）
-- 注意：生产环境中需要立即修改此默认密码
INSERT INTO admin_users (username, password_hash, full_name, email)
VALUES (
  'admin',
  '$2b$10$YourHashedPasswordHere', -- 这里需要使用bcrypt哈希后的密码
  '系统管理员',
  'admin@ai-menu.tech'
) ON CONFLICT (username) DO NOTHING;

COMMENT ON TABLE admin_users IS '管理员用户表';
COMMENT ON COLUMN admin_users.id IS '管理员ID';
COMMENT ON COLUMN admin_users.username IS '管理员账号';
COMMENT ON COLUMN admin_users.password_hash IS '密码哈希';
COMMENT ON COLUMN admin_users.full_name IS '管理员姓名';
COMMENT ON COLUMN admin_users.email IS '邮箱';
COMMENT ON COLUMN admin_users.is_active IS '是否激活';
COMMENT ON COLUMN admin_users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN admin_users.created_at IS '创建时间';
COMMENT ON COLUMN admin_users.updated_at IS '更新时间';



