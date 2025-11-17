'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Eye, Trash2, Download, Filter, ChevronDown, RefreshCw, Check, X } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';
import { API_URL } from '@/lib/config';

interface Menu {
  id: string;
  store_id: string;
  store_name: string;
  source_type: 'uploaded' | 'generated';
  title: string;
  days: number;
  meal_type: string;
  is_active: boolean;
  created_at: string;
  parse_status: string;
  spicy_ratio: number;
  cook_methods: string[];
  flavor_diversity: boolean;
  structure: {
    main_meat: number;
    half_meat: number;
    veggie: number;
    cold: number;
  };
}

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  
  // 搜索和筛选状态
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 获取门店列表（用于筛选）
  const [stores, setStores] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [page, search, storeFilter, sourceTypeFilter, statusFilter]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/stores?pageSize=1000`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setStores(data.stores.map((s: any) => ({ id: s.id, name: s.store_name })));
    } catch (error) {
      console.error('获取门店列表失败:', error);
    }
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(storeFilter && { storeId: storeFilter }),
        ...(sourceTypeFilter && { sourceType: sourceTypeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`${API_URL}/api/admin/menus?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('获取菜单列表失败');

      const data = await response.json();
      setMenus(data.menus);
      setTotal(data.total);
    } catch (error: any) {
      console.error('获取菜单列表失败:', error);
      alert(error.message || '获取菜单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (menu: Menu) => {
    if (!confirm(`确定要删除菜单"${menu.title}"吗？此操作为软删除。`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/menus/${menu.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('删除失败');

      alert('删除成功！');
      fetchMenus();
    } catch (error: any) {
      alert(error.message || '删除失败');
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

  const getParseStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending_parse': '待解析',
      'parsed': '已解析',
      'parse_failed': '解析失败',
      'generated': '已生成',
    };
    return labels[status] || status;
  };

  const getSpicyLabel = (ratio: number) => {
    if (ratio === 0) return '不辣';
    if (ratio === 0.15) return '微辣';
    if (ratio === 0.30) return '中辣';
    return `${(ratio * 100).toFixed(0)}%`;
  };

  const totalPages = Math.ceil(total / pageSize);

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
          菜单库
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          fontWeight: '400'
        }}>
          查看和管理系统中的所有菜单
        </p>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
        <CardContent style={{ padding: '24px' }}>
          {/* 搜索框 */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: showFilters ? '16px' : 0 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="搜索菜单标题或ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  fontSize: '16px',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  background: '#FAFAFA',
                  color: '#2C2C2C',
                  fontWeight: '400'
                }}
              />
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#999'
                }} 
              />
            </div>
            <Button onClick={handleSearch} style={{
              background: '#2C2C2C',
              color: '#FFFFFF',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              搜索
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: showFilters ? '#2C2C2C' : '#FFFFFF',
                color: showFilters ? '#FFFFFF' : '#2C2C2C',
                border: '1px solid #E8E8E3',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Filter size={20} />
              筛选
            </Button>
          </div>

          {/* 高级筛选 */}
          {showFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #E8E8E3'
            }}>
              <select
                value={storeFilter}
                onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
                style={{
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  background: '#FAFAFA',
                  color: '#2C2C2C',
                  fontWeight: '400',
                  cursor: 'pointer'
                }}
              >
                <option value="">全部门店</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>

              <select
                value={sourceTypeFilter}
                onChange={(e) => { setSourceTypeFilter(e.target.value); setPage(1); }}
                style={{
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  background: '#FAFAFA',
                  color: '#2C2C2C',
                  fontWeight: '400',
                  cursor: 'pointer'
                }}
              >
                <option value="">全部来源</option>
                <option value="generated">AI生成</option>
                <option value="uploaded">用户上传</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  background: '#FAFAFA',
                  color: '#2C2C2C',
                  fontWeight: '400',
                  cursor: 'pointer'
                }}
              >
                <option value="">全部状态</option>
                <option value="active">有效</option>
                <option value="inactive">已删除</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 菜单列表 */}
      <Card style={{ border: '1px solid #E8E8E3' }}>
        <CardContent style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
              加载中...
            </div>
          ) : menus.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
              暂无菜单数据
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E3' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>菜单标题</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>门店</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>来源</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>状态</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>天数</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>辣度</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>口味多样性</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>创建时间</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menus.map((menu) => (
                      <tr key={menu.id} style={{ borderBottom: '1px solid #E8E8E3' }}>
                        <td style={{ padding: '16px', fontSize: '16px', fontWeight: '400', color: '#2C2C2C' }}>
                          {menu.title}
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            ID: {menu.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                          {menu.store_name}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '400',
                            background: menu.source_type === 'generated' ? '#E3F2FD' : '#FFF3E0',
                            color: menu.source_type === 'generated' ? '#1976D2' : '#F57C00'
                          }}>
                            {getSourceTypeLabel(menu.source_type)}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: menu.is_active ? '#E8F5E9' : '#FFEBEE',
                          }}>
                            {menu.is_active ? (
                              <Check size={20} color="#2E7D32" strokeWidth={3} />
                            ) : (
                              <X size={20} color="#C62828" strokeWidth={3} />
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: '400', color: '#666' }}>
                          {menu.days}天
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>
                          {getSpicyLabel(menu.spicy_ratio)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '400',
                            background: menu.flavor_diversity ? '#E8F5E9' : '#F5F5F0',
                            color: menu.flavor_diversity ? '#2E7D32' : '#999'
                          }}>
                            {menu.flavor_diversity ? '达标' : '未达标'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '400', color: '#999' }}>
                          {formatDate(menu.created_at)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => window.location.href = `/admin/menus/${menu.id}`}
                              style={{
                                padding: '6px',
                                background: 'transparent',
                                border: '1px solid #E8E8E3',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="查看详情"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(menu)}
                              style={{
                                padding: '6px',
                                background: 'transparent',
                                border: '1px solid #E8E8E3',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#EF4444',
                                display: 'flex',
                                alignItems: 'center'
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

              {/* 分页 */}
              <div style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #E8E8E3'
              }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '8px 16px',
                      background: page === 1 ? '#F5F5F0' : '#FFFFFF',
                      border: '1px solid #E8E8E3',
                      borderRadius: '6px',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      color: page === 1 ? '#999' : '#2C2C2C'
                    }}
                  >
                    上一页
                  </Button>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 16px',
                      background: page === totalPages ? '#F5F5F0' : '#FFFFFF',
                      border: '1px solid #E8E8E3',
                      borderRadius: '6px',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      color: page === totalPages ? '#999' : '#2C2C2C'
                    }}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
