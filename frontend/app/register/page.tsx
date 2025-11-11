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
import { register as registerUser } from '@/lib/api';

const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符'),
  confirmPassword: z.string().min(6, '请再次输入密码'),
  storeName: z.string().min(1, '请输入食堂名称'),
  contactPerson: z.string().min(1, '请输入联系人姓名'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await registerUser({
        username: data.username,
        password: data.password,
        confirm_password: data.confirmPassword,
        storeName: data.storeName,
        contact_person: data.contactPerson,
        contact_phone: data.contactPhone,
        address: data.address,
        defaultConfig: {
          lunch: {
            hot_dish: 18,
            cold_dish: 4,
          },
        },
      });
      
      // 注册成功，保存token和用户信息到sessionStorage（临时）
      if (response.data?.token && response.data?.user) {
        console.log('✅ 注册成功，临时保存token和用户信息');
        sessionStorage.setItem('registerToken', response.data.token);
        sessionStorage.setItem('registerUser', JSON.stringify(response.data.user));
        
        // 跳转到配置页面
        console.log('🔄 跳转到配置页面');
        router.push('/register/config');
      } else {
        // 如果没有返回token，跳转到登录页
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请重试');
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
            万千菜肴，由 AI 帮你挑选搭配
          </p>
        </div>

        {/* 注册卡片 */}
        <Card className="border border-[#E8E8E3] shadow-lg bg-white">
          <CardHeader className="text-center space-y-2 pb-8 pt-10">
            <CardTitle className="text-2xl font-light text-[#2C2C2C] tracking-wide">
              注册
            </CardTitle>
            <CardDescription className="text-sm font-light text-[#999] tracking-wide">
              创建您的账户，开始智能菜单管理
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  placeholder="请输入用户名（3-50字符）"
                  {...register('username')}
                  disabled={loading}
                  className="h-11 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
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
                  placeholder="请输入密码（至少6个字符）"
                  {...register('password')}
                  disabled={loading}
                  className="h-11 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-light mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="confirmPassword" 
                  className="text-sm font-light text-[#2C2C2C] tracking-wide block"
                >
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  {...register('confirmPassword')}
                  disabled={loading}
                  className="h-11 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-light mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="storeName" 
                  className="text-sm font-light text-[#2C2C2C] tracking-wide block"
                >
                  食堂名称
                </label>
                <Input
                  id="storeName"
                  type="text"
                  placeholder="请输入食堂名称"
                  {...register('storeName')}
                  disabled={loading}
                  className="h-11 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
                {errors.storeName && (
                  <p className="text-xs text-red-500 font-light mt-1">
                    {errors.storeName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="contactPerson" 
                  className="text-sm font-light text-[#2C2C2C] tracking-wide block"
                >
                  联系人
                </label>
                <Input
                  id="contactPerson"
                  type="text"
                  placeholder="请输入联系人姓名"
                  {...register('contactPerson')}
                  disabled={loading}
                  className="h-11 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
                {errors.contactPerson && (
                  <p className="text-xs text-red-500 font-light mt-1">
                    {errors.contactPerson.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="contactPhone" 
                  className="text-sm font-light text-[#2C2C2C] tracking-wide block"
                >
                  联系电话
                </label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="请输入手机号"
                  {...register('contactPhone')}
                  disabled={loading}
                  className="h-11 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
                {errors.contactPhone && (
                  <p className="text-xs text-red-500 font-light mt-1">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="address" 
                  className="text-sm font-light text-[#999] tracking-wide block"
                >
                  地址（选填）
                </label>
                <Input
                  id="address"
                  type="text"
                  placeholder="请输入食堂地址"
                  {...register('address')}
                  disabled={loading}
                  className="h-11 border-[#E8E8E3] font-light focus:border-[#2C2C2C] transition-colors"
                />
              </div>

              {error && (
                <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-light tracking-wide bg-[#E8E8E3] text-[#999] hover:bg-[#2C2C2C] hover:text-white transition-all duration-300 mt-6"
                disabled={loading}
              >
                {loading ? '注册中...' : '下一步'}
              </Button>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 text-center">
              <p className="text-sm font-light text-[#999] tracking-wide">
                已有账户？{' '}
                <Link 
                  href="/login" 
                  className="text-[#2C2C2C] hover:underline font-light"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
