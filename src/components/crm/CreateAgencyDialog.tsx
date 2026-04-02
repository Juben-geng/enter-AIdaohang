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

interface CreateAgencyDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAgencyDialog({ open, onClose, onSuccess }: CreateAgencyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        title: '请输入团队名称',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    // 检查用户是否已创建团队
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (existingAgency) {
      toast({
        title: '您已创建过团队',
        description: '每个用户只能创建一个团队',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    // 创建团队
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .insert({
        name: formData.name,
        description: formData.description || null,
        owner_id: user.id,
        plan: 'free',
      })
      .select()
      .single();

    if (agencyError || !agencyData) {
      toast({
        title: '创建团队失败',
        description: agencyError?.message,
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    // 将创建者添加为成员
    const { error: memberError } = await supabase
      .from('agency_members')
      .insert({
        agency_id: agencyData.id,
        user_id: user.id,
        role: 'owner',
      });

    setSubmitting(false);

    if (memberError) {
      toast({
        title: '添加成员失败',
        description: memberError.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '成功',
      description: `团队"${formData.name}"已创建`,
    });

    setFormData({ name: '', description: '' });
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建团队</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">团队名称 *</Label>
            <Input
              id="name"
              placeholder="如：XX旅行社"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">团队简介</Label>
            <Textarea
              id="description"
              placeholder="简单介绍您的团队..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
