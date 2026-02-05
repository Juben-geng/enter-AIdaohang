import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, MoreVertical, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  click_count: number;
}

interface LinkCardProps {
  link: Link;
  onRefresh: () => void;
}

export default function LinkCard({ link, onRefresh }: LinkCardProps) {
  const { toast } = useToast();

  const handleClick = async () => {
    // 增加点击计数
    await supabase
      .from('links')
      .update({ click_count: link.click_count + 1 })
      .eq('id', link.id);

    // 打开链接
    window.open(link.url, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个链接吗？')) return;

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', link.id);

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
      description: '链接已删除',
    });
    onRefresh();
  };

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        {link.icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
            <span className="text-xl">{link.icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-hidden" onClick={handleClick}>
          <h4 className="font-medium truncate group-hover:text-primary transition-colors">
            {link.title}
          </h4>
          {link.description && (
            <p className="text-sm text-muted-foreground truncate">{link.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Eye className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{link.click_count} 次访问</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleClick}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                删除链接
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}