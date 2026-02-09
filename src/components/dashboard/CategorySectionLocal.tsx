import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LinkCardLocal from './LinkCardLocal';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  click_count: number;
}

interface LocalStorage {
  getLinksByCategory: (categoryId: string) => Link[];
  deleteCategory: (categoryId: string) => void;
}

interface CategorySectionLocalProps {
  category: Category;
  onAddLink: (categoryId: string) => void;
  onRefresh: () => void;
  localStorage: LocalStorage;
  onAction: () => number;
}

export default function CategorySectionLocal({
  category,
  onAddLink,
  localStorage,
  onAction,
}: CategorySectionLocalProps) {
  const links = localStorage.getLinksByCategory(category.id);

  const handleDeleteCategory = () => {
    if (!confirm('确定要删除这个分类吗？分类下的所有链接也会被删除。')) return;
    
    localStorage.deleteCategory(category.id);
    onAction();
  };

  return (
    <Card className="p-6 space-y-4 card-hover hover:border-primary/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {category.icon && <span className="text-2xl">{category.icon}</span>}
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <span className="text-xs text-muted-foreground">({links.length})</span>
        </div>
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

      <div className="space-y-2">
        {links.length === 0 ? (
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
            <LinkCardLocal
              key={link.id}
              link={link}
              localStorage={localStorage}
              onAction={onAction}
            />
          ))
        )}
      </div>
    </Card>
  );
}