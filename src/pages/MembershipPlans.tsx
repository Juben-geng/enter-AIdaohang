import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Star, Zap, Loader2, ArrowLeft } from 'lucide-react';
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

interface MembershipPlan {
  id: string;
  name: string;
  membership_type: string;
  price: number;
  duration_months: number;
  features: string[];
  ai_quota: number;
  discount_rate: number;
  is_active: boolean;
  display_order: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  basic: <Star className="w-6 h-6 text-blue-500" />,
  vip: <Crown className="w-6 h-6 text-purple-500" />,
  city_agent: <Zap className="w-6 h-6 text-orange-500" />,
  national_agent: <Crown className="w-6 h-6 text-red-500" />,
};

const typeColors: Record<string, string> = {
  basic: 'from-blue-500 to-blue-600',
  vip: 'from-purple-500 to-purple-600',
  city_agent: 'from-orange-500 to-orange-600',
  national_agent: 'from-red-500 to-red-600',
};

export default function MembershipPlans() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Fetch plans error:', error);
      toast({
        title: '加载失败',
        description: '无法加载会员套餐',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: MembershipPlan) => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '登录后才能购买会员',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedPlan || !user) return;

    setProcessing(true);
    try {
      // 创建订单
      const orderNo = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .insert({
          user_id: user.id,
          order_no: orderNo,
          membership_type: selectedPlan.membership_type,
          amount: selectedPlan.price,
          duration_months: selectedPlan.duration_months,
          payment_status: 'pending',
          payment_method: paymentMethod,
          billing_cycle: selectedPlan.duration_months === 1 ? 'monthly' : 'yearly',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast({
        title: '✅ 订单创建成功',
        description: `订单号: ${orderNo}`,
      });

      // 这里应该跳转到支付页面或调用支付接口
      // 由于是演示，我们显示一个提示
      toast({
        title: '💡 支付功能演示',
        description: '实际环境中会跳转到支付页面。现在为演示模式，订单已创建。',
      });

      setShowPaymentDialog(false);
      setSelectedPlan(null);

      // 可选：跳转到订单列表
      // navigate('/orders');
    } catch (error) {
      console.error('Create order error:', error);
      toast({
        title: '创建订单失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const isCurrentPlan = (planType: string) => {
    return profile?.membership_type === planType;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary/10 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">选择您的会员套餐</h1>
          <p className="text-lg text-muted-foreground">
            解锁更多功能，提升您的旅游业务效率
          </p>
        </div>

        {/* 套餐列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-xl ${
                isCurrentPlan(plan.membership_type) ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* 渐变背景 */}
              <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${typeColors[plan.membership_type]} opacity-10`} />

              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-background/80 rounded-xl shadow-lg">
                    {typeIcons[plan.membership_type]}
                  </div>
                  {isCurrentPlan(plan.membership_type) && (
                    <Badge className="bg-primary">当前套餐</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">¥{plan.price}</span>
                  <span className="text-muted-foreground">
                    /{plan.duration_months === 1 ? '月' : '年'}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.ai_quota !== -1 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      AI调用额度: <span className="font-semibold text-foreground">{plan.ai_quota}次/月</span>
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan(plan.membership_type) ? 'outline' : 'default'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan(plan.membership_type)}
                >
                  {isCurrentPlan(plan.membership_type) ? '已开通' : '立即购买'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 支付对话框 */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认购买</DialogTitle>
              <DialogDescription>
                请选择支付方式完成购买
              </DialogDescription>
            </DialogHeader>

            {selectedPlan && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{selectedPlan.name}</span>
                    <span className="text-2xl font-bold text-primary">¥{selectedPlan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    有效期: {selectedPlan.duration_months}个月
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">支付方式</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: 'alipay' | 'wechat') => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="wechat">微信支付</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 演示模式：点击确认将创建订单，实际环境会跳转到支付页面
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                disabled={processing}
              >
                取消
              </Button>
              <Button onClick={handleCreateOrder} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '确认购买'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
