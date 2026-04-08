import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  link_type: string;
  icon: string | null;
}

interface EditLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: Link | null;
  onSuccess: () => void;
}

export default function EditLinkDialog({ 
  open, 
  onOpenChange, 
  link,
  onSuccess,
}: EditLinkDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [linkType, setLinkType] = useState<'web' | 'miniprogram'>('web');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 当对话框打开时，填充当前链接数据
  useEffect(() => {
    if (open && link) {
      setTitle(link.title);
      setUrl(link.url);
      setDescription(link.description || '');
      setLinkType((link.link_type as 'web' | 'miniprogram') || 'web');
    }
  }, [open, link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!link) {
      console.error('❌ 没有要编辑的链接');
      return;
    }

    setLoading(true);
    console.log('🔄 [更新链接] 开始处理...');
    console.log('📋 链接ID:', link.id);
    console.log('📝 新标题:', title);
    console.log('🔗 新URL:', url);

    try {
      const updateData = {
        title: title.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        link_type: linkType,
        updated_at: new Date().toISOString(),
      };
      
      console.log('📦 更新数据:', updateData);

      const { data, error } = await supabase
        .from('links')
        .update(updateData)
        .eq('id', link.id)
        .select()
        .single();

      if (error) {
        console.error('❌ 更新失败:', error);
        toast({
          title: '❌ 更新失败',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      console.log('✅ 链接更新成功:', data);
      
      toast({
        title: '✅ 更新成功',
        description: `链接"${title}"已更新`,
      });

      setLoading(false);
      onOpenChange(false);
      
      // 刷新页面数据
      setTimeout(() => {
        console.log('🔄 [刷新] 触发页面数据刷新...');
        onSuccess();
      }, 300);
    } catch (error) {
      console.error('💥 [捕获异常]:', error);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑链接</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-link-title">链接标题 *</Label>
            <Input
              id="edit-link-title"
              placeholder="输入链接标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-link-url">链接地址 *</Label>
            <Input
              id="edit-link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-link-desc">描述（可选）</Label>
            <Textarea
              id="edit-link-desc"
              placeholder="简单描述这个链接"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>链接类型</Label>
            <RadioGroup 
              value={linkType} 
              onValueChange={(v: 'web' | 'miniprogram') => setLinkType(v)}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="web" id="edit-web" />
                <Label htmlFor="edit-web" className="cursor-pointer">网页链接</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="miniprogram" id="edit-miniprogram" />
                <Label htmlFor="edit-miniprogram" className="cursor-pointer">小程序路径</Label>
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
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-brand" 
              disabled={loading || !title.trim() || !url.trim()}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存修改
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
