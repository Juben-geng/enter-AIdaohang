import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, X } from 'lucide-react';

interface ProfessionTag {
  id: string;
  name: string;
  category: string;
  display_order: number;
}

interface ProfessionTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: () => void; // 保存成功后的回调
}

export default function ProfessionTagDialog({ open, onOpenChange, onSaveSuccess }: ProfessionTagDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<ProfessionTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTags();
      fetchUserSelections();
    }
  }, [open]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('profession_tags')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const fetchUserSelections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profession_tags')
        .select('profession_tag_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setSelectedTags(data?.map(d => d.profession_tag_id) || []);
    } catch (error) {
      console.error('Fetch selections error:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (selectedTags.length === 0) {
      toast({
        title: '请选择职业标签',
        description: '至少选择一个职业标签以获得更好的推荐',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // 删除旧的选择
      await supabase
        .from('user_profession_tags')
        .delete()
        .eq('user_id', user.id);

      // 插入新的选择
      const insertData = selectedTags.map(tagId => ({
        user_id: user.id,
        profession_tag_id: tagId,
      }));

      const { error: insertError } = await supabase
        .from('user_profession_tags')
        .insert(insertData);

      if (insertError) throw insertError;

      // 记录弹窗历史
      await supabase
        .from('profession_popup_history')
        .insert({
          user_id: user.id,
          action: 'selected',
        });

      toast({
        title: '✅ 保存成功',
        description: '您的职业标签已保存',
      });

      // 调用成功回调，通知父组件更新状态
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      // 记录跳过操作
      await supabase
        .from('profession_popup_history')
        .insert({
          user_id: user.id,
          action: 'skipped',
        });

      onOpenChange(false);
    } catch (error) {
      console.error('Skip error:', error);
    }
  };

  const handleClose = async () => {
    if (!user) return;

    try {
      // 记录关闭操作
      await supabase
        .from('profession_popup_history')
        .insert({
          user_id: user.id,
          action: 'closed',
        });

      onOpenChange(false);
    } catch (error) {
      console.error('Close error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">选择您的职业标签</DialogTitle>
                <DialogDescription className="mt-1">
                  帮助我们为您推荐更合适的内容和工具
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${
                  selectedTags.includes(tag.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
                {selectedTags.includes(tag.id) && (
                  <X className="w-3 h-3 ml-2" />
                )}
              </Badge>
            ))}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-medium">提示：</span>
              选择您的职业标签后，系统会为您推荐相关的导航工具、文章内容和行业资讯。
              您可以选择多个标签。
            </p>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              已选择 <Badge variant="secondary">{selectedTags.length}</Badge> 个标签
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={loading}>
            稍后再说
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedTags.length === 0}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
