import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Customer {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
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

interface OrderDetailDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待支付', variant: 'outline' },
  paid: { label: '已支付', variant: 'default' },
  completed: { label: '已完成', variant: 'secondary' },
  cancelled: { label: '已取消', variant: 'destructive' },
};

const itemTypeMap: Record<string, string> = {
  hotel: '酒店',
  flight: '机票',
  ticket: '门票',
  car: '租车',
  guide: '导游',
  package: '套餐',
  other: '其他',
};

export default function OrderDetailDialog({ open, onClose, order, onSuccess }: OrderDetailDialogProps) {
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    status: order.status,
    paid_amount: order.paid_amount.toString(),
    payment_method: order.payment_method || '',
  });

  useEffect(() => {
    if (open) {
      fetchOrderItems();
      setEditData({
        status: order.status,
        paid_amount: order.paid_amount.toString(),
        payment_method: order.payment_method || '',
      });
    }
  }, [open, order]);

  const fetchOrderItems = async () => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at');

    if (!error && data) {
      setOrderItems(data);
    }
    setLoading(false);
  };

  const handleUpdateOrder = async () => {
    const { error } = await supabase
      .from('travel_orders')
      .update({
        status: editData.status,
        paid_amount: parseFloat(editData.paid_amount),
        payment_method: editData.payment_method || null,
      })
      .eq('id', order.id);

    if (error) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '成功',
      description: '订单已更新',
    });
    setEditMode(false);
    onSuccess();
  };

  const statusInfo = statusMap[order.status] || statusMap.pending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            订单详情
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 订单基本信息 */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">订单号：</span>
                  <span className="font-mono font-semibold">{order.order_no}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">客户：</span>
                  <span className="font-semibold">{order.customers?.name || '未知'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">创建时间：</span>
                  <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">备注：</span>
                    <span>{order.notes}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 订单项目列表 */}
          <div className="space-y-3">
            <h3 className="font-semibold">订单项目</h3>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">加载中...</div>
            ) : orderItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">暂无订单项目</div>
            ) : (
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{item.item_name}</div>
                          <div className="text-sm text-muted-foreground">
                            类型：{itemTypeMap[item.item_type] || item.item_type} · 
                            数量：{item.quantity} · 
                            单价：¥{item.unit_price.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          ¥{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 支付信息 */}
          <div className="space-y-4">
            <h3 className="font-semibold">支付信息</h3>
            
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>订单状态</Label>
                    <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">待支付</SelectItem>
                        <SelectItem value="paid">已支付</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>已支付金额</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.paid_amount}
                      onChange={(e) => setEditData({ ...editData, paid_amount: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>支付方式</Label>
                    <Input
                      placeholder="如：微信支付、支付宝..."
                      value={editData.payment_method}
                      onChange={(e) => setEditData({ ...editData, payment_method: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    取消
                  </Button>
                  <Button onClick={handleUpdateOrder} className="bg-gradient-brand">
                    保存修改
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">订单总额</div>
                    <div className="text-2xl font-bold">¥{Number(order.total_amount).toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">已支付金额</div>
                    <div className="text-2xl font-bold text-green-600">¥{Number(order.paid_amount).toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">待支付金额</div>
                    <div className="text-2xl font-bold text-orange-600">
                      ¥{(Number(order.total_amount) - Number(order.paid_amount)).toFixed(2)}
                    </div>
                  </div>
                  {order.payment_method && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">支付方式</div>
                      <div className="text-lg font-semibold">{order.payment_method}</div>
                    </div>
                  )}
                </div>

                <Button variant="outline" onClick={() => setEditMode(true)} className="w-full">
                  编辑支付信息
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
