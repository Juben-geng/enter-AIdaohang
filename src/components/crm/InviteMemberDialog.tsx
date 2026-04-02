import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  onSuccess: () => void;
}

export default function InviteMemberDialog({ open, onClose, agencyId, onSuccess }: InviteMemberDialogProps) {
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: '请输入邮箱地址',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    // 查找用户
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profileData) {
      toast({
        title: '用户不存在',
        description: '该邮箱尚未注册，请邀请用户先注册账号',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    // 检查是否已是成员
    const { data: existingMember } = await supabase
      .from('agency_members')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('user_id', profileData.id)
      .single();

    if (existingMember) {
      toast({
        title: '该用户已是团队成员',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    // 添加成员
    const { error: memberError } = await supabase
      .from('agency_members')
      .insert({
        agency_id: agencyId,
        user_id: profileData.id,
        role: role,
      });

    setSubmitting(false);

    if (memberError) {
      toast({
        title: '邀请失败',
        description: memberError.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '成功',
      description: `已成功邀请 ${email}`,
    });

    setEmail('');
    setRole('member');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>邀请团队成员</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">用户邮箱 *</Label>
            <Input
              id="email"
              type="email"
              placeholder="输入要邀请的用户邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              该用户必须已注册账号才能被邀请
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">成员角色</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">成员 - 查看和编辑权限</SelectItem>
                <SelectItem value="admin">管理员 - 完整管理权限</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={submitting} className="bg-gradient-brand">
              {submitting ? '邀请中...' : '确认邀请'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
