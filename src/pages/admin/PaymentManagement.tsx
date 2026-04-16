import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign, Search, Eye, CheckCircle, XCircle, Clock,
  Loader2, Filter, Download, RefreshCw
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PaymentOrder {
  id: string;
  user_id: string;
  order_no: string;
  membership_type: string;
  amount: number;
  duration_months: number;
  payment_status: string;
  payment_method: string;
  paid_at: string | null;
  created_at: string;
  profiles?: {
    username: string | null;
    email: string;
  };
}

const statusLabels: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  failed: '支付失败',
  refunded: '已退款',
  cancelled: '已取消',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  failed: 'destructive',
  refunded: 'outline',
  cancelled: 'outline',
};

const membershipLabels: Record<string, string> = {
  basic: '普通会员',
  vip: 'VIP会员',
  city_agent: '城市代理',
  national_agent: '全国代理',
};

export default function PaymentManagementFull() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .select(`
          *,
          profiles:user_id(username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast({
        title: '加载失败',
        description: '无法加载订单列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: PaymentOrder) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payment_orders')
        .update({
          payment_status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: '✅ 状态已更新',
        description: `订单状态已更新为${statusLabels[newStatus]}`,
      });

      fetchOrders();
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Update status error:', error);
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['订单号', '用户邮箱', '会员类型', '金额', '状态', '支付方式', '创建时间'].join(','),
      ...filteredOrders.map(order => [
        order.order_no,
        order.profiles?.email || '',
        membershipLabels[order.membership_type],
        order.amount,
        statusLabels[order.payment_status],
        order.payment_method === 'alipay' ? '支付宝' : '微信支付',
        format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss'),
      ].join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();

    toast({
      title: '✅ 导出成功',
      description: '订单数据已导出',
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === '' ||
      order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.payment_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    pending: orders.filter(o => o.payment_status === 'pending').length,
    revenue: orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + parseFloat(o.amount as unknown as string), 0),
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总订单</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已支付</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待支付</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总收益</p>
                <p className="text-2xl font-bold">¥{stats.revenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>支付订单管理</CardTitle>
              <CardDescription>查看和管理所有支付订单</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>

          {/* 筛选和搜索 */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="搜索订单号、用户邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="pending">待支付</SelectItem>
                <SelectItem value="paid">已支付</SelectItem>
                <SelectItem value="failed">支付失败</SelectItem>
                <SelectItem value="refunded">已退款</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
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
                  <TableHead>订单号</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>套餐</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.order_no}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.profiles?.username || '未设置'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{membershipLabels[order.membership_type]}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.duration_months}个月
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ¥{parseFloat(order.amount as unknown as string).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[order.payment_status]}>
                        {statusLabels[order.payment_status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.payment_method === 'alipay' ? '支付宝' : '微信支付'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              暂无订单记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* 订单详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>查看和管理订单信息</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">订单号</label>
                  <p className="font-mono">{selectedOrder.order_no}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">订单状态</label>
                  <div className="mt-1">
                    <Badge variant={statusColors[selectedOrder.payment_status]}>
                      {statusLabels[selectedOrder.payment_status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">用户邮箱</label>
                  <p>{selectedOrder.profiles?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">用户昵称</label>
                  <p>{selectedOrder.profiles?.username || '未设置'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">会员类型</label>
                  <p>{membershipLabels[selectedOrder.membership_type]}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">有效期</label>
                  <p>{selectedOrder.duration_months}个月</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">订单金额</label>
                  <p className="text-lg font-bold text-primary">
                    ¥{parseFloat(selectedOrder.amount as unknown as string).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">支付方式</label>
                  <p>{selectedOrder.payment_method === 'alipay' ? '支付宝' : '微信支付'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">创建时间</label>
                  <p>{format(new Date(selectedOrder.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">支付时间</label>
                  <p>
                    {selectedOrder.paid_at
                      ? format(new Date(selectedOrder.paid_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
                      : '-'}
                  </p>
                </div>
              </div>

              {/* 状态操作 */}
              {selectedOrder.payment_status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'paid')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    标记为已支付
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    取消订单
                  </Button>
                </div>
              )}

              {selectedOrder.payment_status === 'paid' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'refunded')}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    退款
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
