import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Plus, Search, Edit, Trash2, Eye, Star, 
  Loader2, Calendar, User, Tag, Image as ImageIcon 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface Article {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image: string | null;
  category: string;
  tags: string[] | null;
  status: string;
  view_count: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    email: string;
  };
}

const categories = [
  '旅游攻略',
  '行业新闻',
  '产品介绍',
  'AI工具教程',
  '经验分享',
  '政策法规',
];

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
};

export default function ContentManagementFull() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    cover_image: '',
    category: '旅游攻略',
    tags: '',
    status: 'draft',
    is_featured: false,
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          profiles:user_id(username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch articles RLS error:', error);
        // 如果是RLS错误，可能是管理员权限问题，尝试只查询自己的文章
        if (error.code === 'PGRST116' || error.message.includes('policy')) {
          try {
            const { data: myData, error: myError } = await supabase
              .from('articles')
              .select(`
                *,
                profiles:user_id(username, email)
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            
            if (myError) {
              console.error('Fetch my articles error:', myError);
              // 即使失败也不抛出错误，只是显示空列表
              setArticles([]);
              toast({
                title: '提示',
                description: '暂时无法加载文章列表，您可以尝试创建新文章',
                variant: 'default',
              });
            } else {
              setArticles(myData || []);
            }
            return;
          } catch (fallbackError) {
            console.error('Fallback fetch error:', fallbackError);
            setArticles([]);
            return;
          }
        }
        // 其他错误也不抛出，只显示空列表
        setArticles([]);
        toast({
          title: '加载失败',
          description: '无法加载文章列表，请稍后重试',
          variant: 'destructive',
        });
        return;
      }
      
      setArticles(data || []);
    } catch (error) {
      console.error('Fetch articles error:', error);
      setArticles([]);
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '无法加载文章列表，请刷新页面重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: '请填写必填字段',
        description: '标题和内容不能为空',
        variant: 'destructive',
      });
      return;
    }

    const slug = formData.slug || generateSlug(formData.title);
    const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];

    try {
      if (editingArticle) {
        // 更新文章
        const { error } = await supabase
          .from('articles')
          .update({
            title: formData.title.trim(),
            slug,
            summary: formData.summary.trim() || null,
            content: formData.content.trim(),
            cover_image: formData.cover_image.trim() || null,
            category: formData.category,
            tags,
            status: formData.status,
            is_featured: formData.is_featured,
            published_at: formData.status === 'published' && !editingArticle.published_at 
              ? new Date().toISOString() 
              : editingArticle.published_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast({ title: '✅ 文章更新成功' });
      } else {
        // 创建新文章
        const { error } = await supabase
          .from('articles')
          .insert({
            user_id: user!.id,
            title: formData.title.trim(),
            slug,
            summary: formData.summary.trim() || null,
            content: formData.content.trim(),
            cover_image: formData.cover_image.trim() || null,
            category: formData.category,
            tags,
            status: formData.status,
            is_featured: formData.is_featured,
            published_at: formData.status === 'published' ? new Date().toISOString() : null,
          });

        if (error) throw error;
        toast({ title: '✅ 文章创建成功' });
      }

      setShowDialog(false);
      setEditingArticle(null);
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      summary: article.summary || '',
      content: article.content,
      cover_image: article.cover_image || '',
      category: article.category,
      tags: article.tags?.join(', ') || '',
      status: article.status,
      is_featured: article.is_featured,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: '✅ 文章已删除' });
      fetchArticles();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      cover_image: '',
      category: '旅游攻略',
      tags: '',
      status: 'draft',
      is_featured: false,
    });
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = 
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    views: articles.reduce((sum, a) => sum + a.view_count, 0),
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总文章</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已发布</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Edit className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">草稿</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总浏览</p>
                <p className="text-2xl font-bold">{stats.views}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 文章列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>文章管理</CardTitle>
              <CardDescription>创建和管理网站文章内容</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) {
                setEditingArticle(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新建文章
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingArticle ? '编辑文章' : '新建文章'}</DialogTitle>
                  <DialogDescription>
                    填写文章信息，支持Markdown格式
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>标题 *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="输入文章标题"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug (可选)</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="自动生成"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>摘要</Label>
                    <Textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="文章简介，用于列表展示"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>内容 *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="文章正文内容（支持Markdown）"
                      rows={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>封面图URL</Label>
                    <Input
                      value={formData.cover_image}
                      onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>分类</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>状态</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">草稿</SelectItem>
                          <SelectItem value="published">发布</SelectItem>
                          <SelectItem value="archived">归档</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>精选</Label>
                      <Select
                        value={formData.is_featured ? 'yes' : 'no'}
                        onValueChange={(value) => setFormData({ ...formData, is_featured: value === 'yes' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">否</SelectItem>
                          <SelectItem value="yes">是</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>标签（逗号分隔）</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="AI工具, 旅游, 攻略"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingArticle ? '更新' : '创建'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* 筛选和搜索 */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="搜索标题、摘要、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文章信息</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>数据</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{article.title}</span>
                          {article.is_featured && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {article.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {article.summary}
                          </p>
                        )}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex gap-1">
                            {article.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[article.status]}>
                        {statusLabels[article.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {article.view_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3" />
                        {article.profiles?.username || '匿名'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(article)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(article.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredArticles.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              暂无文章
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这篇文章吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
