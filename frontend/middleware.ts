import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  console.log('🔀 Middleware - Hostname:', hostname, 'Path:', pathname);

  // 如果是管理员域名（admin.ai-menu.tech）
  if (hostname.startsWith('admin.')) {
    // 如果访问根路径，重定向到 /admin/login
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      console.log('🔀 重定向: / → /admin/login');
      return NextResponse.redirect(url);
    }

    // 如果访问的路径不是以 /admin 开头，添加 /admin 前缀
    if (!pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      console.log('🔀 重写路径:', pathname, '→', url.pathname);
      return NextResponse.rewrite(url);
    }
  }

  // 如果是用户域名（app.ai-menu.tech）
  if (hostname.startsWith('app.')) {
    // 如果访问 /admin 相关路径，重定向到管理员域名
    if (pathname.startsWith('/admin')) {
      const url = new URL(pathname, request.url);
      url.hostname = hostname.replace('app.', 'admin.');
      console.log('🔀 重定向到管理员域名:', url.toString());
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// 配置哪些路径需要运行中间件
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api 路由
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

