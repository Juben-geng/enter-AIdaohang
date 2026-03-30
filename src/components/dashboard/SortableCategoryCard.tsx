import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import CategorySection from './CategorySection';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

interface SortableCategoryCardProps {
  category: Category;
  onAddLink: (categoryId: string) => void;
  onRefresh: () => void;
}

export default function SortableCategoryCard({ 
  category, 
  onAddLink, 
  onRefresh 
}: SortableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="bg-background border rounded p-1 shadow-md">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <CategorySection
        category={category}
        onAddLink={onAddLink}
        onRefresh={onRefresh}
      />
    </div>
  );
}
