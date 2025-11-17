'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Trash2, ChevronDown } from 'lucide-react';
import { exportToJSON, exportToCSV, exportToExcel, formatMenuForExport } from '@/lib/exportUtils';
import { API_URL } from '@/lib/config';

interface MenuDetail {
  id: string;
  store_id: string;
  store_name: string;
  source_type: string;
  title: string;
  days: number;
  meal_type: string;
  is_active: boolean;
  created_at: string;
  menu_items_json: any;
  gen_options_json: any;
  menu_stats_json: any;
  meta_json: any;
}

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [menu, setMenu] = useState<MenuDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchMenuDetail();
  }, [params.id]);

  const fetchMenuDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/menus/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('获取菜单详情失败');

      const data = await response.json();
      setMenu(data.menu);
    } catch (error: any) {
      console.error('获取菜单详情失败:', error);
      alert(error.message || '获取菜单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除菜单"${menu?.title}"吗？此操作为软删除。`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/menus/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('删除失败');

      alert('删除成功！');
      router.push('/admin/menus');
    } catch (error: any) {
      alert(error.message || '删除失败');
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'excel') => {
    if (!menu) return;

    const timestamp = new Date().getTime();
    const baseFilename = `menu_${menu.title || menu.id}_${timestamp}`;

    setShowExportMenu(false);

    if (format === 'json') {
      exportToJSON(menu, baseFilename);
    } else if (format === 'csv') {
      const flatData = formatMenuForExport(menu);
      exportToCSV(flatData, baseFilename);
    } else if (format === 'excel') {
      const flatData = formatMenuForExport(menu);
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

  const getSourceTypeLabel = (type: string) => {
    return type === 'generated' ? 'AI生成' : '用户上传';
  };

  const dayLabels: Record<string, string> = {
    'monday': '周一',
    'tuesday': '周二',
    'wednesday': '周三',
    'thursday': '周四',
    'friday': '周五',
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
        加载中...
      </div>
    );
  }

  if (!menu) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
        菜单不存在
      </div>
    );
  }

  const menuItems = menu.menu_items_json?.days || [];
  const genOptions = menu.gen_options_json || {};
  const menuStats = menu.menu_stats_json || {};
  const metaJson = menu.meta_json || {};

  return (
    <div style={{ padding: '48px' }}>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            onClick={() => router.push('/admin/menus')}
            style={{
              background: '#FFFFFF',
              color: '#666',
              border: '1px solid #E8E8E3',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              color: '#2C2C2C',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              {menu.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#999' }}>
              ID: {menu.id}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* 导出按钮（下拉菜单） */}
          <div style={{ position: 'relative' }}>
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{
                background: '#FFFFFF',
                color: '#2C2C2C',
                border: '1px solid #E8E8E3',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={20} />
              导出
              <ChevronDown size={16} />
            </Button>
            
            {/* 导出格式下拉菜单 */}
            {showExportMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
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
                    borderBottom: '1px solid #E8E8E3',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  导出为 CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
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
                  导出为 JSON
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={handleDelete}
            style={{
              background: '#FEF2F2',
              color: '#EF4444',
              border: '1px solid #FEE2E2',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={20} />
            删除菜单
          </Button>
        </div>
      </div>

      {/* 基础信息 */}
      <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
        <CardHeader>
          <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>基础信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            <InfoItem label="门店" value={menu.store_name} />
            <InfoItem label="来源" value={getSourceTypeLabel(menu.source_type)} />
            <InfoItem label="天数" value={`${menu.days}天`} />
            <InfoItem label="餐次" value={menu.meal_type === 'lunch' ? '午餐' : menu.meal_type} />
            <InfoItem label="状态" value={menu.is_active ? '有效' : '已删除'} />
            <InfoItem label="解析状态" value={metaJson.pipeline_status || '未知'} />
            <InfoItem label="创建时间" value={formatDate(menu.created_at)} />
          </div>
        </CardContent>
      </Card>

      {/* 生成参数 */}
      {Object.keys(genOptions).length > 0 && (
        <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>
              {menu.source_type === 'generated' ? '生成参数' : 'AI推导参数'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {genOptions.hot_dish_total_per_day && (
                <InfoItem label="每天热菜总数" value={`${genOptions.hot_dish_total_per_day}道`} />
              )}
              {genOptions.main_meat_per_day && (
                <InfoItem label="主荤菜/天" value={`${genOptions.main_meat_per_day}道`} />
              )}
              {genOptions.half_meat_per_day && (
                <InfoItem label="半荤菜/天" value={`${genOptions.half_meat_per_day}道`} />
              )}
              {genOptions.veggie_hot_per_day && (
                <InfoItem label="素菜/天" value={`${genOptions.veggie_hot_per_day}道`} />
              )}
              {genOptions.cold_per_day && (
                <InfoItem label="凉菜/天" value={`${genOptions.cold_per_day}道`} />
              )}
              {genOptions.spicy_ratio_target !== undefined && (
                <InfoItem label="辣度档位" value={
                  genOptions.spicy_ratio_target === 0 ? '不辣' :
                  genOptions.spicy_ratio_target === 0.15 ? '微辣' :
                  genOptions.spicy_ratio_target === 0.30 ? '中辣' :
                  `${(genOptions.spicy_ratio_target * 100).toFixed(0)}%`
                } />
              )}
              {genOptions.staffing_tight !== undefined && (
                <InfoItem label="人员配置" value={genOptions.staffing_tight ? '紧缺' : '宽裕'} />
              )}
              {genOptions.flavor_diversity_required !== undefined && (
                <InfoItem label="口味多样性要求" value={genOptions.flavor_diversity_required ? '是' : '否'} />
              )}
              {genOptions.ingredient_diversity_requirement && (
                <InfoItem label="原材料多样性" value={genOptions.ingredient_diversity_requirement} />
              )}
              {genOptions.cook_method8_used && genOptions.cook_method8_used.length > 0 && (
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>烹饪方法</div>
                  <div style={{ fontSize: '16px', color: '#2C2C2C' }}>
                    {genOptions.cook_method8_used.join('、')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 实际统计 */}
      {Object.keys(menuStats).length > 0 && (
        <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>实际统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {menuStats.actual_main_meat_per_day && (
                <InfoItem label="实际主荤菜/天" value={`${menuStats.actual_main_meat_per_day}道`} />
              )}
              {menuStats.actual_half_meat_per_day && (
                <InfoItem label="实际半荤菜/天" value={`${menuStats.actual_half_meat_per_day}道`} />
              )}
              {menuStats.actual_veggie_hot_per_day && (
                <InfoItem label="实际素菜/天" value={`${menuStats.actual_veggie_hot_per_day}道`} />
              )}
              {menuStats.actual_cold_per_day && (
                <InfoItem label="实际凉菜/天" value={`${menuStats.actual_cold_per_day}道`} />
              )}
              {menuStats.actual_spicy_ratio !== undefined && (
                <InfoItem label="实际辣菜占比" value={`${(menuStats.actual_spicy_ratio * 100).toFixed(1)}%`} />
              )}
              {menuStats.passed_flavor_diversity !== undefined && (
                <InfoItem label="口味多样性" value={menuStats.passed_flavor_diversity ? '达标' : '未达标'} />
              )}
              {menuStats.ingredient_diversity_actual && (
                <InfoItem label="原材料多样性" value={menuStats.ingredient_diversity_actual} />
              )}
              {menuStats.methods_used8 && menuStats.methods_used8.length > 0 && (
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>使用的烹饪方法</div>
                  <div style={{ fontSize: '16px', color: '#2C2C2C' }}>
                    {menuStats.methods_used8.join('、')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 菜单明细 */}
      <Card style={{ border: '1px solid #E8E8E3' }}>
        <CardHeader>
          <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>菜单明细</CardTitle>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
              暂无菜单数据
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              {menuItems.map((day: any, index: number) => {
                const dayLabel = dayLabels[day.day_label?.toLowerCase()] || day.day_label || `第${index + 1}天`;
                const dishes = day.lunch || [];

                return (
                  <div key={index} style={{
                    padding: '16px',
                    background: '#FAFAFA',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '400',
                      color: '#2C2C2C',
                      marginBottom: '16px'
                    }}>
                      {dayLabel}
                    </h3>
                    {dishes.length === 0 ? (
                      <div style={{ color: '#999', fontSize: '14px' }}>暂无菜品</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {dishes.map((dish: any, dishIndex: number) => {
                          // 兼容两种格式：字符串数组 or 对象数组
                          const dishName = typeof dish === 'string' ? dish : (dish.dish_name || dish.name || '未知菜品');
                          const dishId = typeof dish === 'object' ? dish.dish_id : null;

                          return (
                            <div
                              key={dishIndex}
                              style={{
                                padding: '12px 16px',
                                background: '#FFFFFF',
                                borderRadius: '6px',
                                border: '1px solid #E8E8E3',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ fontSize: '16px', color: '#2C2C2C', fontWeight: '400' }}>
                                {dishIndex + 1}. {dishName}
                              </span>
                              {dishId && (
                                <span style={{ fontSize: '12px', color: '#999' }}>
                                  ID: {dishId.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 信息项组件
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '16px', color: '#2C2C2C', fontWeight: '400' }}>{value}</div>
    </div>
  );
}

