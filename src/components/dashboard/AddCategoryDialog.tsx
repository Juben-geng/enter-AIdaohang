import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LocalStorageHook {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCategory: (category: any) => void;
}

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isAnonymous?: boolean;
  localStorage?: LocalStorageHook;
}

const EMOJI_OPTIONS = ['📁', '🔖', '⭐', '💼', '🎨', '🎯', '📱', '💻', '🌐', '🚀', '📚', '🎵'];

export default function AddCategoryDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  isAnonymous = false,
  localStorage: localStorageHook,
}: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    if (isAnonymous && localStorageHook) {
      // 使用本地存储
      localStorageHook.addCategory({
        name,
        icon,
        color: null,
        sort_order: Date.now(),
      });
      
      toast({
        title: '创建成功',
        description: '分类已保存到本地',
      });
    } else if (user) {
      // 使用数据库
      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name,
        icon,
        sort_order: Date.now(),
        is_custom: true,
      });

      if (error) {
        toast({
          title: '创建失败',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: '创建成功',
        description: '分类已创建',
      });
    }

    setName('');
    setIcon('📁');
    setLoading(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建分类</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">分类名称</Label>
            <Input
              id="category-name"
              placeholder="输入分类名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>选择图标</Label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`p-3 text-2xl rounded-lg border-2 transition-colors ${
                    icon === emoji
                      ? 'border-primary bg-primary-light'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
              {loading ? '创建中...' : '创建分类'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}