import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddCustomerDialog({ open, onOpenChange, onSuccess }: AddCustomerDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wechat, setWechat] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: '信息不完整',
        description: '请输入客户姓名',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error } = await supabase.from('customers').insert({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        wechat: wechat.trim() || null,
        tags: tagArray,
        notes: notes.trim() || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: '添加成功',
        description: `客户 ${name} 已添加`,
      });

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setWechat('');
      setTags('');
      setNotes('');

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Add customer error:', error);
      toast({
        title: '添加失败',
        description: error instanceof Error ? error.message : '无法添加客户',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加客户</DialogTitle>
          <DialogDescription>填写客户基本信息</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="客户姓名"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">电话</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="联系电话"
              type="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱地址"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wechat">微信号</Label>
            <Input
              id="wechat"
              value={wechat}
              onChange={(e) => setWechat(e.target.value)}
              placeholder="微信号"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="多个标签用逗号分隔，如：VIP客户,回头客"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="客户备注信息"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-brand" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  添加中...
                </>
              ) : (
                '确认添加'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
