import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Trash2, GripVertical, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_custom: boolean;
}

export default function EditCategory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    icon: '',
    color: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Fetch categories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditForm({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editForm.name.trim(),
          icon: editForm.icon.trim() || null,
          color: editForm.color.trim() || null,
        })
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast({
        title: '✅ 更新成功',
        description: '分类已更新',
      });

      setEditDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: '❌ 更新失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      // 检查分类下是否有链接
      const { data: links } = await supabase
        .from('links')
        .select('id')
        .eq('category_id', selectedCategory.id)
        .limit(1);

      if (links && links.length > 0) {
        toast({
          title: '❌ 无法删除',
          description: '请先删除分类下的所有链接',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast({
        title: '✅ 删除成功',
        description: '分类已删除',
      });

      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: '❌ 删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Button>

        <div className="space-y-6">
          {/* 头部 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">编辑分类</CardTitle>
                <Button onClick={() => navigate('/')}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建分类
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* 分类列表 */}
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  加载中...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  暂无分类
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                      {category.icon && (
                        <span className="text-2xl">{category.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.is_custom ? '自定义分类' : '预设分类'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {category.is_custom && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称 *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">图标 (Emoji)</Label>
              <Input
                id="icon"
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                placeholder="📋"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">颜色</Label>
              <Input
                id="color"
                value={editForm.color}
                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                placeholder="#1E88E5"
                maxLength={20}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? '保存中...' : '保存'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                取消
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              删除分类后，分类下的所有链接也将被删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
