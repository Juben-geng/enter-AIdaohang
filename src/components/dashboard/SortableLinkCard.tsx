import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import LinkCard from './LinkCard';

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

interface SortableLinkCardProps {
  link: Link;
  onRefresh: () => void;
}

export default function SortableLinkCard({ link, onRefresh }: SortableLinkCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

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
        <div className="bg-background border rounded p-0.5 shadow-md">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      <LinkCard link={link} onRefresh={onRefresh} />
    </div>
  );
}
