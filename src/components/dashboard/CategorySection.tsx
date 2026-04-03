import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import SortableLinkCard from './SortableLinkCard';
import ExportButton from '@/components/ExportButton';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';

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

const DEFAULT_VISIBLE_COUNT = 6; // 默认显示6个链接

export default function CategorySection({ category, onAddLink, onRefresh }: CategorySectionProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((link) => link.id === active.id);
    const newIndex = links.findIndex((link) => link.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(newLinks);

    // 更新数据库中的排序
    const updates = newLinks.map((link, index) => ({
      id: link.id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('links')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    toast({
      title: '排序已保存',
      description: '链接顺序已更新',
    });
  };

  // 判断是否需要显示展开按钮
  const hasMoreLinks = links.length > DEFAULT_VISIBLE_COUNT;
  // 获取要显示的链接
  const visibleLinks = expanded ? links : links.slice(0, DEFAULT_VISIBLE_COUNT);
  const hiddenCount = links.length - DEFAULT_VISIBLE_COUNT;

  return (
    <Card className="p-4 sm:p-6 space-y-4 card-hover hover:border-primary/50">
      {/* Header - 优化移动端布局 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* 标题区域 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {category.icon && (
            <span className="text-xl sm:text-2xl flex-shrink-0">{category.icon}</span>
          )}
          <h3 className="text-base sm:text-lg font-semibold truncate">
            {category.name}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            ({links.length})
          </span>
        </div>

        {/* 操作按钮区域 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 添加按钮 - 移动端也显示 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddLink(category.id)}
            className="h-8 text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            添加
          </Button>

          {/* 导出按钮 */}
          <ExportButton categoryId={category.id} size="sm" />

          {/* 更多操作 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteCategory} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                删除分类
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <Button
            variant="outline"
            className="w-full h-16 border-dashed hover:border-primary/50 hover:bg-primary/5"
            onClick={() => onAddLink(category.id)}
          >
            <Plus className="w-4 h-4 mr-2" />
            添加第一个链接
          </Button>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleLinks.map((link) => link.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={cn(
                  "space-y-2 transition-all duration-300",
                  !expanded && hasMoreLinks && "relative"
                )}>
                  {visibleLinks.map((link) => (
                    <SortableLinkCard key={link.id} link={link} />
                  ))}
                  
                  {/* 渐变遮罩 */}
                  {!expanded && hasMoreLinks && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {/* 展开/收起按钮 */}
            {hasMoreLinks && (
              <Button
                variant="outline"
                className="w-full border-dashed hover:border-primary/50 hover:bg-primary/5"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    收起链接
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    展开全部 ({hiddenCount} 个隐藏)
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
