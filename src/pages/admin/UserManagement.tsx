import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Crown, Shield, Mail, Calendar, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  city: string | null;
  membership_type: string;
  membership_expires_at: string | null;
  referral_code: string;
  created_at: string;
}

const membershipLabels: Record<string, string> = {
  free: '免费用户',
  basic: '普通会员',
  vip: 'VIP会员',
  city_agent: '城市代理',
  national_agent: '全国代理',
};

const membershipColors: Record<string, string> = {
  free: 'secondary',
  basic: 'default',
  vip: 'default',
  city_agent: 'default',
  national_agent: 'default',
};

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast({
        title: '加载失败',
        description: '无法加载用户列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          membership_type: newRole,
          updated_at: new Date().toISOString(),
          membership_expires_at: newRole === 'free' ? null : '2099-12-31 23:59:59+00',
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '✅ 更新成功',
        description: `用户权限已更新为 ${membershipLabels[newRole]}`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Update role error:', error);
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      searchQuery === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.referral_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    free: users.filter((u) => u.membership_type === 'free').length,
    basic: users.filter((u) => u.membership_type === 'basic').length,
    vip: users.filter((u) => u.membership_type === 'vip').length,
    agents: users.filter((u) => ['city_agent', 'national_agent'].includes(u.membership_type)).length,
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总用户</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">免费用户</p>
                <p className="text-2xl font-bold">{stats.free}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">普通会员</p>
                <p className="text-2xl font-bold">{stats.basic}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VIP会员</p>
                <p className="text-2xl font-bold">{stats.vip}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">代理</p>
                <p className="text-2xl font-bold">{stats.agents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>管理所有用户的信息和权限</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="搜索邮箱、昵称、手机号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80"
              />
              <Button variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户信息</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>会员类型</TableHead>
                  <TableHead>邀请码</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{user.username || '未设置昵称'}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{user.phone || '-'}</div>
                        <div className="text-muted-foreground">{user.city || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={membershipColors[user.membership_type] as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {membershipLabels[user.membership_type] || user.membership_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {user.referral_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedRole[user.id] || user.membership_type}
                        onValueChange={(value) => {
                          setSelectedRole({ ...selectedRole, [user.id]: value });
                          handleUpdateRole(user.id, value);
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">免费用户</SelectItem>
                          <SelectItem value="basic">普通会员</SelectItem>
                          <SelectItem value="vip">VIP会员</SelectItem>
                          <SelectItem value="city_agent">城市代理</SelectItem>
                          <SelectItem value="national_agent">全国代理</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              没有找到匹配的用户
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
