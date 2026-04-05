import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Database, 
  Settings, 
  Key,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  UserCog,
  Mail
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  membership_type: string;
  membership_expires_at: string | null;
  referral_code: string | null;
  categories_count?: number;
  links_count?: number;
  created_at?: string;
  last_sign_in?: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCategories: 0,
    totalLinks: 0,
    adminUsers: 0
  });

  // 权限检查
  const isAdmin = profile?.membership_type === 'national_agent';

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: '❌ 权限不足',
        description: '只有管理员才能访问后台',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }
    
    fetchStats();
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchStats = async () => {
    try {
      const [usersResult, categoriesResult, linksResult] = await Promise.all([
        supabase.from('profiles').select('id, membership_type', { count: 'exact' }),
        supabase.from('categories').select('id', { count: 'exact' }),
        supabase.from('links').select('id', { count: 'exact' })
      ]);

      const adminCount = usersResult.data?.filter(u => 
        u.membership_type === 'national_agent' || u.membership_type === 'city_agent'
      ).length || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        totalLinks: linksResult.count || 0,
        adminUsers: adminCount
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 获取每个用户的统计数据
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (p) => {
          const [categoriesResult, linksResult, authResult] = await Promise.all([
            supabase.from('categories').select('id', { count: 'exact' }).eq('user_id', p.id),
            supabase.from('links').select('id', { count: 'exact' }).eq('user_id', p.id),
            supabase.auth.admin.getUserById(p.id).catch(() => null)
          ]);

          return {
            ...p,
            categories_count: categoriesResult.count || 0,
            links_count: linksResult.count || 0,
            last_sign_in: authResult?.data?.user?.last_sign_in_at || null
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast({
        title: '❌ 加载失败',
        description: '无法获取用户列表',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      fetchUsers();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${searchEmail.trim()}%`);

      if (error) throw error;

      const usersWithStats = await Promise.all(
        (data || []).map(async (p) => {
          const [categoriesResult, linksResult] = await Promise.all([
            supabase.from('categories').select('id', { count: 'exact' }).eq('user_id', p.id),
            supabase.from('links').select('id', { count: 'exact' }).eq('user_id', p.id)
          ]);

          return {
            ...p,
            categories_count: categoriesResult.count || 0,
            links_count: linksResult.count || 0
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('搜索用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMembership = async (userId: string, newType: string) => {
    try {
      const expiresAt = newType === 'national_agent' || newType === 'city_agent' 
        ? '2099-12-31 23:59:59+00' 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({ 
          membership_type: newType,
          membership_expires_at: expiresAt
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '✅ 更新成功',
        description: '用户权限已更新'
      });

      fetchUsers();
    } catch (error) {
      console.error('更新失败:', error);
      toast({
        title: '❌ 更新失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    }
  };

  const handleInitializeUserData = async (userId: string, email: string) => {
    try {
      setLoading(true);
      
      // 检查是否已有数据
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existingCategories && existingCategories.length > 0) {
        toast({
          title: '⚠️ 注意',
          description: '用户已有数据，无需初始化',
        });
        return;
      }

      // 获取预设分类
      const { data: presetCategories } = await supabase
        .from('preset_categories')
        .select('*')
        .eq('industry', 'travel')
        .order('sort_order');

      if (!presetCategories || presetCategories.length === 0) {
        throw new Error('预设分类数据不存在');
      }

      // 复制分类和链接
      for (const presetCat of presetCategories) {
        const { data: newCategory, error: catError } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: presetCat.name,
            icon: presetCat.icon,
            color: presetCat.color,
            sort_order: presetCat.sort_order,
            is_custom: false,
          })
          .select()
          .single();

        if (catError) {
          console.error('创建分类失败:', catError);
          continue;
        }

        // 复制链接
        const { data: presetLinks } = await supabase
          .from('preset_links')
          .select('*')
          .eq('category_id', presetCat.id);

        if (presetLinks && presetLinks.length > 0 && newCategory) {
          await supabase.from('links').insert(
            presetLinks.map(link => ({
              user_id: userId,
              category_id: newCategory.id,
              title: link.title,
              url: link.url,
              description: link.description,
              icon: link.icon,
              link_type: link.link_type,
              sort_order: link.sort_order,
            }))
          );
        }
      }

      toast({
        title: '✅ 初始化成功',
        description: `已为 ${email} 初始化完整数据`
      });

      fetchUsers();
    } catch (error) {
      console.error('初始化失败:', error);
      toast({
        title: '❌ 初始化失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMembershipBadge = (type: string) => {
    const config = {
      national_agent: { label: '国家代理', variant: 'default' as const, color: 'bg-purple-500' },
      city_agent: { label: '城市代理', variant: 'default' as const, color: 'bg-blue-500' },
      vip: { label: 'VIP', variant: 'default' as const, color: 'bg-yellow-500' },
      basic: { label: '普通', variant: 'secondary' as const, color: 'bg-green-500' },
      free: { label: '免费', variant: 'outline' as const, color: 'bg-gray-500' }
    };
    const cfg = config[type as keyof typeof config] || config.free;
    return <Badge variant={cfg.variant} className={cfg.color}>{cfg.label}</Badge>;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6">
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
              <Shield className="w-8 h-8" />
              后台管理系统
            </h1>
            <p className="text-muted-foreground mt-1">管理员: {profile?.email}</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                总用户数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                管理员数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                总分类数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                总链接数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLinks}</div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容 */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="w-4 h-4 mr-2" />
              系统工具
            </TabsTrigger>
          </TabsList>

          {/* 用户管理 */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>查看和管理所有用户</CardDescription>
                
                {/* 搜索栏 */}
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="搜索邮箱..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                  />
                  <Button onClick={handleSearchUser} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    搜索
                  </Button>
                  <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    刷新
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">加载中...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>用户名</TableHead>
                        <TableHead>会员等级</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>链接</TableHead>
                        <TableHead>邀请码</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>{user.username || '-'}</TableCell>
                          <TableCell>{getMembershipBadge(user.membership_type)}</TableCell>
                          <TableCell>{user.categories_count || 0}</TableCell>
                          <TableCell>{user.links_count || 0}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {user.referral_code || '-'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select
                                value={user.membership_type}
                                onValueChange={(value) => handleUpdateMembership(user.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">免费</SelectItem>
                                  <SelectItem value="basic">普通</SelectItem>
                                  <SelectItem value="vip">VIP</SelectItem>
                                  <SelectItem value="city_agent">城市代理</SelectItem>
                                  <SelectItem value="national_agent">国家代理</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {user.categories_count === 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleInitializeUserData(user.id, user.email)}
                                >
                                  初始化数据
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统工具 */}
          <TabsContent value="system">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    数据库状态
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>总用户数</span>
                    <Badge>{stats.totalUsers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>总分类数</span>
                    <Badge>{stats.totalCategories}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>总链接数</span>
                    <Badge>{stats.totalLinks}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    管理员账号
                  </CardTitle>
                  <CardDescription>
                    当前系统管理员账号列表
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {users
                      .filter(u => u.membership_type === 'national_agent')
                      .map(admin => (
                        <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{admin.email}</div>
                            <div className="text-sm text-muted-foreground">
                              {admin.username || '未设置用户名'} • ID: {admin.id.slice(0, 8)}...
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
