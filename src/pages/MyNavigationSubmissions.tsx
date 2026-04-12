import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Trash2, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MySubmission {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  is_approved: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  '行程规划',
  '签证服务',
  '酒店预订',
  '机票查询',
  '景点门票',
  '租车服务',
  '翻译工具',
  '攻略参考',
  '其他',
];

export default function MyNavigationSubmissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MySubmission | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    url: '',
    description: '',
    category: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('navigation_square')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Fetch submissions error:', error);
      toast({
        title: '❌ 加载失败',
        description: '请刷新页面重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MySubmission) => {
    setSelectedItem(item);
    setEditForm({
      title: item.title,
      url: item.url,
      description: item.description || '',
      category: item.category || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('navigation_square')
        .update({
          title: editForm.title.trim(),
          url: editForm.url.trim(),
          description: editForm.description.trim() || null,
          category: editForm.category || null,
          updated_at: new Date().toISOString(),
          is_approved: false, // 修改后需要重新审核
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast({
        title: '✅ 更新成功',
        description: '您的链接已更新，需要重新审核',
      });

      setEditDialogOpen(false);
      fetchSubmissions();
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
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from('navigation_square')
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast({
        title: '✅ 删除成功',
        description: '链接已删除',
      });

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: '❌ 删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (item: MySubmission) => {
    if (item.is_approved) {
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          已通过
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
        <Clock className="w-3 h-3 mr-1" />
        待审核
      </Badge>
    );
  };

  const stats = {
    total: submissions.length,
    approved: submissions.filter((s) => s.is_approved).length,
    pending: submissions.filter((s) => !s.is_approved).length,
    totalViews: submissions.reduce((sum, s) => sum + s.view_count, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/navigation-square')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回导航广场
        </Button>

        <div className="space-y-6">
          {/* 头部 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">我的投放</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">总投放</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">已通过</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">待审核</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">{stats.totalViews}</p>
                  <p className="text-sm text-muted-foreground">总浏览</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 投放列表 */}
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  加载中...
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">还没有投放记录</p>
                  <Button
                    onClick={() => navigate('/navigation-square')}
                    className="mt-4"
                  >
                    去投放链接
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((item) => (
                    <Card key={item.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold truncate">{item.title}</h3>
                              {getStatusBadge(item)}
                              {item.category && (
                                <Badge variant="outline">{item.category}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-primary hover:underline truncate mb-2">
                              {item.url}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {item.view_count} 次浏览
                              </div>
                              <span>
                                投放于 {new Date(item.created_at).toLocaleDateString('zh-CN')}
                              </span>
                              {item.updated_at !== item.created_at && (
                                <span>
                                  更新于 {new Date(item.updated_at).toLocaleDateString('zh-CN')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
            <DialogTitle>编辑投放链接</DialogTitle>
            <DialogDescription>
              修改后需要重新审核
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">链接标题 *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">链接地址 *</Label>
              <Input
                id="edit-url"
                type="url"
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">分类</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? '保存中...' : '保存修改'}
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
              删除后无法恢复，确定要删除这个投放吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>
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
