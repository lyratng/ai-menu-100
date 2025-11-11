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

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
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
      setUser(userData);
      
      // TODO: 从API获取门店默认配置，更新热菜和凉菜数量
      // const storeConfig = await getStoreConfig(userData.store_id);
      // setLunchDefaultHot(storeConfig.lunch.hot);
      // setLunchDefaultCold(storeConfig.lunch.cold);
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
      
      // TODO: 调用生成菜单API
      // const response = await generateMenu({
      //   store_id: storeId,
      //   days: 5,
      //   meal_type: 'lunch',
      //   ...lunchParams,
      // });
      
      // 暂时模拟成功
      await new Promise(resolve => setTimeout(resolve, 2000));
      setHasGenerated(true);
      alert('菜单生成功能开发中，敬请期待！');
      
    } catch (error: any) {
      console.error('生成菜单失败:', error);
      alert(error.message || '生成菜单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMenu = () => {
    alert('查看生成菜单功能开发中，敬请期待！');
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
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-light text-[#2C2C2C] tracking-wide">主荤菜数量</Label>
                      <Input
                        type="number"
                        min={0}
                        value={lunchParams.main_meat_per_day}
                        onChange={(e) => setLunchParams({ ...lunchParams, main_meat_per_day: parseInt(e.target.value) || 0 })}
                        className="mt-2 h-12 border-[#E8E8E3] font-light"
                      />
                      <p className="text-xs text-[#999] mt-1 font-light">
                        默认{Math.floor(lunchParams.hot_dish_total_per_day / 3)}道
                      </p>
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
                      <p className="text-xs text-[#999] mt-1 font-light">
                        默认{Math.floor(lunchParams.hot_dish_total_per_day / 3)}道
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-light text-[#2C2C2C] tracking-wide">素菜数量</Label>
                      <Input
                        type="number"
                        min={0}
                        value={lunchParams.veggie_hot_per_day}
                        onChange={(e) => setLunchParams({ ...lunchParams, veggie_hot_per_day: parseInt(e.target.value) || 0 })}
                        className="mt-2 h-12 border-[#E8E8E3] font-light"
                      />
                      <p className="text-xs text-[#999] mt-1 font-light">
                        默认{Math.floor(lunchParams.hot_dish_total_per_day / 3)}道
                      </p>
                    </div>
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
                  </div>

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

                  {loading && (
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-center text-blue-700 font-light tracking-wide">
                        🤖 AI正在为您精心挑选菜品，预计需要30-60秒，请耐心等待...
                      </p>
                    </div>
                  )}
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
    </div>
  );
}
