'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_URL } from '@/lib/config';

interface MealConfig {
  [key: string]: number;
}

interface AllMealConfig {
  breakfast: MealConfig;
  lunch: MealConfig;
  dinner: MealConfig;
  lateNight: MealConfig;
}

export default function RegisterConfigPage() {
  const router = useRouter();
  
  // 默认配置（按PRD）
  const [config, setConfig] = useState<AllMealConfig>({
    breakfast: {
      coldDish: 5,
      pickle: 5,
      westernDessert: 3,
      soupPorridge: 5,
      specialStaple: 15,
      egg: 2,
    },
    lunch: {
      coldDish: 4,
      hotDish: 18,
      soupPorridge: 4,
      westernDessert: 3,
      specialStaple: 7,
      specialFood: 6,
    },
    dinner: {
      coldDish: 4,
      hotDish: 18,
      soupPorridge: 4,
      westernDessert: 2,
      specialStaple: 6,
      specialFood: 7,
    },
    lateNight: {
      coldDish: 4,
      hotDish: 3,
      soupPorridge: 3,
      specialStaple: 6,
      specialFood: 2,
    },
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    breakfast: false,
    lunch: true, // 午餐默认展开
    dinner: false,
    lateNight: false,
  });

  useEffect(() => {
    // 检查是否有临时注册信息
    const token = sessionStorage.getItem('registerToken');
    const user = sessionStorage.getItem('registerUser');
    if (!token || !user) {
      alert('请先完成注册步骤');
      router.push('/register');
    }
  }, [router]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateConfig = (meal: keyof AllMealConfig, field: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: Math.max(0, value), // 确保不为负数
      },
    }));
  };

  const handleSave = async () => {
    try {
      // 转换为标准字段名格式
      const normalizedConfig = {
        breakfast: {
          coldDish: config.breakfast.coldDish,
          pickle: config.breakfast.pickle,
          westernDessert: config.breakfast.westernDessert,
          soupPorridge: config.breakfast.soupPorridge,
          specialStaple: config.breakfast.specialStaple,
          egg: config.breakfast.egg,
        },
        lunch: {
          coldDish: config.lunch.coldDish,
          hotDish: config.lunch.hotDish,
          soupPorridge: config.lunch.soupPorridge,
          westernDessert: config.lunch.westernDessert,
          specialStaple: config.lunch.specialStaple,
          specialFood: config.lunch.specialFood,
        },
        dinner: {
          coldDish: config.dinner.coldDish,
          hotDish: config.dinner.hotDish,
          soupPorridge: config.dinner.soupPorridge,
          westernDessert: config.dinner.westernDessert,
          specialStaple: config.dinner.specialStaple,
          specialFood: config.dinner.specialFood,
        },
        lateNight: {
          coldDish: config.lateNight.coldDish,
          hotDish: config.lateNight.hotDish,
          soupPorridge: config.lateNight.soupPorridge,
          specialStaple: config.lateNight.specialStaple,
          specialFood: config.lateNight.specialFood,
        },
      };
      
      // 保存配置到sessionStorage
      sessionStorage.setItem('registerConfig', JSON.stringify(normalizedConfig));
      console.log('✅ 配置已保存到sessionStorage:', normalizedConfig);
      
      // 调用API更新数据库中的配置
      const token = sessionStorage.getItem('registerToken');
      if (token) {
        console.log('📤 调用API更新配置到数据库');
        const response = await fetch(`${API_URL}/api/user/update-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ default_config: normalizedConfig }),
        });

        if (response.ok) {
          console.log('✅ 配置已更新到数据库');
        } else {
          console.warn('⚠️ 配置更新到数据库失败，但继续流程');
        }
      }
      
      // 跳转到上传页面
      router.push('/register/upload');
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败，请重试');
    }
  };

  const mealLabels = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    lateNight: '夜宵',
  };

  const fieldLabels: Record<string, string> = {
    coldDish: '凉菜',
    pickle: '咸菜',
    westernDessert: '西餐糕点',
    soupPorridge: '汤粥类（含特色风味）',
    specialStaple: '花色（特色）主食',
    egg: '蛋类',
    hotDish: '热菜',
    specialFood: '特色风味食品',
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border border-[#E8E8E3] shadow-lg bg-white">
        <CardHeader className="text-center pb-8 pt-10">
          <CardTitle className="text-2xl font-light text-[#2C2C2C] tracking-wide">
            配置菜品数量
          </CardTitle>
          <CardDescription className="text-sm font-light text-[#999] tracking-wide mt-2">
            请为您的食堂配置每日菜品默认数量
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-10 space-y-4">
          {(Object.keys(config) as Array<keyof AllMealConfig>).map((meal) => (
            <div key={meal} className="border border-[#E8E8E3] rounded-lg overflow-hidden">
              {/* 可折叠标题 */}
              <button
                onClick={() => toggleSection(meal)}
                className="w-full px-6 py-4 bg-[#F5F5F0] hover:bg-[#E8E8E3] flex items-center justify-between transition-all duration-300"
              >
                <span className="font-light text-lg text-[#2C2C2C] tracking-wide">
                  {mealLabels[meal]}
                </span>
                <span className="text-[#999] text-sm font-light">
                  {expandedSections[meal] ? '▼' : '▶'}
                </span>
              </button>

              {/* 可折叠内容 */}
              {expandedSections[meal] && (
                <div className="p-6 space-y-4 bg-white">
                  {Object.entries(config[meal]).map(([field, value]) => (
                    <div key={field} className="flex items-center justify-between gap-6">
                      <Label className="flex-1 text-sm font-light text-[#2C2C2C] tracking-wide">
                        {fieldLabels[field] || field}
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateConfig(meal, field, value - 1)}
                          className="h-9 w-9 p-0 border-[#E8E8E3] hover:bg-[#F5F5F0] font-light"
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => updateConfig(meal, field, parseInt(e.target.value) || 0)}
                          className="w-20 text-center h-9 border-[#E8E8E3] font-light"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateConfig(meal, field, value + 1)}
                          className="h-9 w-9 p-0 border-[#E8E8E3] hover:bg-[#F5F5F0] font-light"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 保存按钮 */}
          <div className="pt-6">
            <Button
              onClick={handleSave}
              className="w-full h-12 text-base font-light tracking-wide bg-[#E8E8E3] text-[#999] hover:bg-[#2C2C2C] hover:text-white transition-all duration-300"
            >
              保存并继续
            </Button>
          </div>

          {/* 提示 */}
          <p className="text-center text-xs font-light text-[#999] tracking-wide pt-2">
            这些配置将作为生成菜单的默认值，后续可在主页中调整
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
