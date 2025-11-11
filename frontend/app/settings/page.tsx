'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Save, Lock, Settings as SettingsIcon } from 'lucide-react';
import ParseStatusBar from '@/components/ParseStatusBar';

interface DefaultConfig {
  breakfast: {
    cold: number;
    pickles: number;
    western: number;
    soup: number;
    staple: number;
    egg: number;
  };
  lunch: {
    cold: number;
    hot: number;
    soup: number;
    western: number;
    staple: number;
    special: number;
  };
  dinner: {
    cold: number;
    hot: number;
    soup: number;
    western: number;
    staple: number;
    special: number;
  };
  supper: {
    cold: number;
    hot: number;
    soup: number;
    staple: number;
    special: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 折叠状态
  const [expandedSections, setExpandedSections] = useState({
    breakfast: false,
    lunch: true,
    dinner: false,
    supper: false,
  });
  
  // 默认配置（使用与注册页面一致的字段名）
  const [defaultConfig, setDefaultConfig] = useState<DefaultConfig>({
    breakfast: { cold: 5, pickles: 5, western: 3, soup: 5, staple: 15, egg: 2 },
    lunch: { cold: 4, hot: 18, soup: 4, western: 3, staple: 7, special: 6 },
    dinner: { cold: 4, hot: 18, soup: 4, western: 2, staple: 6, special: 7 },
    supper: { cold: 4, hot: 3, soup: 3, staple: 6, special: 2 },
  });
  
  // 密码修改
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // 获取用户信息和默认配置
    fetch('http://localhost:8080/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          console.log('📥 API返回的配置:', data.user.default_config);
          
          // 如果有保存的默认配置，转换字段名并设置
          if (data.user.default_config) {
            const config = data.user.default_config;
            
            // 转换API的字段名到设置页面使用的字段名
            setDefaultConfig({
              breakfast: {
                cold: config.breakfast?.coldDish || config.breakfast?.cold || 5,
                pickles: config.breakfast?.pickle || config.breakfast?.pickles || 5,
                western: config.breakfast?.westernDessert || config.breakfast?.western || 3,
                soup: config.breakfast?.soupPorridge || config.breakfast?.soup || 5,
                staple: config.breakfast?.specialStaple || config.breakfast?.staple || 15,
                egg: config.breakfast?.egg || 2,
              },
              lunch: {
                cold: config.lunch?.coldDish || config.lunch?.cold || 4,
                hot: config.lunch?.hotDish || config.lunch?.hot || 18,
                soup: config.lunch?.soupPorridge || config.lunch?.soup || 4,
                western: config.lunch?.westernDessert || config.lunch?.western || 3,
                staple: config.lunch?.specialStaple || config.lunch?.staple || 7,
                special: config.lunch?.specialFood || config.lunch?.special || 6,
              },
              dinner: {
                cold: config.dinner?.coldDish || config.dinner?.cold || 4,
                hot: config.dinner?.hotDish || config.dinner?.hot || 18,
                soup: config.dinner?.soupPorridge || config.dinner?.soup || 4,
                western: config.dinner?.westernDessert || config.dinner?.western || 2,
                staple: config.dinner?.specialStaple || config.dinner?.staple || 6,
                special: config.dinner?.specialFood || config.dinner?.special || 7,
              },
              supper: {
                cold: config.lateNight?.coldDish || config.supper?.cold || 4,
                hot: config.lateNight?.hotDish || config.supper?.hot || 3,
                soup: config.lateNight?.soupPorridge || config.supper?.soup || 3,
                staple: config.lateNight?.specialStaple || config.supper?.staple || 6,
                special: config.lateNight?.specialFood || config.supper?.special || 2,
              },
            });
            
            console.log('✅ 配置已转换并设置');
          }
        }
      })
      .catch(err => {
        console.error('获取用户信息失败:', err);
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleConfigChange = (meal: keyof DefaultConfig, field: string, value: number) => {
    setDefaultConfig(prev => ({
      ...prev,
      [meal]: {
        ...(prev[meal] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      // 转换字段名以匹配注册页面的格式
      const normalizedConfig = {
        breakfast: {
          coldDish: defaultConfig.breakfast.cold,
          pickle: defaultConfig.breakfast.pickles,
          westernDessert: defaultConfig.breakfast.western,
          soupPorridge: defaultConfig.breakfast.soup,
          specialStaple: defaultConfig.breakfast.staple,
          egg: defaultConfig.breakfast.egg,
        },
        lunch: {
          coldDish: defaultConfig.lunch.cold,
          hotDish: defaultConfig.lunch.hot,
          soupPorridge: defaultConfig.lunch.soup,
          westernDessert: defaultConfig.lunch.western,
          specialStaple: defaultConfig.lunch.staple,
          specialFood: defaultConfig.lunch.special,
        },
        dinner: {
          coldDish: defaultConfig.dinner.cold,
          hotDish: defaultConfig.dinner.hot,
          soupPorridge: defaultConfig.dinner.soup,
          westernDessert: defaultConfig.dinner.western,
          specialStaple: defaultConfig.dinner.staple,
          specialFood: defaultConfig.dinner.special,
        },
        lateNight: {
          coldDish: defaultConfig.supper.cold,
          hotDish: defaultConfig.supper.hot,
          soupPorridge: defaultConfig.supper.soup,
          specialStaple: defaultConfig.supper.staple,
          specialFood: defaultConfig.supper.special,
        },
      };
      
      console.log('📤 保存配置:', normalizedConfig);
      
      const response = await fetch('http://localhost:8080/api/user/update-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ default_config: normalizedConfig }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        
        // 更新localStorage中的用户配置
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.defaultConfig = normalizedConfig;
            localStorage.setItem('user', JSON.stringify(user));
            console.log('✅ localStorage已更新');
          } catch (error) {
            console.error('更新localStorage失败:', error);
          }
        }
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        alert('密码修改成功，请重新登录');
        handleLogout();
      } else {
        const data = await response.json();
        alert(data.error || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      alert('修改密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderMealSection = (
    title: string,
    meal: keyof DefaultConfig,
    fields: { key: string; label: string }[]
  ) => {
    const isExpanded = expandedSections[meal];
    const config = defaultConfig[meal] || {};

    return (
      <Card key={meal} className="mb-4">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection(meal)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-light">{title}</CardTitle>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
            {fields.map(field => (
              <div key={field.key} className="flex items-center justify-between">
                <Label className="font-light">{field.label}</Label>
                <Input
                  type="number"
                  min="0"
                  value={(config as any)[field.key] || 0}
                  onChange={(e) =>
                    handleConfigChange(meal, field.key, parseInt(e.target.value) || 0)
                  }
                  className="w-24 text-right"
                />
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F0]">
        <p className="text-lg text-[#666] font-light">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <ParseStatusBar />
      
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8E3]">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div 
            className="cursor-pointer"
            onClick={() => router.push('/')}
          >
            <h1 className="text-3xl font-light text-[#2C2C2C] tracking-wider">炊语</h1>
            <p className="text-sm text-[#999] mt-1 font-light tracking-wide">用户设置</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="font-light"
            >
              返回主页
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="font-light"
            >
              退出登录
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* 用户信息 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              用户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-light">账号：</span>
              <span className="font-light">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-light">门店：</span>
              <span className="font-light">{user.store_name || '未设置'}</span>
            </div>
          </CardContent>
        </Card>

        {/* 默认菜品数量配置 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light text-[#2C2C2C]">默认菜品数量配置</h2>
            <Button
              onClick={handleSaveConfig}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : saveSuccess ? '保存成功！' : '保存配置'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-6 font-light">
            修改后将影响您后续生成菜单时的默认数量
          </p>

          {renderMealSection('早餐', 'breakfast', [
            { key: 'cold', label: '凉菜' },
            { key: 'pickles', label: '咸菜' },
            { key: 'western', label: '西餐糕点' },
            { key: 'soup', label: '汤粥类' },
            { key: 'staple', label: '花色主食' },
            { key: 'egg', label: '蛋类' },
          ])}

          {renderMealSection('午餐', 'lunch', [
            { key: 'cold', label: '凉菜' },
            { key: 'hot', label: '热菜' },
            { key: 'soup', label: '汤粥' },
            { key: 'western', label: '西餐糕点' },
            { key: 'staple', label: '花色主食' },
            { key: 'special', label: '特色风味食品' },
          ])}

          {renderMealSection('晚餐', 'dinner', [
            { key: 'cold', label: '凉菜' },
            { key: 'hot', label: '热菜' },
            { key: 'soup', label: '汤粥' },
            { key: 'western', label: '西餐糕点' },
            { key: 'staple', label: '花色主食' },
            { key: 'special', label: '特色风味食品' },
          ])}

          {renderMealSection('夜宵', 'supper', [
            { key: 'cold', label: '凉菜' },
            { key: 'hot', label: '热菜' },
            { key: 'soup', label: '汤粥' },
            { key: 'staple', label: '花色主食' },
            { key: 'special', label: '特色风味食品' },
          ])}
        </div>

        {/* 修改密码 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              修改密码
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-light">当前密码</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label className="font-light">新密码</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label className="font-light">确认新密码</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="w-full"
            >
              {loading ? '修改中...' : '修改密码'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

