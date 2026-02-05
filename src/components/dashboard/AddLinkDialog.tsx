import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  onSuccess: () => void;
}

export default function AddLinkDialog({ open, onOpenChange, categoryId, onSuccess }: AddLinkDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [linkType, setLinkType] = useState<'web' | 'miniprogram'>('web');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !categoryId) return;

    setLoading(true);

    const { error } = await supabase.from('links').insert({
      user_id: user.id,
      category_id: categoryId,
      title,
      url,
      description: description || null,
      link_type: linkType,
      sort_order: Date.now(),
    });

    if (error) {
      toast({
        title: '添加失败',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: '添加成功',
      description: '链接已添加',
    });

    setTitle('');
    setUrl('');
    setDescription('');
    setLinkType('web');
    setLoading(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加链接</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-title">链接标题</Label>
            <Input
              id="link-title"
              placeholder="输入链接标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url">链接地址</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-desc">描述（可选）</Label>
            <Textarea
              id="link-desc"
              placeholder="简单描述这个链接"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>链接类型</Label>
            <RadioGroup value={linkType} onValueChange={(v: 'web' | 'miniprogram') => setLinkType(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="web" id="web" />
                <Label htmlFor="web" className="cursor-pointer">网页链接</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="miniprogram" id="miniprogram" />
                <Label htmlFor="miniprogram" className="cursor-pointer">小程序路径</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4">
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
              {loading ? '添加中...' : '添加链接'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}