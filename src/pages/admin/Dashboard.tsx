import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Link2, LayoutGrid, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalLinks: number;
  totalCategories: number;
  totalRevenue: number;
  todayUsers: number;
  weekUsers: number;
  monthUsers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLinks: 0,
    totalCategories: 0,
    totalRevenue: 0,
    todayUsers: 0,
    weekUsers: 0,
    monthUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      // 获取总用户数
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 获取总链接数
      const { count: totalLinks } = await supabase
        .from('links')
        .select('*', { count: 'exact', head: true });

      // 获取总分类数
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // 获取总收入
      const { data: payments } = await supabase
        .from('payment_orders')
        .select('amount')
        .eq('payment_status', 'paid');

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // 获取今日活跃用户
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayUsers } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('activity_date', today.toISOString().split('T')[0]);

      // 获取本周活跃用户
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: weekUsers } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('activity_date', weekAgo.toISOString().split('T')[0]);

      // 获取本月活跃用户
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const { count: monthUsers } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('activity_date', monthAgo.toISOString().split('T')[0]);

      setStats({
        totalUsers: totalUsers || 0,
        totalLinks: totalLinks || 0,
        totalCategories: totalCategories || 0,
        totalRevenue,
        todayUsers: todayUsers || 0,
        weekUsers: weekUsers || 0,
        monthUsers: monthUsers || 0,
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers,
      icon: Users,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: '总链接数',
      value: stats.totalLinks,
      icon: Link2,
      trend: '+8%',
      trendUp: true,
    },
    {
      title: '总分类数',
      value: stats.totalCategories,
      icon: LayoutGrid,
      trend: '+5%',
      trendUp: true,
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: '+23%',
      trendUp: true,
    },
  ];

  const activityCards = [
    {
      title: '今日活跃',
      value: stats.todayUsers,
      period: 'DAU',
    },
    {
      title: '本周活跃',
      value: stats.weekUsers,
      period: 'WAU',
    },
    {
      title: '本月活跃',
      value: stats.monthUsers,
      period: 'MAU',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表板</h1>
        <p className="text-muted-foreground mt-1">概览系统数据和用户活跃度</p>
      </div>

      {/* 核心指标 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? TrendingUp : TrendingDown;

          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <TrendIcon
                    className={`w-3 h-3 ${
                      card.trendUp ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                  <span
                    className={card.trendUp ? 'text-green-600' : 'text-red-600'}
                  >
                    {card.trend}
                  </span>
                  <span className="text-muted-foreground">vs 上月</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 用户活跃度 */}
      <div>
        <h2 className="text-xl font-bold mb-4">用户活跃度</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {activityCards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <CardDescription>{card.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <div className="text-sm text-muted-foreground mt-1">活跃用户</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 快捷操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
          <CardDescription>常用管理功能</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
            <div className="font-semibold">系统配置</div>
            <div className="text-sm text-muted-foreground mt-1">
              管理功能开关和基础设置
            </div>
          </button>
          <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
            <div className="font-semibold">导航广场</div>
            <div className="text-sm text-muted-foreground mt-1">
              审核用户投放的内容
            </div>
          </button>
          <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
            <div className="font-semibold">用户管理</div>
            <div className="text-sm text-muted-foreground mt-1">
              查看和管理用户权限
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}