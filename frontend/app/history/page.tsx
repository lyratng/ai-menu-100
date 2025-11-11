'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, FileSpreadsheet, Calendar, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ParseStatusBar from '@/components/ParseStatusBar';

interface Menu {
  id: string;
  title: string;
  source_type: 'generated' | 'uploaded';
  created_at: string;
  days: number;
  meal_type: string;
  menu_items_json: any;
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [generatedMenus, setGeneratedMenus] = useState<Menu[]>([]);
  const [uploadedMenus, setUploadedMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [showMenuDetail, setShowMenuDetail] = useState(false);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [showDishDetail, setShowDishDetail] = useState(false);

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
      
      // 从API获取历史菜单
      fetchGeneratedMenus(token);
      fetchUploadedMenus(token);
      
      setLoading(false);
    } catch (error) {
      console.error('解析用户数据失败:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchGeneratedMenus = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/menu/history?source_type=generated&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('获取生成菜单失败');
      
      const data = await response.json();
      setGeneratedMenus(data.menus || []);
    } catch (error) {
      console.error('获取生成菜单失败:', error);
    }
  };

  const fetchUploadedMenus = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/menu/history?source_type=uploaded&limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('获取上传菜单失败');
      
      const data = await response.json();
      setUploadedMenus(data.menus || []);
    } catch (error) {
      console.error('获取上传菜单失败:', error);
    }
  };

  const handleDeleteMenu = async (menuId: string, isGenerated: boolean) => {
    if (!confirm('确定要删除这份菜单吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/menu/${menuId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('删除失败');
      
      alert('菜单删除成功');
      
      // 重新加载菜单列表
      if (isGenerated) {
        fetchGeneratedMenus(token!);
      } else {
        fetchUploadedMenus(token!);
      }
    } catch (error: any) {
      alert('删除失败：' + error.message);
    }
  };

  const handleUploadMore = () => {
    if (uploadedMenus.length >= 50) {
      alert('菜单数量已达上限，请清除一部分菜单');
      return;
    }
    
    // TODO: 打开文件选择对话框
    alert('上传功能开发中');
  };

  const handleViewMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setShowMenuDetail(true);
  };

  const handleDownloadExcel = (menu: Menu) => {
    // TODO: 下载菜单为Excel
    alert('Excel下载功能开发中');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <p className="text-lg text-[#666] font-light">加载中...</p>
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
          <div 
            className="cursor-pointer"
            onClick={() => router.push('/')}
          >
            <h1 className="text-3xl font-light text-[#2C2C2C] tracking-wider">炊语</h1>
            <p className="text-sm text-[#999] mt-1 font-light tracking-wide">历史菜单</p>
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
      <main className="max-w-7xl mx-auto px-8 py-12">
        <Card className="border border-[#E8E8E3] shadow-lg">
          <Tabs defaultValue="generated" className="w-full">
            {/* Tab 标签 */}
            <TabsList className="w-full grid grid-cols-2 h-16 bg-[#F5F5F0] rounded-t-xl border-b border-[#E8E8E3]">
              <TabsTrigger 
                value="generated" 
                className="text-lg font-light tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#2C2C2C] data-[state=active]:shadow-sm"
              >
                历史生成菜单
              </TabsTrigger>
              <TabsTrigger 
                value="uploaded" 
                className="text-lg font-light tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#2C2C2C] data-[state=active]:shadow-sm"
              >
                历史上传菜单
              </TabsTrigger>
            </TabsList>

            {/* 历史生成菜单 */}
            <TabsContent value="generated" className="p-8">
              {loading ? (
                <div className="text-center py-16">
                  <p className="text-[#999] font-light">加载中...</p>
                </div>
              ) : generatedMenus.length === 0 ? (
                <div className="text-center py-16">
                  <FileSpreadsheet className="h-16 w-16 text-[#E8E8E3] mx-auto mb-4" />
                  <p className="text-xl text-[#999] font-light tracking-wide mb-2">
                    暂无生成记录
                  </p>
                  <p className="text-sm text-[#999] font-light">
                    去主页生成您的第一份菜单吧
                  </p>
                  <Button
                    onClick={() => router.push('/')}
                    className="mt-6 bg-[#E8E8E3] text-[#999] hover:bg-[#2C2C2C] hover:text-white font-light"
                  >
                    立即生成
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-light text-[#999]">
                    显示最近 {Math.min(generatedMenus.length, 10)} 条生成记录
                  </p>
                  <div className="border border-[#E8E8E3] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-[#F5F5F0]">
                        <TableRow>
                          <TableHead className="font-light text-[#2C2C2C]">标题</TableHead>
                          <TableHead className="font-light text-[#2C2C2C]">生成时间</TableHead>
                          <TableHead className="font-light text-[#2C2C2C]">餐次</TableHead>
                          <TableHead className="font-light text-[#2C2C2C]">天数</TableHead>
                          <TableHead className="text-right font-light text-[#2C2C2C]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generatedMenus.map((menu) => (
                          <TableRow 
                            key={menu.id}
                            className="hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                            onClick={() => handleViewMenu(menu)}
                          >
                            <TableCell className="font-light">{menu.title || '未命名菜单'}</TableCell>
                            <TableCell className="font-light text-[#666]">
                              {new Date(menu.created_at).toLocaleString('zh-CN')}
                            </TableCell>
                            <TableCell className="font-light">
                              {menu.meal_type === 'lunch' ? '午餐' : menu.meal_type === 'dinner' ? '晚餐' : menu.meal_type}
                            </TableCell>
                            <TableCell className="font-light">{menu.days}天</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadExcel(menu);
                                  }}
                                  className="font-light"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  下载
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMenu(menu.id, true);
                                  }}
                                  className="font-light text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  删除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 历史上传菜单 */}
            <TabsContent value="uploaded" className="p-8">
              {loading ? (
                <div className="text-center py-16">
                  <p className="text-[#999] font-light">加载中...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 上传按钮 */}
                  <button
                    onClick={handleUploadMore}
                    className="w-full h-16 border-2 border-dashed border-[#E8E8E3] rounded-lg hover:border-[#999] transition-colors bg-white hover:bg-[#F5F5F0] flex items-center justify-center gap-2"
                  >
                    <Plus className="h-6 w-6 text-[#999]" />
                    <span className="text-base font-light text-[#999] tracking-wide">
                      上传更多菜单 ({uploadedMenus.length}/50)
                    </span>
                  </button>

                  {uploadedMenus.length === 0 ? (
                    <div className="text-center py-16">
                      <FileSpreadsheet className="h-16 w-16 text-[#E8E8E3] mx-auto mb-4" />
                      <p className="text-xl text-[#999] font-light tracking-wide mb-2">
                        暂无上传记录
                      </p>
                      <p className="text-sm text-[#999] font-light">
                        点击上方按钮上传您的历史菜单
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uploadedMenus.map((menu) => (
                        <Card 
                          key={menu.id}
                          className="border border-[#E8E8E3] hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => handleViewMenu(menu)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <FileSpreadsheet className="h-10 w-10 text-[#2C2C2C] flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <h3 className="text-lg font-light text-[#2C2C2C] tracking-wide mb-2">
                                    {menu.title || '未命名菜单'}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm font-light text-[#999]">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(menu.created_at).toLocaleDateString('zh-CN')}
                                    </span>
                                    <span>
                                      {menu.meal_type === 'lunch' ? '午餐' : menu.meal_type === 'dinner' ? '晚餐' : menu.meal_type}
                                    </span>
                                    <span>{menu.days}天</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadExcel(menu);
                                  }}
                                  className="font-light opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMenu(menu.id, false);
                                  }}
                                  className="p-2 hover:bg-red-50 rounded transition-colors"
                                >
                                  <X className="h-5 w-5 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      {/* 菜单详情弹窗 */}
      {showMenuDetail && selectedMenu && (() => {
        // 解析菜单数据
        const menuData = selectedMenu.menu_items_json;
        
        // 调试：查看实际的数据结构
        console.log('🔍 完整菜单数据:', selectedMenu);
        console.log('📋 menu_items_json:', menuData);
        console.log('📝 menu_items_json (JSON字符串):', JSON.stringify(menuData, null, 2));
        
        // 构建表格数据结构
        const dishTypes = ['大荤', '半荤半素', '素菜热炒', '凉菜'];
        const dayLabels = ['周一', '周二', '周三', '周四', '周五'];
        
        // dish_type 映射到显示的分类
        const typeMapping: any = {
          '热菜主荤': '大荤',
          '热菜半荤': '半荤半素',
          '热菜素菜': '素菜热炒',
          '凉菜': '凉菜',
        };
        
        const tableData: any = {};
        dishTypes.forEach(type => {
          tableData[type] = {};
          dayLabels.forEach(() => {
            // 使用索引作为key
          });
        });
        
        // 填充数据 - 新的数据结构是 days[].lunch[]
        if (menuData && menuData.days && Array.isArray(menuData.days)) {
          menuData.days.forEach((dayData: any, dayIndex: number) => {
            const dishes = dayData.lunch || [];
            
            // 初始化这一天的数据
            dishTypes.forEach(type => {
              if (!tableData[type][dayIndex]) {
                tableData[type][dayIndex] = [];
              }
            });
            
            // 按dish_type分类菜品
            dishes.forEach((dish: any, dishIndexInDay: number) => {
              // 兼容两种格式：
              // 1. 对象格式（生成的菜单）：{ dish_name, dish_type, ... }
              // 2. 字符串格式（上传的菜单）：直接是菜名字符串
              
              let dishObj: any;
              if (typeof dish === 'string') {
                // 上传的菜单：字符串格式，根据位置推断分类
                // 假设顺序：前6个是大荤，接下来6个是半荤半素，再6个是素菜热炒，最后4个是凉菜
                let displayType = '素菜热炒'; // 默认
                if (dishIndexInDay < 6) {
                  displayType = '大荤';
                } else if (dishIndexInDay < 12) {
                  displayType = '半荤半素';
                } else if (dishIndexInDay < 18) {
                  displayType = '素菜热炒';
                } else {
                  displayType = '凉菜';
                }
                
                dishObj = {
                  dish_name: dish,
                  dish_type: displayType,
                  description: '',
                  cookingMethod: '',
                };
                
                if (!tableData[displayType][dayIndex]) {
                  tableData[displayType][dayIndex] = [];
                }
                tableData[displayType][dayIndex].push(dishObj);
              } else {
                // 生成的菜单：对象格式
                const displayType = typeMapping[dish.dish_type] || '素菜热炒';
                if (!tableData[displayType][dayIndex]) {
                  tableData[displayType][dayIndex] = [];
                }
                tableData[displayType][dayIndex].push(dish);
              }
            });
          });
        }
        
        console.log('📊 处理后的表格数据:', tableData);
        
        return (
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
              zIndex: 9998,
              padding: '40px',
            }}
            onClick={() => setShowMenuDetail(false)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题和关闭按钮 */}
              <div style={{ 
                padding: '32px', 
                borderBottom: '1px solid #E8E8E3',
                position: 'sticky',
                top: 0,
                background: '#FFFFFF',
                zIndex: 1,
              }}>
                <button
                  onClick={() => setShowMenuDetail(false)}
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
                
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#2C2C2C',
                  marginBottom: '12px',
                }}>
                  {selectedMenu.title || '菜单详情'}
                </h2>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '14px',
                  color: '#999',
                }}>
                  <span>{selectedMenu.meal_type === 'lunch' ? '午餐' : '晚餐'}</span>
                  <span>{selectedMenu.days}天</span>
                  <span>{new Date(selectedMenu.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>

              {/* 菜单表格 */}
              <div style={{ padding: '32px', overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #E8E8E3',
                }}>
                  <thead>
                    <tr style={{ background: '#F5F5F0' }}>
                      <th style={{
                        padding: '16px',
                        border: '1px solid #E8E8E3',
                        fontWeight: '500',
                        fontSize: '14px',
                        color: '#2C2C2C',
                        minWidth: '100px',
                      }}>
                        菜品分类
                      </th>
                      {dayLabels.slice(0, selectedMenu.days).map((label, index) => (
                        <th key={index} style={{
                          padding: '16px',
                          border: '1px solid #E8E8E3',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#2C2C2C',
                          minWidth: '150px',
                        }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dishTypes.map((dishType) => (
                      <tr key={dishType}>
                        <td style={{
                          padding: '12px',
                          border: '1px solid #E8E8E3',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#2C2C2C',
                          background: '#FAFAFA',
                        }}>
                          {dishType}
                        </td>
                        {dayLabels.slice(0, selectedMenu.days).map((label, dayIndex) => (
                          <td key={dayIndex} style={{
                            padding: '12px',
                            border: '1px solid #E8E8E3',
                            verticalAlign: 'top',
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(tableData[dishType][dayIndex] || []).map((dish: any, index: number) => (
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
                                  {dish.from_history !== undefined && (
                                    <span style={{ 
                                      fontSize: '12px', 
                                      color: dish.from_history ? '#FF6B6B' : '#4ECDC4',
                                      marginLeft: '4px',
                                      fontWeight: '500'
                                    }}>
                                      ({dish.from_history ? '历史' : '通用'})
                                    </span>
                                  )}
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
            </div>
          </div>
        );
      })()}

      {/* 菜品详情弹窗 */}
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

            <div style={{ padding: '48px' }}>
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

