'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Eye, Trash2, RefreshCw, Download, ChevronDown } from 'lucide-react';
import { exportToCSV, exportToExcel, formatDishesForExport } from '@/lib/exportUtils';

interface Dish {
  id: string;
  store_id: string | null;
  store_name: string | null;
  dish_name: string;
  dish_type: string;
  ingredient_tags: string[];
  knife_skill: string | null;
  cuisine: string | null;
  cook_method8: string;
  flavor: string | null;
  main_ingredients: string[];
  sub_ingredients: string[];
  seasons: string[];
  is_active: boolean;
  created_at: string;
}

interface Store {
  id: string;
  store_name: string;
}

export default function DishesPage() {
  const router = useRouter();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  // Tab切换：common（通用菜库）或 store（食堂专属菜库）
  const [dishSource, setDishSource] = useState<'common' | 'store'>('common');

  // 筛选条件
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedDishType, setSelectedDishType] = useState('');
  const [selectedCookMethod, setSelectedCookMethod] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchDishes();
  }, [page, search, selectedStore, selectedDishType, selectedCookMethod, selectedSeason, dishSource]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8080/api/admin/stores?pageSize=1000', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('获取门店列表失败');

      const data = await response.json();
      setStores(data.stores);
    } catch (error) {
      console.error('获取门店列表失败:', error);
    }
  };

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        storeId: selectedStore,
        dishType: selectedDishType,
        cookMethod: selectedCookMethod,
        season: selectedSeason,
        isActive: 'true',
        source: dishSource, // 新增：指定查询通用菜库还是食堂菜库
      });

      const response = await fetch(`http://localhost:8080/api/admin/dishes?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('获取菜品列表失败');

      const data = await response.json();
      setDishes(data.dishes);
      setTotal(data.total);
    } catch (error: any) {
      console.error('获取菜品列表失败:', error);
      alert(error.message || '获取菜品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, dishName: string) => {
    if (!confirm(`确定要删除菜品"${dishName}"吗？此操作为软删除。`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8080/api/admin/dishes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('删除失败');

      alert('删除成功！');
      fetchDishes();
    } catch (error: any) {
      alert(error.message || '删除失败');
    }
  };

  const handleViewDetail = (id: string) => {
    router.push(`/admin/dishes/${id}`);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedStore('');
    setSelectedDishType('');
    setSelectedCookMethod('');
    setSelectedSeason('');
    setPage(1);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (dishes.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const timestamp = new Date().getTime();
    const baseFilename = `dishes_${timestamp}`;
    const flatData = formatDishesForExport(dishes);

    setShowExportMenu(false);

    if (format === 'csv') {
      exportToCSV(flatData, baseFilename);
    } else if (format === 'excel') {
      exportToExcel(flatData, baseFilename);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dishTypes = ['热菜主荤', '热菜半荤', '热菜素菜', '凉菜', '主食', '风味小吃', '汤', '酱汁', '饮料', '手工'];
  const cookMethods = ['炒', '熘', '蒸', '烧', '烤', '炖', '煎', '烹'];
  const seasons = ['春', '夏', '秋', '冬'];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: '48px' }}>
      {/* 标题 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '400',
            color: '#2C2C2C',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            菜品库管理
          </h1>
          <p style={{ fontSize: '14px', color: '#999' }}>
            {dishSource === 'common' ? '通用菜库' : '门店专属菜库'}（共 {total} 道菜）
          </p>
        </div>

        {/* 导出按钮 */}
        <div style={{ position: 'relative' }}>
          <Button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={dishes.length === 0}
            style={{
              background: dishes.length === 0 ? '#F5F5F5' : '#2C2C2C',
              color: dishes.length === 0 ? '#CCC' : '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: dishes.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={20} />
            导出当前页
            <ChevronDown size={16} />
          </Button>

          {/* 导出格式下拉菜单 */}
          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: '#FFFFFF',
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 100,
                minWidth: '150px',
              }}
            >
              <button
                onClick={() => handleExport('excel')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#2C2C2C',
                  borderBottom: '1px solid #E8E8E3',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                导出为 Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#2C2C2C',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                导出为 CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab切换：通用菜库 vs 食堂专属菜库 */}
      <div style={{ marginBottom: '24px' }}>
        <Tabs value={dishSource} onValueChange={(value) => {
          setDishSource(value as 'common' | 'store');
          setPage(1); // 切换时重置页码
        }}>
          <TabsList style={{
            background: '#F5F5F0',
            border: '1px solid #E8E8E3',
            padding: '4px',
            borderRadius: '8px'
          }}>
            <TabsTrigger
              value="common"
              style={{
                padding: '8px 24px',
                fontSize: '14px',
                fontWeight: '400',
                letterSpacing: '0.5px',
              }}
            >
              通用菜库 🍽️
            </TabsTrigger>
            <TabsTrigger
              value="store"
              style={{
                padding: '8px 24px',
                fontSize: '14px',
                fontWeight: '400',
                letterSpacing: '0.5px',
              }}
            >
              门店专属菜库 🏪
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
        <CardContent style={{ padding: '24px' }}>
          {/* 搜索框 */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={20}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}
              />
              <Input
                placeholder="搜索菜名..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  paddingLeft: '40px',
                  height: '40px',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  fontSize: '16px',
                }}
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: showFilters ? '#2C2C2C' : '#FFFFFF',
                color: showFilters ? '#FFFFFF' : '#2C2C2C',
                border: '1px solid #E8E8E3',
                padding: '0 24px',
                height: '40px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {showFilters ? '收起筛选' : '展开筛选'}
            </Button>
            <Button
              onClick={handleReset}
              style={{
                background: '#FFFFFF',
                color: '#666',
                border: '1px solid #E8E8E3',
                padding: '0 24px',
                height: '40px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} />
              重置
            </Button>
          </div>

          {/* 高级筛选 */}
          {showFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #E8E8E3',
            }}>
              <div>
                <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>
                  门店
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => {
                    setSelectedStore(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #E8E8E3',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: '#2C2C2C',
                  }}
                >
                  <option value="">全部门店</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>
                  菜品类型
                </label>
                <select
                  value={selectedDishType}
                  onChange={(e) => {
                    setSelectedDishType(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #E8E8E3',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: '#2C2C2C',
                  }}
                >
                  <option value="">全部类型</option>
                  {dishTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>
                  烹饪方式
                </label>
                <select
                  value={selectedCookMethod}
                  onChange={(e) => {
                    setSelectedCookMethod(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #E8E8E3',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: '#2C2C2C',
                  }}
                >
                  <option value="">全部方式</option>
                  {cookMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>
                  季节
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #E8E8E3',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: '#2C2C2C',
                  }}
                >
                  <option value="">全部季节</option>
                  {seasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 菜品列表 */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
          加载中...
        </div>
      ) : dishes.length === 0 ? (
        <Card style={{ border: '1px solid #E8E8E3' }}>
          <CardContent style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
            暂无菜品数据
          </CardContent>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E3' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      菜品名称
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      门店
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      类型
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      烹饪方式
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      口味
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      季节
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      创建时间
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((dish) => (
                    <tr
                      key={dish.id}
                      style={{
                        borderBottom: '1px solid #E8E8E3',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px', fontSize: '15px', color: '#2C2C2C', fontWeight: '400' }}>
                        {dish.dish_name}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                        {dish.store_name}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          background: '#F0F0F0',
                          color: '#666',
                        }}>
                          {dish.dish_type}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                        {dish.cook_method8}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                        {dish.flavor || '-'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                        {dish.seasons && dish.seasons.length > 0 ? dish.seasons.join('、') : '-'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#999' }}>
                        {formatDate(dish.created_at)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleViewDetail(dish.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#FFFFFF',
                              border: '1px solid #E8E8E3',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px',
                              color: '#666',
                            }}
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dish.id, dish.dish_name)}
                            style={{
                              padding: '6px 12px',
                              background: '#FEF2F2',
                              border: '1px solid #FEE2E2',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px',
                              color: '#EF4444',
                            }}
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              padding: '24px 0'
            }}>
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  background: page === 1 ? '#F5F5F5' : '#FFFFFF',
                  color: page === 1 ? '#CCC' : '#2C2C2C',
                  border: '1px solid #E8E8E3',
                  borderRadius: '6px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                上一页
              </Button>
              <span style={{ color: '#666', fontSize: '14px' }}>
                第 {page} / {totalPages} 页
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  background: page === totalPages ? '#F5F5F5' : '#FFFFFF',
                  color: page === totalPages ? '#CCC' : '#2C2C2C',
                  border: '1px solid #E8E8E3',
                  borderRadius: '6px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
