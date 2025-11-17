'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { generateMenu } from '@/lib/api';
import { X } from 'lucide-react';
import ParseStatusBar from '@/components/ParseStatusBar';
import { API_URL } from '@/lib/config';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedMenu, setGeneratedMenu] = useState<any>(null);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [showDishDetail, setShowDishDetail] = useState(false);
  
  // 当前激活的餐次
  const [activeMeal, setActiveMeal] = useState('lunch');
  
  // 当前激活的模式
  const [activeMode, setActiveMode] = useState<'rules' | 'similarity'>('rules');
  
  // 午餐默认配置（从stores.default_config或用户注册时配置）
  const [lunchDefaultHot, setLunchDefaultHot] = useState(18);
  const [lunchDefaultCold, setLunchDefaultCold] = useState(4);
  
  // 午餐生成参数
  const [lunchParams, setLunchParams] = useState({
    // 基础设置
    hot_dish_total_per_day: 18,
    cold_per_day: 4,
    
    // 热菜分布（保证三者之和等于hot_dish_total_per_day）
    main_meat_per_day: 6,    // 默认1/3
    half_meat_per_day: 6,    // 默认1/3
    veggie_hot_per_day: 6,   // 默认1/3
    
    // 人员配置
    staffing_tight: true,    // 默认紧缺
    
    // 历史菜占比
    used_history_ratio: 0.5, // 默认50%
    
    // 可使用的烹饪方式（8种，默认全选）
    cook_method8_available: ['炒', '熘', '蒸', '烧', '烤', '炖', '煎', '烹'],
    
    // 辣味要求
    spicy_level: 'no_spicy' as 'no_spicy' | 'mild' | 'medium', // 默认不辣
    
    // 口味多样性
    flavor_diversity_required: false, // 默认不选
    
    // 原材料多样性
    ingredient_diversity_requirement: '无要求',
    
    // 模型选择
    model: 'deepseek-chat' as 'deepseek-chat' | 'gpt5-chat',
  });

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr || userStr === 'undefined' || userStr === 'null') {
      router.push('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      console.log('🔍 完整的用户数据:', userData);
      console.log('🔍 defaultConfig:', userData.defaultConfig);
      setUser(userData);
      
      // 从localStorage读取最近生成的菜单
      const latestMenuStr = localStorage.getItem('latestGeneratedMenu');
      if (latestMenuStr) {
        try {
          const latestMenu = JSON.parse(latestMenuStr);
          setGeneratedMenu(latestMenu);
          setHasGenerated(true);
          console.log('✅ 已加载最近生成的菜单');
        } catch (err) {
          console.error('❌ 解析最近菜单失败:', err);
          localStorage.removeItem('latestGeneratedMenu');
        }
      }
      
      // 从用户的defaultConfig读取午餐配置
      if (userData.defaultConfig?.lunch) {
        const lunchConfig = userData.defaultConfig.lunch;
        
        // 读取热菜和凉菜数量（优先读取标准字段名hotDish和coldDish）
        const hotDishCount = lunchConfig.hotDish || lunchConfig.hot_dish || lunchConfig.hot || 18;
        const coldDishCount = lunchConfig.coldDish || lunchConfig.cold_dish || lunchConfig.cold || 4;
        
        console.log('📋 从defaultConfig读取午餐配置:', { hotDishCount, coldDishCount });
        
        // 更新状态
        setLunchDefaultHot(hotDishCount);
        setLunchDefaultCold(coldDishCount);
        setLunchParams(prev => ({
          ...prev,
          hot_dish_total_per_day: hotDishCount,
          cold_per_day: coldDishCount,
        }));
      } else {
        console.warn('⚠️ 用户数据中没有defaultConfig.lunch，尝试从API获取');
        // 如果localStorage中没有配置，尝试从API获取
        fetch(`${API_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            console.log('📥 从API获取的用户数据:', data);
            if (data.user?.default_config?.lunch) {
              const lunchConfig = data.user.default_config.lunch;
              const hotDishCount = lunchConfig.hotDish || lunchConfig.hot_dish || lunchConfig.hot || 18;
              const coldDishCount = lunchConfig.coldDish || lunchConfig.cold_dish || lunchConfig.cold || 4;
              
              console.log('✅ 从API获取到配置:', { hotDishCount, coldDishCount });
              
              // 更新localStorage
              const updatedUser = { ...userData, defaultConfig: data.user.default_config };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              // 更新状态
              setLunchDefaultHot(hotDishCount);
              setLunchDefaultCold(coldDishCount);
              setLunchParams(prev => ({
                ...prev,
                hot_dish_total_per_day: hotDishCount,
                cold_per_day: coldDishCount,
              }));
            }
          })
          .catch(err => console.error('❌ 获取用户配置失败:', err));
      }
    } catch (error) {
      console.error('解析用户数据失败:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  // 自动计算热菜分布
  useEffect(() => {
    const total = lunchParams.hot_dish_total_per_day;
    const third = Math.floor(total / 3);
    const remainder = total % 3;
    
    setLunchParams(prev => ({
      ...prev,
      main_meat_per_day: third + (remainder > 0 ? 1 : 0),
      half_meat_per_day: third + (remainder > 1 ? 1 : 0),
      veggie_hot_per_day: third,
    }));
  }, [lunchParams.hot_dish_total_per_day]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      
      const storeId = user?.store_id || user?.storeId;
      if (!storeId) {
        alert('无法获取门店信息，请重新登录');
        return;
      }
      
      // 调用生成菜单API
      const response = await generateMenu({
        store_id: storeId,
        days: 5,
        meal_type: 'lunch',
        hot_dish_total_per_day: lunchParams.hot_dish_total_per_day,
        cold_per_day: lunchParams.cold_per_day,
        main_meat_per_day: lunchParams.main_meat_per_day,
        half_meat_per_day: lunchParams.half_meat_per_day,
        veggie_hot_per_day: lunchParams.veggie_hot_per_day,
        staffing_tight: lunchParams.staffing_tight,
        cook_method8_available: lunchParams.cook_method8_available,
        spicy_level: lunchParams.spicy_level,
        flavor_diversity_required: lunchParams.flavor_diversity_required,
        ingredient_diversity_requirement: lunchParams.ingredient_diversity_requirement,
        used_history_ratio: lunchParams.used_history_ratio,
        model: lunchParams.model,
      });
      
      console.log('🎉 API响应:', response);
      console.log('📋 菜单数据:', response.data);
      
      if (response.success) {
        setHasGenerated(true);
        setGeneratedMenu(response.data);
        
        // 保存到localStorage，以便切换页面后仍能查看
        localStorage.setItem('latestGeneratedMenu', JSON.stringify(response.data));
        console.log('✅ 菜单数据已保存到state和localStorage');
        
        // 自动打开菜单弹窗
        setShowMenuDialog(true);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || '生成失败';
        throw new Error(errorMessage);
      }
      
    } catch (error: any) {
      console.error('生成菜单失败:', error);
      alert(error.message || '生成菜单失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMenu = () => {
    console.log('🔍 查看菜单，当前数据:', generatedMenu);
    if (!generatedMenu) {
      alert('还没有生成过菜单，请先点击"生成菜单"按钮');
      return;
    }
    console.log('✅ 准备打开弹窗，显示最近一次生成的菜单');
    setShowMenuDialog(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <p className="text-lg text-[#666]">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* 解析状态栏 */}
      <ParseStatusBar />
      
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8E3]">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-[#2C2C2C] tracking-wider">炊语</h1>
            <p className="text-sm text-[#999] mt-1 font-light tracking-wide">智能菜单生成系统</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/history')}
              className="font-light"
            >
              历史菜单
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/settings')}
              className="font-light"
            >
              设置
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
      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* 餐次选择（四个书签）*/}
        <Card className="border border-[#E8E8E3] shadow-lg">
          <Tabs value={activeMeal} onValueChange={setActiveMeal} className="w-full">
            {/* 书签标签 */}
            <TabsList className="w-full grid grid-cols-4 h-16 bg-[#F5F5F0] rounded-t-xl border-b border-[#E8E8E3]">
              <TabsTrigger 
                value="breakfast" 
                className="text-lg font-light tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#2C2C2C] data-[state=active]:shadow-sm"
              >
                早餐
              </TabsTrigger>
              <TabsTrigger 
                value="lunch" 
                className="text-lg font-light tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#2C2C2C] data-[state=active]:shadow-sm"
              >
                午餐
              </TabsTrigger>
              <TabsTrigger 
                value="dinner" 
                className="text-lg font-light tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#2C2C2C] data-[state=active]:shadow-sm"
              >
                晚餐
              </TabsTrigger>
              <TabsTrigger 
                value="supper" 
                className="text-lg font-light tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#2C2C2C] data-[state=active]:shadow-sm"
              >
                夜宵
              </TabsTrigger>
            </TabsList>

            {/* 早餐 */}
            <TabsContent value="breakfast" className="p-12">
              <div className="text-center py-16">
                <p className="text-2xl text-[#999] font-light tracking-wide">功能开发中，敬请期待</p>
              </div>
            </TabsContent>

            {/* 午餐 */}
            <TabsContent value="lunch" className="p-8">
              {/* 模式选择 */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex rounded-lg bg-[#F5F5F0] p-1 border border-[#E8E8E3]">
                  <button
                    onClick={() => setActiveMode('rules')}
                    className={`px-6 py-2 rounded-md font-light tracking-wide transition-all ${
                      activeMode === 'rules'
                        ? 'bg-white text-[#2C2C2C] shadow-sm'
                        : 'text-[#999] hover:text-[#666]'
                    }`}
                  >
                    菜品规则判断
                  </button>
                  <button
                    onClick={() => setActiveMode('similarity')}
                    className={`px-6 py-2 rounded-md font-light tracking-wide transition-all ${
                      activeMode === 'similarity'
                        ? 'bg-white text-[#2C2C2C] shadow-sm'
                        : 'text-[#999] hover:text-[#666]'
                    }`}
                  >
                    菜单相似度匹配
                  </button>
                </div>
              </div>

              {/* 菜品规则判断模式 */}
              {activeMode === 'rules' && (
                <div className="space-y-6">
                  {/* 模型选择 */}
                  <div>
                    <Label className="text-base font-light text-[#2C2C2C] tracking-wide">模型选择</Label>
                    <Select
                      value={lunchParams.model}
                      onValueChange={(value: any) => setLunchParams({ ...lunchParams, model: value })}
                    >
                      <SelectTrigger className="mt-2 h-12 border-[#E8E8E3] font-light">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deepseek-chat" className="font-light">DeepSeek-Chat</SelectItem>
                        <SelectItem value="gpt5-chat" className="font-light">GPT5-Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 菜品数量 */}
                  {/* 热菜总数和凉菜数量已移至设置页面配置 */}
                  {/* <div>
                    <Label className="text-base font-light text-[#2C2C2C] tracking-wide">热菜总数（每天）</Label>
                    <Input
                      type="number"
                      min={1}
                      value={lunchParams.hot_dish_total_per_day}
                      onChange={(e) => setLunchParams({ ...lunchParams, hot_dish_total_per_day: parseInt(e.target.value) || 18 })}
                      className="mt-2 h-12 border-[#E8E8E3] font-light"
                    />
                    <p className="text-xs text-[#999] mt-1 font-light">
                      修改后会自动平均分配到主荤、半荤、素菜
                    </p>
                  </div> */}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-base font-light text-[#2C2C2C] tracking-wide">主荤菜数量</Label>
                      <Input
                        type="number"
                        min={0}
                        value={lunchParams.main_meat_per_day}
                        onChange={(e) => setLunchParams({ ...lunchParams, main_meat_per_day: parseInt(e.target.value) || 0 })}
                        className="mt-2 h-12 border-[#E8E8E3] font-light"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-light text-[#2C2C2C] tracking-wide">半荤菜数量</Label>
                      <Input
                        type="number"
                        min={0}
                        value={lunchParams.half_meat_per_day}
                        onChange={(e) => setLunchParams({ ...lunchParams, half_meat_per_day: parseInt(e.target.value) || 0 })}
                        className="mt-2 h-12 border-[#E8E8E3] font-light"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-light text-[#2C2C2C] tracking-wide">素菜数量</Label>
                      <Input
                        type="number"
                        min={0}
                        value={lunchParams.veggie_hot_per_day}
                        onChange={(e) => setLunchParams({ ...lunchParams, veggie_hot_per_day: parseInt(e.target.value) || 0 })}
                        className="mt-2 h-12 border-[#E8E8E3] font-light"
                      />
                    </div>
                  </div>

                  {/* <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-light text-[#2C2C2C] tracking-wide">凉菜数量</Label>
                      <Input
                        type="number"
                        min={0}
                        value={lunchParams.cold_per_day}
                        onChange={(e) => setLunchParams({ ...lunchParams, cold_per_day: parseInt(e.target.value) || 0 })}
                        className="mt-2 h-12 border-[#E8E8E3] font-light"
                      />
                    </div>
                  </div> */}

                  {/* 校验提示 */}
                  {lunchParams.main_meat_per_day + lunchParams.half_meat_per_day + lunchParams.veggie_hot_per_day !== lunchParams.hot_dish_total_per_day && (
                    <p className="text-sm text-red-500 font-light">
                      ⚠️ 主荤+半荤+素菜应等于热菜总数（{lunchParams.hot_dish_total_per_day}道）
                    </p>
                  )}

                  {/* 人员配置 */}
                  <div>
                    <Label className="text-base font-light text-[#2C2C2C] tracking-wide mb-3 block">人员配置</Label>
                    <RadioGroup
                      value={lunchParams.staffing_tight ? 'tight' : 'loose'}
                      onValueChange={(value) => setLunchParams({ ...lunchParams, staffing_tight: value === 'tight' })}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tight" id="tight" />
                        <Label htmlFor="tight" className="font-light text-[#2C2C2C] cursor-pointer">紧缺</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="loose" id="loose" />
                        <Label htmlFor="loose" className="font-light text-[#2C2C2C] cursor-pointer">宽裕</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 历史菜占比 */}
                  <div>
                    <Label className="text-base font-light text-[#2C2C2C] tracking-wide mb-3 block">历史菜占比</Label>
                    <RadioGroup
                      value={lunchParams.used_history_ratio.toString()}
                      onValueChange={(value) => setLunchParams({ ...lunchParams, used_history_ratio: parseFloat(value) })}
                      className="flex gap-4"
                    >
                      {[0, 0.3, 0.5, 0.7, 1].map((ratio) => (
                        <div key={ratio} className="flex items-center space-x-2">
                          <RadioGroupItem value={ratio.toString()} id={`ratio-${ratio}`} />
                          <Label htmlFor={`ratio-${ratio}`} className="font-light text-[#2C2C2C] cursor-pointer">
                            {(ratio * 100).toFixed(0)}%
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* 可使用的烹饪方式 */}
                  <div>
                    <Label className="text-base font-light text-[#2C2C2C] tracking-wide mb-3 block">
                      可以使用的烹饪方式
                    </Label>
                    <div className="grid grid-cols-4 gap-3">
                      {['炒', '熘', '蒸', '烧', '烤', '炖', '煎', '烹'].map((method) => (
                        <label
                          key={method}
                          className="flex items-center space-x-2 p-3 rounded-lg border border-[#E8E8E3] cursor-pointer hover:bg-[#F5F5F0] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={lunchParams.cook_method8_available.includes(method)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLunchParams({
                                  ...lunchParams,
                                  cook_method8_available: [...lunchParams.cook_method8_available, method],
                                });
                              } else {
                                setLunchParams({
                                  ...lunchParams,
                                  cook_method8_available: lunchParams.cook_method8_available.filter((m) => m !== method),
                                });
                              }
                            }}
                            className="rounded border-[#E8E8E3]"
                          />
                          <span className="font-light text-[#2C2C2C]">{method}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-[#999] mt-2 font-light">
                      已选 {lunchParams.cook_method8_available.length}/8 种
                    </p>
                  </div>

                  {/* 辣味要求 */}
                  <div>
                    <Label className="text-base font-light text-[#2C2C2C] tracking-wide mb-3 block">辣味要求</Label>
                    <RadioGroup
                      value={lunchParams.spicy_level}
                      onValueChange={(value: any) => setLunchParams({ ...lunchParams, spicy_level: value })}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no_spicy" id="no_spicy" />
                        <Label htmlFor="no_spicy" className="font-light text-[#2C2C2C] cursor-pointer">不辣</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mild" id="mild" />
                        <Label htmlFor="mild" className="font-light text-[#2C2C2C] cursor-pointer">微辣</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium" className="font-light text-[#2C2C2C] cursor-pointer">中辣</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 口味多样性 */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="flavor_diversity"
                      checked={lunchParams.flavor_diversity_required}
                      onChange={(e) => setLunchParams({ ...lunchParams, flavor_diversity_required: e.target.checked })}
                      className="rounded border-[#E8E8E3]"
                    />
                    <Label htmlFor="flavor_diversity" className="font-light text-[#2C2C2C] cursor-pointer">
                      每餐口味不少于五种
                    </Label>
                  </div>

                  {/* 原材料多样性 */}
                  <div>
                    <Label className="text-base font-light text-[#2C2C2C] tracking-wide">原材料多样性</Label>
                    <Select
                      value={lunchParams.ingredient_diversity_requirement}
                      onValueChange={(value) => setLunchParams({ ...lunchParams, ingredient_diversity_requirement: value })}
                    >
                      <SelectTrigger className="mt-2 h-12 border-[#E8E8E3] font-light">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="无要求" className="font-light">无要求</SelectItem>
                        <SelectItem value="不少于4种" className="font-light">不少于4种</SelectItem>
                        <SelectItem value="不少于5种" className="font-light">不少于5种</SelectItem>
                        <SelectItem value="不少于6种" className="font-light">不少于6种</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 生成按钮区域 */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      onClick={handleGenerate}
                      disabled={
                        loading ||
                        lunchParams.main_meat_per_day + lunchParams.half_meat_per_day + lunchParams.veggie_hot_per_day !== lunchParams.hot_dish_total_per_day
                      }
                      className="flex-1 h-14 text-lg font-light tracking-wide bg-[#E8E8E3] text-[#999] hover:bg-[#2C2C2C] hover:text-white transition-all duration-300"
                    >
                      {loading ? '菜单生成中...' : hasGenerated ? '再次生成' : '生成菜单'}
                    </Button>
                    <Button
                      onClick={handleViewMenu}
                      variant="outline"
                      className="flex-1 h-14 text-lg font-light tracking-wide border-[#E8E8E3] hover:bg-[#F5F5F0]"
                    >
                      查看生成菜单
                    </Button>
                  </div>

                </div>
              )}

              {/* 菜单相似度匹配模式 */}
              {activeMode === 'similarity' && (
                <div className="text-center py-16">
                  <p className="text-2xl text-[#999] font-light tracking-wide">功能开发中，敬请期待</p>
                </div>
              )}
            </TabsContent>

            {/* 晚餐 */}
            <TabsContent value="dinner" className="p-12">
              <div className="text-center py-16">
                <p className="text-2xl text-[#999] font-light tracking-wide">功能开发中，敬请期待</p>
              </div>
            </TabsContent>

            {/* 夜宵 */}
            <TabsContent value="supper" className="p-12">
              <div className="text-center py-16">
                <p className="text-2xl text-[#999] font-light tracking-wide">功能开发中，敬请期待</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      {/* 加载中弹窗 */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {/* 加载卡片内容 */}
            <div 
              className="relative overflow-hidden"
              style={{
                animation: 'breathe 3s ease-in-out infinite',
              }}
            >
              {/* 背景装饰 - 轻微的渐变光晕 */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(44, 44, 44, 0.03) 0%, transparent 70%)',
                }}
              />
              
              {/* 内容区域 */}
              <div className="relative p-12 flex flex-col items-center justify-center gap-6">
                {/* 图标区域 - 带浮动动画 */}
                <div 
                  className="text-6xl"
                  style={{
                    animation: 'float 2s ease-in-out infinite',
                  }}
                >
                  ✨
                </div>
                
                {/* 主文案 */}
                <p className="text-2xl text-[#2C2C2C] font-light tracking-wide text-center">
                  AI 正在为您精心挑选菜品
                </p>
                
                {/* 副文案 */}
                <p className="text-base text-[#666] font-light tracking-wide text-center">
                  预计需要 30-60 秒，请耐心等待
                </p>
                
                {/* 进度指示器 - 三个跳动的点 */}
                <div className="flex gap-2 mt-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-[#2C2C2C]"
                    style={{
                      animation: 'bounce 1.4s ease-in-out infinite',
                      animationDelay: '0s',
                    }}
                  />
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-[#2C2C2C]"
                    style={{
                      animation: 'bounce 1.4s ease-in-out infinite',
                      animationDelay: '0.2s',
                    }}
                  />
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-[#2C2C2C]"
                    style={{
                      animation: 'bounce 1.4s ease-in-out infinite',
                      animationDelay: '0.4s',
                    }}
                  />
                </div>
              </div>

              {/* 内联样式定义动画 */}
              <style jsx>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: scale(0.95);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1);
                  }
                }

                @keyframes breathe {
                  0%, 100% {
                    transform: scale(1);
                  }
                  50% {
                    transform: scale(1.02);
                  }
                }
                
                @keyframes float {
                  0%, 100% {
                    transform: translateY(0px) rotate(0deg);
                  }
                  50% {
                    transform: translateY(-12px) rotate(5deg);
                  }
                }
                
                @keyframes bounce {
                  0%, 80%, 100% {
                    transform: translateY(0);
                    opacity: 0.5;
                  }
                  40% {
                    transform: translateY(-10px);
                    opacity: 1;
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      )}

      {/* 查看生成菜单弹窗 */}
      {showMenuDialog && generatedMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowMenuDialog(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #E8E8E3',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '500', color: '#2C2C2C', letterSpacing: '1px' }}>
                生成的菜单（一周五天）
              </h2>
              <button
                onClick={() => setShowMenuDialog(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '8px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* 菜单内容 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {generatedMenu?.menu_items_json?.days ? (() => {
                // 准备表格数据：横轴周一到周五，纵轴菜品类别
                const days = generatedMenu.menu_items_json.days;
                const dishTypes = ['热菜主荤', '热菜半荤', '热菜素菜', '凉菜'];
                const dayLabels = ['周一', '周二', '周三', '周四', '周五'];
                
                // 组织数据：按类型和天数分组
                const tableData: Record<string, Record<string, any[]>> = {};
                dishTypes.forEach(type => {
                  tableData[type] = {};
                  days.forEach((day: any, index: number) => {
                    const dayLabel = dayLabels[index];
                    tableData[type][dayLabel] = (day.lunch || []).filter((dish: any) => dish.dish_type === type);
                  });
                });

                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      background: '#FFFFFF',
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            padding: '16px',
                            background: '#F5F5F0',
                            border: '1px solid #E8E8E3',
                            fontSize: '16px',
                            fontWeight: '400',
                            color: '#2C2C2C',
                            textAlign: 'center',
                            minWidth: '100px',
                          }}>
                            菜品类别
                          </th>
                          {dayLabels.map(day => (
                            <th key={day} style={{
                              padding: '16px',
                              background: '#F5F5F0',
                              border: '1px solid #E8E8E3',
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#2C2C2C',
                              textAlign: 'center',
                              minWidth: '150px',
                            }}>
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dishTypes.map(dishType => (
                          <tr key={dishType}>
                            <td style={{
                              padding: '16px',
                              border: '1px solid #E8E8E3',
                              fontSize: '15px',
                              fontWeight: '500',
                              color: '#2C2C2C',
                              background: '#FAFAFA',
                              verticalAlign: 'top',
                            }}>
                              {dishType.replace('热菜', '')}
                            </td>
                            {dayLabels.map(day => (
                              <td key={day} style={{
                                padding: '12px',
                                border: '1px solid #E8E8E3',
                                verticalAlign: 'top',
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {tableData[dishType][day].map((dish: any, index: number) => (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        setSelectedDish(dish);
                                        setShowDishDetail(true);
                                      }}
                                      style={{
                                        padding: '8px 12px',
                                        background: '#FFFFFF',
                                        border: '1px solid #E8E8E3',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '14px',
                                        color: '#2C2C2C',
                                        transition: 'all 0.2s',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#F5F5F0';
                                        e.currentTarget.style.borderColor = '#2C2C2C';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#FFFFFF';
                                        e.currentTarget.style.borderColor = '#E8E8E3';
                                      }}
                                >
                                  {dish.dish_name || '未知菜品'}
                                  {/* 🔖 测试标注：显示菜品来源 */}
                                  <span style={{ 
                                    fontSize: '12px', 
                                    color: dish.from_history ? '#FF6B6B' : '#4ECDC4',
                                    marginLeft: '4px',
                                    fontWeight: '500'
                                  }}>
                                    ({dish.from_history ? '历史' : '通用'})
                                  </span>
                                </button>
                                  ))}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })() : (
                <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
                  <p style={{ fontSize: '18px', marginBottom: '16px' }}>菜单数据格式错误</p>
                  <p style={{ fontSize: '14px' }}>
                    请重新生成菜单或联系管理员
                  </p>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div
              style={{
                padding: '24px',
                borderTop: '1px solid #E8E8E3',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <Button
                onClick={() => setShowMenuDialog(false)}
                style={{
                  padding: '12px 24px',
                  background: '#2C2C2C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 菜品详情弹窗 - 优雅大卡片 */}
      {showDishDetail && selectedDish && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '40px',
          }}
          onClick={() => setShowDishDetail(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowDishDetail(false)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                color: '#666',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F5F5F0';
                e.currentTarget.style.color = '#2C2C2C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#666';
              }}
            >
              <X size={24} />
            </button>

            {/* 卡片内容 */}
            <div style={{ padding: '48px' }}>
              {/* 菜品名称 */}
              <h2
                style={{
                  fontSize: '32px',
                  fontWeight: '600',
                  color: '#2C2C2C',
                  marginBottom: '32px',
                  letterSpacing: '0.5px',
                  lineHeight: '1.4',
                }}
              >
                {selectedDish.dish_name || '未知菜品'}
              </h2>

              {/* 描述部分 */}
              <div style={{ marginBottom: '40px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#666',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  菜品描述
                </h3>
                <p
                  style={{
                    fontSize: '18px',
                    lineHeight: '1.8',
                    color: '#2C2C2C',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedDish.description || '暂无描述'}
                </p>
              </div>

              {/* 烹饪方法 */}
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#666',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  烹饪方法
                </h3>
                <p
                  style={{
                    fontSize: '18px',
                    lineHeight: '1.8',
                    color: '#2C2C2C',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedDish.cookingMethod || '暂无烹饪方法'}
                </p>
              </div>
            </div>

            {/* 底部装饰线 */}
            <div
              style={{
                height: '8px',
                background: 'linear-gradient(to right, #2C2C2C, #666)',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
