import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
}

interface OrderItem {
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
}

interface AddOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOrderDialog({ open, onClose, onSuccess }: AddOrderDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    payment_method: '',
    status: 'pending',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { item_name: '', item_type: 'hotel', quantity: 1, unit_price: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .eq('created_by', user.id)
      .order('name');

    if (!error && data) {
      setCustomers(data);
    }
  };

  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      { item_name: '', item_type: 'hotel', quantity: 1, unit_price: 0 },
    ]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const generateOrderNo = () => {
    const date = new Date();
    const timestamp = date.getTime();
    return `ORD${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.customer_id) {
      toast({
        title: '请选择客户',
        variant: 'destructive',
      });
      return;
    }

    if (orderItems.length === 0 || !orderItems[0].item_name) {
      toast({
        title: '请至少添加一个订单项目',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const totalAmount = calculateTotal();
    const orderNo = generateOrderNo();

    // 创建订单
    const { data: orderData, error: orderError } = await supabase
      .from('travel_orders')
      .insert({
        order_no: orderNo,
        customer_id: formData.customer_id,
        total_amount: totalAmount,
        paid_amount: 0,
        status: formData.status,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (orderError || !orderData) {
      toast({
        title: '创建订单失败',
        description: orderError?.message,
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    // 创建订单项
    const orderItemsData = orderItems.map((item) => ({
      order_id: orderData.id,
      item_name: item.item_name,
      item_type: item.item_type,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    setSubmitting(false);

    if (itemsError) {
      toast({
        title: '创建订单项失败',
        description: itemsError.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '成功',
      description: `订单 ${orderNo} 已创建`,
    });

    // 重置表单
    setFormData({
      customer_id: '',
      payment_method: '',
      status: 'pending',
      notes: '',
    });
    setOrderItems([{ item_name: '', item_type: 'hotel', quantity: 1, unit_price: 0 }]);

    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建订单</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 客户选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">客户 *</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">订单状态</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
          </div>

          {/* 订单项目 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>订单项目 *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                <Plus className="w-4 h-4 mr-1" />
                添加项目
              </Button>
            </div>

            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="项目名称（如：三亚5天4晚）"
                      value={item.item_name}
                      onChange={(e) => updateOrderItem(index, 'item_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      value={item.item_type}
                      onValueChange={(value) => updateOrderItem(index, 'item_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">酒店</SelectItem>
                        <SelectItem value="flight">机票</SelectItem>
                        <SelectItem value="ticket">门票</SelectItem>
                        <SelectItem value="car">租车</SelectItem>
                        <SelectItem value="guide">导游</SelectItem>
                        <SelectItem value="package">套餐</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      placeholder="数量"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="单价"
                      value={item.unit_price}
                      onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="w-32 text-right font-semibold">
                    ¥{(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                  {orderItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrderItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end items-center gap-4 pt-3 border-t">
              <span className="text-lg font-semibold">订单总额：</span>
              <span className="text-2xl font-bold text-primary">¥{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">支付方式</Label>
            <Input
              id="payment_method"
              placeholder="如：微信支付、支付宝、银行转账..."
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            />
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              placeholder="订单备注信息..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={submitting} className="bg-gradient-brand">
              {submitting ? '创建中...' : '确认创建'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
