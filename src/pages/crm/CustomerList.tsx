import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Search, User, Phone, Mail, Tag } from 'lucide-react';
import AddCustomerDialog from '@/components/crm/AddCustomerDialog';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  wechat: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export default function CustomerList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 检查权限
  const canAccessCRM = profile && ['basic', 'vip', 'city_agent', 'national_agent'].includes(profile.membership_type);

  useEffect(() => {
    if (!canAccessCRM) {
      toast({
        title: '权限不足',
        description: '需要普通会员及以上才能使用客户管理功能',
        variant: 'destructive',
      });
      navigate('/member');
      return;
    }

    if (profile?.id) {
      fetchCustomers();
    }
  }, [canAccessCRM, profile?.id]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('created_by', profile?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '无法加载客户列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">客户管理</h1>
              <p className="text-muted-foreground">管理您的客户信息和旅行需求</p>
            </div>
          </div>
          <Button className="bg-gradient-brand" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加客户
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索客户姓名、电话或邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无客户</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? '没有找到匹配的客户' : '开始添加您的第一个客户'}
              </p>
              {!searchQuery && (
                <Button className="bg-gradient-brand" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加客户
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      {customer.name}
                    </span>
                    {customer.tags && customer.tags.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {customer.tags[0]}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    客户编号: {customer.id.slice(0, 8)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.tags && customer.tags.length > 1 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {customer.tags.slice(1).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {customer.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {customer.notes}
                    </p>
                  )}
                  <div className="pt-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/crm/customers/${customer.id}/trips`)}
                    >
                      查看行程
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <Card className="bg-gradient-brand text-white">
          <CardHeader>
            <CardTitle>客户统计</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-3xl font-bold">{customers.length}</div>
              <div className="text-sm opacity-90">总客户数</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {customers.filter(c => c.tags?.includes('VIP客户')).length}
              </div>
              <div className="text-sm opacity-90">VIP客户</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {customers.filter(c => c.tags?.includes('回头客')).length}
              </div>
              <div className="text-sm opacity-90">回头客</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {customers.filter(c => {
                  const createdDate = new Date(c.created_at);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 30;
                }).length}
              </div>
              <div className="text-sm opacity-90">本月新增</div>
            </div>
          </CardContent>
        </Card>

        {/* Add Customer Dialog */}
        <AddCustomerDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={fetchCustomers}
        />
      </div>
    </div>
  );
}
