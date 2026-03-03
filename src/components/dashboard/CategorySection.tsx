import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import LinkCard from './LinkCard';
import ExportButton from '@/components/ExportButton';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

interface Link {
  id: string;
  category_id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  link_type: string;
  sort_order: number;
  click_count: number;
}

interface CategorySectionProps {
  category: Category;
  onAddLink: (categoryId: string) => void;
  onRefresh: () => void;
}

export default function CategorySection({ category, onAddLink, onRefresh }: CategorySectionProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);

  // 添加实时订阅
  useEffect(() => {
    const channel = supabase
      .channel(`links_${category.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'links',
        filter: `category_id=eq.${category.id}`,
      }, () => {
        fetchLinks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('category_id', category.id)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const handleDeleteCategory = async () => {
    if (!confirm('确定要删除这个分类吗？分类下的所有链接也会被删除。')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '删除成功',
      description: '分类已删除',
    });
    onRefresh();
  };

  return (
    <Card className="p-6 space-y-4 card-hover hover:border-primary/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {category.icon && <span className="text-2xl">{category.icon}</span>}
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <span className="text-xs text-muted-foreground">({links.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton categoryId={category.id} size="sm" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddLink(category.id)}>
                <Plus className="w-4 h-4 mr-2" />
                添加链接
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteCategory} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                删除分类
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <Button
            variant="outline"
            className="w-full h-16 border-dashed"
            onClick={() => onAddLink(category.id)}
          >
            <Plus className="w-4 h-4 mr-2" />
            添加第一个链接
          </Button>
        ) : (
          links.map((link) => (
            <LinkCard key={link.id} link={link} onRefresh={fetchLinks} />
          ))
        )}
      </div>
    </Card>
  );
}