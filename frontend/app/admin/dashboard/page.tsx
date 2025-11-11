'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Store, Menu as MenuIcon, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface MenuTrendItem {
  date: string;
  generated: number;
  uploaded: number;
  total: number;
}

interface CookMethodItem {
  method: string;
  count: number;
  percentage: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    activeStores: 0,
    newStores: 0,
    generatedMenus: 0,
    uploadedMenus: 0,
    retention: '0%',
    failureRate: '0%'
  });
  const [menuTrend, setMenuTrend] = useState<MenuTrendItem[]>([]);
  const [cookMethods, setCookMethods] = useState<CookMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从后端获取统计数据
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取管理员token
        const token = localStorage.getItem('admin_token');
        if (!token) {
          setError('未登录，请先登录管理员账号');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // 并行请求三个接口
        const [statsRes, trendRes, methodsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/dashboard/stats`, { headers }),
          fetch(`${API_URL}/api/admin/dashboard/menu-trend?days=30`, { headers }),
          fetch(`${API_URL}/api/admin/dashboard/cook-methods`, { headers }),
        ]);

        // 检查响应状态
        if (!statsRes.ok || !trendRes.ok || !methodsRes.ok) {
          throw new Error('获取数据失败');
        }

        // 解析数据
        const statsData = await statsRes.json();
        const trendData = await trendRes.json();
        const methodsData = await methodsRes.json();

        // 更新状态
        setStats({
          activeStores: statsData.activeStores || 0,
          newStores: statsData.newStores || 0,
          generatedMenus: statsData.generatedMenus || 0,
          uploadedMenus: statsData.uploadedMenus || 0,
          retention: statsData.retention || '0%',
          failureRate: statsData.failureRate || '0%',
        });

        setMenuTrend(trendData.trend || []);
        setCookMethods(methodsData.distribution || []);
      } catch (err: any) {
        console.error('获取Dashboard数据失败:', err);
        setError(err.message || '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpiCards = [
    { 
      title: '活跃门店数', 
      value: stats.activeStores, 
      icon: <Store size={24} />,
      color: '#3B82F6',
      description: '最近30天有行为的门店'
    },
    { 
      title: '新增门店数', 
      value: stats.newStores, 
      icon: <TrendingUp size={24} />,
      color: '#10B981',
      description: '最近30天首次活跃'
    },
    { 
      title: '生成菜单数', 
      value: stats.generatedMenus, 
      icon: <LayoutDashboard size={24} />,
      color: '#8B5CF6',
      description: 'AI生成的菜单总数'
    },
    { 
      title: '上传菜单数', 
      value: stats.uploadedMenus, 
      icon: <MenuIcon size={24} />,
      color: '#F59E0B',
      description: '用户上传的菜单总数'
    },
    { 
      title: '门店留存率', 
      value: stats.retention, 
      icon: <Users size={24} />,
      color: '#06B6D4',
      description: '周留存率（W1）',
      isPercentage: true
    },
    { 
      title: '失败率', 
      value: stats.failureRate, 
      icon: <AlertCircle size={24} />,
      color: '#EF4444',
      description: '导入/解析/生成失败',
      isPercentage: true
    },
  ];

  return (
    <div style={{ padding: '48px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '400',
          color: '#2C2C2C',
          letterSpacing: '1px',
          marginBottom: '8px'
        }}>
          概览看板
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          fontWeight: '400'
        }}>
          系统运营数据总览（最近30天）
        </p>
      </div>

      {/* 时间筛选器 */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {['最近7天', '最近30天', '最近90天', '自定义区间'].map((period, index) => (
            <button
              key={period}
              style={{
                padding: '8px 16px',
                background: index === 1 ? '#2C2C2C' : '#FFFFFF',
                color: index === 1 ? '#FFFFFF' : '#666',
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '400',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (index !== 1) {
                  e.currentTarget.style.background = '#F5F5F0';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== 1) {
                  e.currentTarget.style.background = '#FFFFFF';
                }
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* KPI卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {kpiCards.map((card) => (
          <Card key={card.title} style={{
            background: '#FFFFFF',
            border: '1px solid #E8E8E3',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <CardHeader style={{ paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <CardTitle style={{ 
                  fontSize: '16px', 
                  fontWeight: '400', 
                  color: '#666'
                }}>
                  {card.title}
                </CardTitle>
                <div style={{ color: card.color }}>
                  {card.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{
                fontSize: '36px',
                fontWeight: '400',
                color: '#2C2C2C',
                marginBottom: '8px'
              }}>
                {card.value}
              </div>
              <CardDescription style={{
                fontSize: '14px',
                color: '#999'
              }}>
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          color: '#DC2626',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: '8px',
          color: '#0369A1',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          正在加载数据...
        </div>
      )}

      {/* 图表区域 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* 菜单生成趋势 */}
        <Card style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E3',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '18px', fontWeight: '400', color: '#2C2C2C' }}>
              菜单生成趋势
            </CardTitle>
            <CardDescription>生成 vs 上传菜单数量对比（最近30天）</CardDescription>
          </CardHeader>
          <CardContent>
            {menuTrend.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E8E8E3' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>日期</th>
                      <th style={{ padding: '8px', textAlign: 'right', color: '#8B5CF6' }}>生成</th>
                      <th style={{ padding: '8px', textAlign: 'right', color: '#F59E0B' }}>上传</th>
                      <th style={{ padding: '8px', textAlign: 'right', color: '#2C2C2C' }}>合计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuTrend.slice(-10).reverse().map((item) => (
                      <tr key={item.date} style={{ borderBottom: '1px solid #F5F5F0' }}>
                        <td style={{ padding: '8px', color: '#666' }}>
                          {new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#8B5CF6', fontWeight: '500' }}>
                          {item.generated}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#F59E0B', fontWeight: '500' }}>
                          {item.uploaded}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#2C2C2C', fontWeight: '600' }}>
                          {item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {menuTrend.length > 10 && (
                  <div style={{ marginTop: '8px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
                    仅显示最近10天数据
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '14px'
              }}>
                {loading ? '加载中...' : '暂无数据'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 八大烹饪法分布 */}
        <Card style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E3',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '18px', fontWeight: '400', color: '#2C2C2C' }}>
              八大烹饪法分布
            </CardTitle>
            <CardDescription>各烹饪方法覆盖比例</CardDescription>
          </CardHeader>
          <CardContent>
            {cookMethods.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {cookMethods.map((item, index) => {
                  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={item.method} style={{ marginBottom: '16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '14px', color: '#2C2C2C', fontWeight: '500' }}>
                          {item.method}
                        </span>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          {item.count}道菜 ({item.percentage}%)
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#F5F5F0',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${item.percentage}%`,
                          height: '100%',
                          background: color,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '14px'
              }}>
                {loading ? '加载中...' : '暂无数据'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



