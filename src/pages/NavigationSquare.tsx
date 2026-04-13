import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Globe, ExternalLink, Eye, TrendingUp, Plus, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NavigationItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  view_count: number;
  is_approved: boolean;
  created_at: string;
  profiles?: {
    username: string | null;
  };
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

export default function NavigationSquare() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  
  // 投放表单
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [filterCategory]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('navigation_square')
        .select(`
          *,
          profiles (username)
        `)
        .eq('is_approved', true)
        .order('view_count', { ascending: false })
        .limit(50);

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Fetch items error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLink = async (item: NavigationItem) => {
    // 增加浏览计数
    await supabase
      .from('navigation_square')
      .update({ view_count: item.view_count + 1 })
      .eq('id', item.id);

    // 打开链接
    window.open(item.url, '_blank');

    // 刷新列表
    fetchItems();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: '请先登录',
        description: '登录后才能投放链接',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // 检查会员权限
    if (!profile || !['vip', 'city_agent', 'national_agent'].includes(profile.membership_type)) {
      toast({
        title: '权限不足',
        description: 'VIP及以上会员才能投放链接',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // 管理员发布的内容自动通过审核
      const isAdmin = profile?.membership_type === 'national_agent';
      
      const { error } = await supabase
        .from('navigation_square')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || null,
          category: formData.category || null,
          is_approved: isAdmin, // 管理员自动通过
          view_count: 0,
        });

      if (error) throw error;

      toast({
        title: isAdmin ? '✅ 发布成功' : '✅ 提交成功',
        description: isAdmin 
          ? '您的链接已发布到导航广场' 
          : '您的链接已提交，等待管理员审核',
      });

      setFormData({ title: '', url: '', description: '', category: '' });
      setSubmitDialogOpen(false);
      
      // 刷新列表
      fetchItems();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: '❌ 提交失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) =>
    searchQuery === '' ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Button>

        <div className="space-y-6">
          {/* 头部 */}
          <Card className="bg-gradient-brand text-white border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl flex items-center gap-2 mb-2">
                    <Globe className="w-8 h-8" />
                    导航广场
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    发现和分享优质旅游工具，让旅行更轻松
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {user && (
                    <Button variant="secondary" onClick={() => navigate('/my-submissions')}>
                      我的投放
                    </Button>
                  )}
                  <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        投放链接
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>投放链接到导航广场</DialogTitle>
                      <DialogDescription>
                        提交您的优质工具，让更多人发现
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">链接标题 *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="例如：携程旅行"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="url">链接地址 *</Label>
                        <Input
                          id="url"
                          type="url"
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          placeholder="https://example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">分类</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                        <Label htmlFor="description">描述</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="介绍一下这个工具的特点..."
                          rows={3}
                          maxLength={500}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting} className="flex-1">
                          <Send className="w-4 h-4 mr-2" />
                          {submitting ? '提交中...' : '提交审核'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSubmitDialogOpen(false)}
                        >
                          取消
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 筛选和搜索 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="搜索链接..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{items.length}</p>
                    <p className="text-sm text-muted-foreground">优质工具</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {items.reduce((sum, item) => sum + item.view_count, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">总浏览量</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {items.filter((item) => item.view_count > 100).length}
                    </p>
                    <p className="text-sm text-muted-foreground">热门工具</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 链接列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center text-muted-foreground">
                  加载中...
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center text-muted-foreground">
                  暂无链接
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => handleViewLink(item)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                      {item.category && (
                        <Badge variant="outline" className="flex-shrink-0">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <CardDescription className="line-clamp-3">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {item.view_count}
                        </div>
                        {item.profiles?.username && (
                          <span>by {item.profiles.username}</span>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
