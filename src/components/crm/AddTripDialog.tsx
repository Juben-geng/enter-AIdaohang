import { useState } from 'react';
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

interface AddTripDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: string;
}

export default function AddTripDialog({ open, onClose, onSuccess, customerId }: AddTripDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    people_count: '2',
    budget: '',
    status: 'inquiry',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !user) return;

    setSubmitting(true);

    const { error } = await supabase.from('customer_trips').insert({
      customer_id: customerId,
      destination: formData.destination,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      people_count: parseInt(formData.people_count),
      budget: formData.budget ? parseFloat(formData.budget) : null,
      status: formData.status,
      notes: formData.notes || null,
      created_by: user.id,
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: '创建失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '成功',
      description: '行程已创建',
    });

    setFormData({
      destination: '',
      start_date: '',
      end_date: '',
      people_count: '2',
      budget: '',
      status: 'inquiry',
      notes: '',
    });

    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建行程</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="destination">目的地 *</Label>
              <Input
                id="destination"
                placeholder="如：三亚、云南、日本..."
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">出发日期</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">返回日期</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="people_count">出行人数 *</Label>
              <Input
                id="people_count"
                type="number"
                min="1"
                placeholder="如：2"
                value={formData.people_count}
                onChange={(e) => setFormData({ ...formData, people_count: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">预算（元）</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder="如：10000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry">咨询中</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                placeholder="记录客户需求、偏好、特殊要求等..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
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
