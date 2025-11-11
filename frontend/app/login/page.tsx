'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { login } from '@/lib/api';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔑 开始登录...', { username: data.username });
      
      const response = await login(data.username, data.password);
      
      console.log('✅ 登录响应:', response);
      
      if (!response) {
        console.error('❌ 响应为空');
        setError('登录失败：服务器未返回数据');
        return;
      }
      
      const actualData = response.data || response;
      console.log('📦 实际数据:', actualData);
      
      if (!actualData.token || !actualData.user) {
        console.error('❌ 缺少token或user:', actualData);
        setError('登录失败：返回数据格式错误');
        return;
      }
      
      console.log('💾 保存token:', actualData.token.substring(0, 20) + '...');
      console.log('💾 保存用户:', actualData.user);
      console.log('💾 保存门店:', actualData.store);
      console.log('🔍 门店的defaultConfig:', actualData.store?.defaultConfig);
      
      localStorage.setItem('token', actualData.token);
      
      // 合并user和store的defaultConfig
      const userWithConfig = {
        ...actualData.user,
        defaultConfig: actualData.store?.defaultConfig,
        store_name: actualData.store?.name,
      };
      console.log('🔍 合并后的用户对象:', userWithConfig);
      localStorage.setItem('user', JSON.stringify(userWithConfig));
      
      console.log('✅ 数据已保存到localStorage（包含defaultConfig）');
      console.log('🔍 验证localStorage.user:', JSON.parse(localStorage.getItem('user') || '{}'));
      
      // 跳转到主页
      console.log('🚀 跳转到主页...');
      router.push('/');
    } catch (err: any) {
      console.error('❌ 登录错误:', err);
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-4">
      <div className="w-full max-w-md">
        {/* Logo 区域 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-[#2C2C2C] tracking-[0.1em] mb-3">
            炊语
          </h1>
          <p className="text-base font-light text-[#666] tracking-wide">
            智能菜单生成系统
          </p>
        </div>

        {/* 登录卡片 */}
        <Card className="border border-[#E8E8E3] shadow-lg bg-white">
          <CardHeader className="text-center space-y-2 pb-8 pt-10">
            <CardTitle className="text-2xl font-light text-[#2C2C2C] tracking-wide">
              登录
            </CardTitle>
            <CardDescription className="text-sm font-light text-[#999] tracking-wide">
              欢迎回来，请登录您的账户
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label 
                  htmlFor="username" 
                  className="text-sm font-light text-[#2C2C2C] tracking-wide block"
                >
                  账号
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  {...register('username')}
                  disabled={loading}
                  className="h-12 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
                {errors.username && (
                  <p className="text-xs text-red-500 font-light mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="text-sm font-light text-[#2C2C2C] tracking-wide block"
                >
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  {...register('password')}
                  disabled={loading}
                  className="h-12 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-light mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* 忘记密码 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-light text-[#999] hover:text-[#2C2C2C] transition-colors tracking-wide"
                >
                  忘记密码？
                </button>
              </div>

              {error && (
                <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              {showForgotPassword && (
                <div className="p-4 text-sm font-light text-[#666] bg-[#F5F5F0] border border-[#E8E8E3] rounded-lg">
                  请联系管理员重置账户
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-light tracking-wide bg-[#E8E8E3] text-[#999] hover:bg-[#2C2C2C] hover:text-white transition-all duration-300"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            {/* 注册链接 */}
            <div className="mt-8 text-center">
              <p className="text-sm font-light text-[#999] tracking-wide">
                还没有账户？{' '}
                <Link 
                  href="/register" 
                  className="text-[#2C2C2C] hover:underline font-light"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
