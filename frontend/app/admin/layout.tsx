'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Store, 
  Menu, 
  UtensilsCrossed,
  Users,
  FileText,
  Download,
  Key,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: '概览看板', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: '门店管理', path: '/admin/stores', icon: <Store size={20} /> },
  { name: '菜单库', path: '/admin/menus', icon: <Menu size={20} /> },
  { name: '菜品库', path: '/admin/dishes', icon: <UtensilsCrossed size={20} /> },
  { name: '账号管理', path: '/admin/accounts', icon: <Users size={20} /> },
  { name: '审计日志', path: '/admin/audit', icon: <FileText size={20} /> },
  { name: '导入导出', path: '/admin/import-export', icon: <Download size={20} /> },
  { name: 'API访问', path: '/admin/api-tokens', icon: <Key size={20} /> },
  { name: '系统设置', path: '/admin/settings', icon: <Settings size={20} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查管理员登录状态
    const adminToken = localStorage.getItem('admin_token');
    const adminUser = localStorage.getItem('admin_user');

    if (pathname !== '/admin/login' && (!adminToken || !adminUser)) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  // 登录页面不显示布局
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 加载中
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F5F0'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>加载中...</div>
      </div>
    );
  }

  // 未认证
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#F5F5F0'
    }}>
      {/* 左侧导航栏 */}
      <aside style={{
        width: isCollapsed ? '80px' : '240px',
        background: '#FFFFFF',
        borderRight: '1px solid #E8E8E3',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100
      }}>
        {/* Logo区域 */}
        <div style={{
          padding: isCollapsed ? '24px 16px' : '24px',
          borderBottom: '1px solid #E8E8E3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!isCollapsed && (
            <div>
              <h1 style={{ 
                fontSize: '20px', 
                fontWeight: '400', 
                color: '#2C2C2C',
                letterSpacing: '1px',
                margin: 0
              }}>
                炊语管理后台
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* 导航菜单 */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0'
        }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: isCollapsed ? '12px 16px' : '12px 24px',
                  color: isActive ? '#2C2C2C' : '#666',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  background: isActive ? '#F5F5F0' : 'transparent',
                  borderLeft: isActive ? '3px solid #2C2C2C' : '3px solid transparent',
                  fontSize: '16px',
                  fontWeight: isActive ? '400' : '300',
                  gap: '12px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#FAFAFA';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 退出登录 */}
        <div style={{
          borderTop: '1px solid #E8E8E3',
          padding: '16px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              padding: '12px',
              background: 'transparent',
              border: '1px solid #E8E8E3',
              borderRadius: '8px',
              color: '#666',
              fontSize: '16px',
              fontWeight: '400',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.borderColor = '#EF4444';
              e.currentTarget.style.color = '#EF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#E8E8E3';
              e.currentTarget.style.color = '#666';
            }}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{
        flex: 1,
        marginLeft: isCollapsed ? '80px' : '240px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
}



