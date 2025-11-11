'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    // 加载仪表板数据
    loadDashboard();
  }, [router]);

  const loadDashboard = async () => {
    try {
      const data = await api.dashboard.get();
      setStats(data.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">门店总数</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.stores_total || 0}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">用户总数</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.users_total || 0}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">菜单总数</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.menus_total || 0}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">菜品库</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.dishes_common_total || 0}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/stores')}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">门店管理</h3>
            <p className="text-sm text-gray-600">管理所有门店信息和配置</p>
          </button>
          
          <button
            onClick={() => router.push('/users')}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">用户管理</h3>
            <p className="text-sm text-gray-600">管理系统用户和权限</p>
          </button>
          
          <button
            onClick={() => router.push('/config')}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">系统配置</h3>
            <p className="text-sm text-gray-600">配置AI模型和其他系统参数</p>
          </button>
        </div>

        {/* Recent Events */}
        {stats?.recent_events && stats.recent_events.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近7天生成事件</h3>
            <div className="space-y-2">
              {stats.recent_events.map((event: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{event.date}</span>
                  <span className="font-medium">{event.count} 次</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

