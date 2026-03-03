import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

interface ProfessionTag {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface ProfessionSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function ProfessionSelector({ open, onOpenChange, onComplete }: ProfessionSelectorProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [professions, setProfessions] = useState<ProfessionTag[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProfessions();
      fetchUserProfessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchProfessions = async () => {
    const { data, error } = await supabase
      .from('profession_tags')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!error && data) {
      setProfessions(data);
    }
  };

  const fetchUserProfessions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_professions')
      .select('profession_id')
      .eq('user_id', user.id);

    if (data) {
      setSelectedIds(data.map((p) => p.profession_id));
    }
  };

  const toggleProfession = (professionId: string) => {
    setSelectedIds((prev) =>
      prev.includes(professionId)
        ? prev.filter((id) => id !== professionId)
        : [...prev, professionId]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (selectedIds.length === 0) {
      toast({
        title: '请选择职业标签',
        description: '至少选择一个职业标签',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 删除现有的职业标签
      await supabase
        .from('user_professions')
        .delete()
        .eq('user_id', user.id);

      // 插入新的职业标签
      const inserts = selectedIds.map((professionId) => ({
        user_id: user.id,
        profession_id: professionId,
      }));

      const { error } = await supabase
        .from('user_professions')
        .insert(inserts);

      if (error) throw error;

      // 更新用户已选择职业标签的状态
      await updateProfile({ profession_selected: true });

      toast({
        title: '保存成功',
        description: '职业标签已更新',
      });

      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error('Save profession error:', error);
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">选择您的职业标签</DialogTitle>
          <DialogDescription>
            选择与您相关的职业标签，帮助我们为您推荐更合适的导航内容（可多选）
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-6">
          {professions.map((profession) => {
            const isSelected = selectedIds.includes(profession.id);
            
            return (
              <button
                key={profession.id}
                onClick={() => toggleProfession(profession.id)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col items-center gap-3">
                  <span className="text-4xl">{profession.icon}</span>
                  <span className="font-medium text-center">{profession.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            跳过
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-brand"
            disabled={loading || selectedIds.length === 0}
          >
            {loading ? '保存中...' : `确认选择 (${selectedIds.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}