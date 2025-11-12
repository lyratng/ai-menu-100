'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Edit, Trash2, Power, PowerOff, Download, Upload, Settings, Check, X } from 'lucide-react';
import StoreDialog from './components/StoreDialog';
import ConfigDialog from './components/ConfigDialog';

interface Store {
  id: string;
  store_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
  generated_count: number;
  uploaded_count: number;
  last_active_at: string | null;
  default_config?: any;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configuringStore, setConfiguringStore] = useState<Store | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`http://localhost:8080/api/admin/stores?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取门店列表失败');
      }

      const data = await response.json();
      setStores(data.stores);
      setTotal(data.total);
    } catch (error: any) {
      console.error('获取门店列表失败:', error);
      alert(error.message || '获取门店列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, search, statusFilter]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setShowStoreDialog(true);
  };

  const handleToggleStatus = async (store: Store) => {
    if (!confirm(`确定要${store.is_active ? '禁用' : '启用'}此门店吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8080/api/admin/stores/${store.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !store.is_active }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '操作失败');
      }

      alert(`${store.is_active ? '禁用' : '启用'}成功！`);
      fetchStores();
    } catch (error: any) {
      alert(error.message || '操作失败');
    }
  };

  const handleDelete = async (store: Store) => {
    if (!confirm(`确定要删除门店"${store.store_name}"吗？此操作为软删除，数据将保留。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8080/api/admin/stores/${store.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '删除失败');
      }

      alert('删除成功！');
      fetchStores();
    } catch (error: any) {
      alert(error.message || '删除失败');
    }
  };

  const handleConfigureStore = async (store: Store) => {
    // 获取门店详情（包含default_config）
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8080/api/admin/stores/${store.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('获取门店详情失败');

      const data = await response.json();
      setConfiguringStore(data.store);
      setShowConfigDialog(true);
    } catch (error: any) {
      alert(error.message || '获取门店详情失败');
    }
  };

  const handleDialogClose = () => {
    setShowStoreDialog(false);
    setEditingStore(null);
  };

  const handleDialogSuccess = () => {
    fetchStores();
  };

  return (
    <div style={{ padding: '48px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '400',
            color: '#2C2C2C',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            门店管理
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            fontWeight: '400'
          }}>
            管理系统中的所有门店账号
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            onClick={() => {
              setEditingStore(null);
              setShowStoreDialog(true);
            }}
            style={{
              background: '#2C2C2C',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '400'
            }}
          >
            <Plus size={20} />
            新增门店
          </Button>
          <Button
            style={{
              background: '#FFFFFF',
              color: '#2C2C2C',
              border: '1px solid #E8E8E3',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '400'
            }}
          >
            <Upload size={20} />
            批量导入
          </Button>
          <Button
            style={{
              background: '#FFFFFF',
              color: '#2C2C2C',
              border: '1px solid #E8E8E3',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '400'
            }}
          >
            <Download size={20} />
            导出列表
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
        <CardContent style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* 搜索框 */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="搜索门店名称或账号..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
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

            {/* 搜索按钮 */}
            <Button
              onClick={handleSearch}
              style={{
                background: '#2C2C2C',
                color: '#FFFFFF',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '400'
              }}
            >
              搜索
            </Button>

            {/* 状态筛选 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
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
              <option value="all">全部状态</option>
              <option value="active">已启用</option>
              <option value="inactive">已禁用</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 门店列表 */}
      <Card style={{ border: '1px solid #E8E8E3' }}>
        <CardContent style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
              加载中...
            </div>
          ) : stores.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
              暂无门店数据
            </div>
          ) : (
            <>
              {/* 表格 */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E3' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>门店名称</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>登录账号</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>状态</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>累计生成</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>累计上传</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>最近活跃</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '400', color: '#666' }}>创建时间</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '400', color: '#666' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store) => (
                      <tr key={store.id} style={{ borderBottom: '1px solid #E8E8E3' }}>
                        <td style={{ padding: '16px', fontSize: '16px', fontWeight: '400', color: '#2C2C2C' }}>
                          {store.store_name}
                        </td>
                        <td style={{ padding: '16px', fontSize: '16px', fontWeight: '400', color: '#666' }}>
                          {store.username}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: store.is_active ? '#E8F5E9' : '#FFEBEE',
                          }}>
                            {store.is_active ? (
                              <Check size={20} color="#2E7D32" strokeWidth={3} />
                            ) : (
                              <X size={20} color="#C62828" strokeWidth={3} />
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: '400', color: '#666' }}>
                          {store.generated_count || 0}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: '400', color: '#666' }}>
                          {store.uploaded_count || 0}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '400', color: '#999' }}>
                          {formatDate(store.last_active_at)}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '400', color: '#999' }}>
                          {formatDate(store.created_at)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(store)}
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
                              title="编辑"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleConfigureStore(store)}
                              style={{
                                padding: '6px',
                                background: 'transparent',
                                border: '1px solid #E8E8E3',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#3B82F6',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="配置"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(store)}
                              style={{
                                padding: '6px',
                                background: 'transparent',
                                border: '1px solid #E8E8E3',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: store.is_active ? '#F59E0B' : '#10B981',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title={store.is_active ? '禁用' : '启用'}
                            >
                              {store.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                            </button>
                            <button
                              onClick={() => handleDelete(store)}
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

      {/* 新增/编辑门店对话框 */}
      <StoreDialog
        isOpen={showStoreDialog}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        store={editingStore}
      />

      {/* 门店配置对话框 */}
      {showConfigDialog && configuringStore && (
        <ConfigDialog
          storeId={configuringStore.id}
          storeName={configuringStore.store_name}
          currentConfig={configuringStore.default_config}
          onClose={() => {
            setShowConfigDialog(false);
            setConfiguringStore(null);
          }}
          onSuccess={() => {
            fetchStores();
          }}
        />
      )}
    </div>
  );
}
