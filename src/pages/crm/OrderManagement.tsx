import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import AddOrderDialog from '@/components/crm/AddOrderDialog';
import OrderDetailDialog from '@/components/crm/OrderDetailDialog';

interface Customer {
  id: string;
  name: string;
}

interface Order {
  id: string;
  order_no: string;
  customer_id: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  customers?: Customer;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待支付', variant: 'outline' },
  paid: { label: '已支付', variant: 'default' },
  completed: { label: '已完成', variant: 'secondary' },
  cancelled: { label: '已取消', variant: 'destructive' },
};

export default function OrderManagement() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const canAccessCRM = profile && ['basic', 'vip', 'city_agent', 'national_agent'].includes(profile.membership_type);

  const fetchOrders = useCallback(async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('travel_orders')
      .select(`
        *,
        customers (
          id,
          name
        )
      `)
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    if (!canAccessCRM) {
      toast({
        title: '权限不足',
        description: '请升级到普通会员或以上等级',
        variant: 'destructive',
      });
      navigate('/member');
      return;
    }

    fetchOrders();
  }, [canAccessCRM, fetchOrders, navigate, toast]);

  const filteredOrders = orders.filter(order =>
    order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customers?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const paidAmount = orders.reduce((sum, order) => sum + Number(order.paid_amount), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">订单管理</h1>
          <p className="text-muted-foreground mt-1">管理旅游订单和支付</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-brand">
          <Plus className="w-4 h-4 mr-2" />
          新建订单
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总订单数</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总金额</p>
                <p className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待支付</p>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold">{completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索订单号或客户姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无订单记录</h3>
            <p className="text-muted-foreground mb-4">创建第一个旅游订单吧</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-brand">
              <Plus className="w-4 h-4 mr-2" />
              新建订单
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusInfo = statusMap[order.status] || statusMap.pending;
            
            return (
              <Card 
                key={order.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{order.order_no}</span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>客户：{order.customers?.name || '未知'}</span>
                          <span>创建时间：{new Date(order.created_at).toLocaleDateString()}</span>
                          {order.payment_method && (
                            <span>支付方式：{order.payment_method}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xl font-bold text-primary">
                        ¥{Number(order.total_amount).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        已付：¥{Number(order.paid_amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddOrderDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={fetchOrders}
      />

      {selectedOrder && (
        <OrderDetailDialog
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
