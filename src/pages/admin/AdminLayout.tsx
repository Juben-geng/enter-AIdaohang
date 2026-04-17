import { ReactNode } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Users, 
  LayoutGrid, 
  Link2, 
  FileText, 
  CreditCard,
  BarChart3,
  LogOut,
  Home
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const adminRoutes = [
  {
    title: '仪表板',
    icon: Home,
    path: '/admin',
  },
  {
    title: '导航广场管理',
    icon: LayoutGrid,
    path: '/admin/navigation-square',
  },
  {
    title: '用户管理',
    icon: Users,
    path: '/admin/users',
  },
  {
    title: '内容管理',
    icon: FileText,
    path: '/admin/content',
  },
  {
    title: '友情链接',
    icon: Link2,
    path: '/admin/links',
  },
  {
    title: '支付管理',
    icon: CreditCard,
    path: '/admin/payments',
  },
  {
    title: '数据统计',
    icon: BarChart3,
    path: '/admin/analytics',
  },
  {
    title: '系统配置',
    icon: Settings,
    path: '/admin/config',
  },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 检查是否是管理员（national_agent）
  const isAdmin = profile?.membership_type === 'national_agent';

  if (!profile) {
    // 等待profile加载
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">访问受限</h1>
          <p className="text-muted-foreground mb-6">
            您没有权限访问管理后台<br/>
            当前会员类型: {profile.membership_type || '未设置'}<br/>
            需要: national_agent (全国代理)
          </p>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold">管理后台</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminRoutes.map((route) => {
                    const Icon = route.icon;
                    const isActive = location.pathname === route.path;
                    
                    return (
                      <SidebarMenuItem key={route.path}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={route.path}>
                            <Icon className="w-4 h-4" />
                            <span>{route.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/')}>
                      <Home className="w-4 h-4" />
                      <span>返回首页</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => signOut()}>
                      <LogOut className="w-4 h-4" />
                      <span>退出登录</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">
                  {adminRoutes.find((r) => r.path === location.pathname)?.title || '管理后台'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{profile?.email}</span>
              </div>
            </div>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}