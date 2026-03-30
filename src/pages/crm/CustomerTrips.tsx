import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import AddTripDialog from '@/components/crm/AddTripDialog';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Trip {
  id: string;
  customer_id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  people_count: number;
  budget: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  inquiry: { label: '咨询中', variant: 'outline' },
  confirmed: { label: '已确认', variant: 'default' },
  completed: { label: '已完成', variant: 'secondary' },
  cancelled: { label: '已取消', variant: 'destructive' },
};

export default function CustomerTrips() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const canAccessCRM = profile && ['basic', 'vip', 'city_agent', 'national_agent'].includes(profile.membership_type);

  const fetchCustomer = useCallback(async () => {
    if (!customerId || !profile?.id) return;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('created_by', profile.id)
      .single();

    if (error || !data) {
      toast({
        title: '错误',
        description: '客户不存在或无权访问',
        variant: 'destructive',
      });
      navigate('/crm/customers');
      return;
    }

    setCustomer(data);
  }, [customerId, profile?.id, toast, navigate]);

  const fetchTrips = useCallback(async () => {
    if (!customerId) return;

    const { data, error } = await supabase
      .from('customer_trips')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTrips(data);
    }
    setLoading(false);
  }, [customerId]);

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

    fetchCustomer();
    fetchTrips();
  }, [canAccessCRM, fetchCustomer, fetchTrips, navigate, toast]);

  const handleUpdateStatus = async (tripId: string, newStatus: string) => {
    const { error } = await supabase
      .from('customer_trips')
      .update({ status: newStatus })
      .eq('id', tripId);

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
      description: '行程状态已更新',
    });
    fetchTrips();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crm/customers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">客户行程管理</h1>
            <p className="text-muted-foreground mt-1">
              客户：{customer?.name} {customer?.phone && `· ${customer.phone}`}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-brand">
          <Plus className="w-4 h-4 mr-2" />
          新建行程
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总行程数</p>
                <p className="text-2xl font-bold">{trips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已确认</p>
                <p className="text-2xl font-bold">{trips.filter(t => t.status === 'confirmed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold">{trips.filter(t => t.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">咨询中</p>
                <p className="text-2xl font-bold">{trips.filter(t => t.status === 'inquiry').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips List */}
      {trips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无行程记录</h3>
            <p className="text-muted-foreground mb-4">为客户创建第一个旅行行程吧</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-brand">
              <Plus className="w-4 h-4 mr-2" />
              新建行程
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => {
            const statusInfo = statusMap[trip.status] || statusMap.inquiry;
            
            return (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      {trip.destination}
                    </CardTitle>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trip.start_date && trip.end_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{trip.people_count} 人</span>
                  </div>

                  {trip.budget && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>预算：¥{trip.budget.toLocaleString()}</span>
                    </div>
                  )}

                  {trip.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 bg-muted p-2 rounded">
                      {trip.notes}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {trip.status === 'inquiry' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(trip.id, 'confirmed')}
                        className="flex-1"
                      >
                        确认行程
                      </Button>
                    )}
                    {trip.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(trip.id, 'completed')}
                        className="flex-1"
                      >
                        标记完成
                      </Button>
                    )}
                    {(trip.status === 'inquiry' || trip.status === 'confirmed') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(trip.id, 'cancelled')}
                      >
                        取消
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddTripDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={fetchTrips}
        customerId={customerId || ''}
      />
    </div>
  );
}
