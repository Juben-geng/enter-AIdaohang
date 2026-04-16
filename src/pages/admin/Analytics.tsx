import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Users, DollarSign, FileText, TrendingUp, 
  Loader2, Calendar, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface UserGrowthData {
  date: string;
  new_users: number;
  paid_users: number;
}

interface RevenueData {
  date: string;
  order_count: number;
  total_revenue: number;
}

interface ContentData {
  content_type: string;
  total_count: number;
  published_count: number;
  total_views: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsFull() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // 最近7天
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [contentStats, setContentStats] = useState<ContentData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserGrowth(),
        fetchRevenue(),
        fetchContentStats(),
        fetchTotalStats(),
      ]);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast({
        title: '加载失败',
        description: '无法加载统计数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGrowth = async () => {
    const days = parseInt(dateRange);
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('user_growth_stats')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (!error && data) {
      setUserGrowth(data.map(d => ({
        date: format(new Date(d.date), 'MM-dd', { locale: zhCN }),
        new_users: d.new_users,
        paid_users: d.paid_users,
      })));
    }
  };

  const fetchRevenue = async () => {
    const days = parseInt(dateRange);
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('revenue_stats')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (!error && data) {
      setRevenue(data.map(d => ({
        date: format(new Date(d.date), 'MM-dd', { locale: zhCN }),
        order_count: d.order_count,
        total_revenue: parseFloat(d.total_revenue),
      })));
    }
  };

  const fetchContentStats = async () => {
    const { data, error } = await supabase
      .from('content_stats')
      .select('*');

    if (!error && data) {
      setContentStats(data.map(d => ({
        content_type: d.content_type === 'articles' ? '文章' :
                      d.content_type === 'friend_links' ? '友情链接' : '导航广场',
        total_count: d.total_count,
        published_count: d.published_count,
        total_views: d.total_views,
      })));
    }
  };

  const fetchTotalStats = async () => {
    // 总用户数
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 最近7天新用户
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    // 总收益和订单数
    const { data: orders } = await supabase
      .from('payment_orders')
      .select('amount')
      .eq('payment_status', 'paid');

    const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.amount as unknown as string), 0) || 0;
    const totalOrders = orders?.length || 0;

    setTotalStats({
      totalUsers: totalUsers || 0,
      newUsers: newUsers || 0,
      totalRevenue,
      totalOrders,
    });
  };

  const handleExport = () => {
    toast({
      title: '导出功能',
      description: '数据导出功能开发中...',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">数据统计</h1>
          <p className="text-muted-foreground mt-1">实时数据分析和业务洞察</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">最近7天</SelectItem>
              <SelectItem value="14">最近14天</SelectItem>
              <SelectItem value="30">最近30天</SelectItem>
              <SelectItem value="90">最近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总用户</p>
                <p className="text-3xl font-bold mt-1">{totalStats.totalUsers}</p>
                <p className="text-sm text-green-500 mt-1">
                  +{totalStats.newUsers} 最近7天
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总收益</p>
                <p className="text-3xl font-bold mt-1">¥{totalStats.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalStats.totalOrders} 笔订单
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总内容</p>
                <p className="text-3xl font-bold mt-1">
                  {contentStats.reduce((sum, c) => sum + c.total_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {contentStats.reduce((sum, c) => sum + c.published_count, 0)} 已发布
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总浏览</p>
                <p className="text-3xl font-bold mt-1">
                  {contentStats.reduce((sum, c) => sum + c.total_views, 0)}
                </p>
                <p className="text-sm text-green-500 mt-1">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  持续增长
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户增长趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>用户增长趋势</CardTitle>
          <CardDescription>新用户注册和付费用户增长情况</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="new_users" stroke="#8884d8" name="新增用户" strokeWidth={2} />
              <Line type="monotone" dataKey="paid_users" stroke="#82ca9d" name="付费用户" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 收益趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>收益趋势</CardTitle>
          <CardDescription>订单数量和收益金额统计</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="order_count" fill="#8884d8" name="订单数" />
              <Bar yAxisId="right" dataKey="total_revenue" fill="#82ca9d" name="收益（元）" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 内容统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>内容分布</CardTitle>
            <CardDescription>各类型内容数量占比</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.content_type}: ${entry.total_count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_count"
                >
                  {contentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>内容浏览统计</CardTitle>
            <CardDescription>各类型内容的浏览量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="content_type" type="category" />
                <Tooltip />
                <Bar dataKey="total_views" fill="#82ca9d" name="浏览量" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 详细数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>内容详细统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">内容类型</th>
                  <th className="text-right p-4">总数量</th>
                  <th className="text-right p-4">已发布</th>
                  <th className="text-right p-4">总浏览</th>
                  <th className="text-right p-4">平均浏览</th>
                </tr>
              </thead>
              <tbody>
                {contentStats.map((stat, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{stat.content_type}</td>
                    <td className="text-right p-4">{stat.total_count}</td>
                    <td className="text-right p-4">{stat.published_count}</td>
                    <td className="text-right p-4">{stat.total_views}</td>
                    <td className="text-right p-4">
                      {stat.published_count > 0
                        ? Math.round(stat.total_views / stat.published_count)
                        : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
