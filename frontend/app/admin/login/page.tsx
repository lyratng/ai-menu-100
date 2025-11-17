'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { API_URL } from '@/lib/config';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 版本标识 - v2024.11.17 - 修复登录API路径
  console.log('🔧 Admin Login Page v2024.11.17 - Using /api/admin/login');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🎯 提交登录请求到:', `${API_URL}/api/admin/login`);
    console.log('🔑 用户名:', username);

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      console.log('📡 响应状态:', response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }

      // 存储管理员token和用户信息
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));

      // 跳转到Dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查账号密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F5F0',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '400',
            color: '#2C2C2C',
            letterSpacing: '1.5px',
            marginBottom: '12px'
          }}>
            炊语管理后台
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            fontWeight: '400',
            letterSpacing: '0.5px'
          }}>
            Admin Management System
          </p>
        </div>

        {/* 登录卡片 */}
        <Card style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E3',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '24px', fontWeight: '500', color: '#2C2C2C' }}>
              管理员登录
            </CardTitle>
            <CardDescription style={{ fontSize: '14px', color: '#666' }}>
              请输入管理员账号和密码
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <Label htmlFor="username" style={{ 
                  fontSize: '16px', 
                  color: '#2C2C2C',
                  fontWeight: '400',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  管理员账号
                </Label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入管理员账号"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #E8E8E3',
                    borderRadius: '8px',
                    background: '#FAFAFA',
                    color: '#2C2C2C',
                    transition: 'all 0.2s ease',
                    fontWeight: '400'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2C2C2C';
                    e.target.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8E8E3';
                    e.target.style.background = '#FAFAFA';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <Label htmlFor="password" style={{ 
                  fontSize: '16px', 
                  color: '#2C2C2C',
                  fontWeight: '400',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  密码
                </Label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #E8E8E3',
                    borderRadius: '8px',
                    background: '#FAFAFA',
                    color: '#2C2C2C',
                    transition: 'all 0.2s ease',
                    fontWeight: '400'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2C2C2C';
                    e.target.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8E8E3';
                    e.target.style.background = '#FAFAFA';
                  }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  marginBottom: '24px',
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '8px',
                  color: '#EF4444',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '48px',
                  background: '#2C2C2C',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: '400',
                  letterSpacing: '0.5px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#1a1a1a';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(44, 44, 44, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2C2C2C';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isLoading ? '登录中...' : '登录'}
              </Button>
              
              {/* 临时快捷登录按钮 - 绕过缓存问题 */}
              <Button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('https://api.ai-menu.tech/api/admin/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username, password }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                      localStorage.setItem('admin_token', data.token);
                      localStorage.setItem('admin_user', JSON.stringify(data.user));
                      router.push('/admin/dashboard');
                    } else {
                      setError(data.message || '登录失败');
                    }
                  } catch (err: any) {
                    setError(err.message || '登录失败');
                  }
                }}
                style={{
                  width: '100%',
                  height: '48px',
                  marginTop: '12px',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: '400',
                  letterSpacing: '0.5px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10B981';
                }}
              >
                🚀 快捷登录（临时）
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 提示信息 */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#999'
        }}>
          <p>忘记密码？请联系系统管理员重置</p>
        </div>
      </div>
    </div>
  );
}



