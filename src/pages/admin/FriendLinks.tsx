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
  Link2, Plus, Search, Edit, Trash2, ExternalLink, Star,
  Loader2, CheckCircle, XCircle, Clock, User, Mail
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

interface FriendLink {
  id: string;
  submitter_id: string | null;
  name: string;
  url: string;
  description: string | null;
  logo_url: string | null;
  category: string | null;
  status: string;
  display_order: number;
  click_count: number;
  is_featured: boolean;
  contact_email: string | null;
  contact_name: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    email: string;
  };
}

const categories = [
  '旅游网站',
  '工具平台',
  '行业媒体',
  'AI工具',
  '旅行社',
  '酒店预订',
  '其他',
];

const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

export default function FriendLinksFull() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<FriendLink | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    logo_url: '',
    category: '旅游网站',
    contact_name: '',
    contact_email: '',
    display_order: 0,
    is_featured: false,
  });

  const isAdmin = profile?.membership_type === 'national_agent';

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_links')
        .select(`
          *,
          profiles:submitter_id(username, email)
        `)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch links error:', error);
        toast({
          title: '加载失败',
          description: error.message || '无法加载友情链接列表，请刷新页面重试',
          variant: 'destructive',
        });
        setLinks([]);
        return;
      }
      
      setLinks(data || []);
    } catch (error) {
      console.error('Fetch links error:', error);
      setLinks([]);
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '无法加载友情链接列表，请刷新页面重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      toast({
        title: '请填写必填字段',
        description: '网站名称和URL不能为空',
        variant: 'destructive',
      });
      return;
    }

    // URL验证
    try {
      new URL(formData.url);
    } catch {
      toast({
        title: 'URL格式错误',
        description: '请输入有效的网站地址',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingLink) {
        // 更新链接
        const updateData: Record<string, unknown> = {
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          category: formData.category,
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          updated_at: new Date().toISOString(),
        };

        // 只有管理员可以修改这些字段
        if (isAdmin) {
          updateData.display_order = formData.display_order;
          updateData.is_featured = formData.is_featured;
        }

        const { error } = await supabase
          .from('friend_links')
          .update(updateData)
          .eq('id', editingLink.id);

        if (error) throw error;
        toast({ title: '✅ 链接更新成功' });
      } else {
        // 创建新链接
        const { error } = await supabase
          .from('friend_links')
          .insert({
            submitter_id: user!.id,
            name: formData.name.trim(),
            url: formData.url.trim(),
            description: formData.description.trim() || null,
            logo_url: formData.logo_url.trim() || null,
            category: formData.category,
            contact_name: formData.contact_name.trim() || null,
            contact_email: formData.contact_email.trim() || null,
            display_order: formData.display_order,
            is_featured: formData.is_featured,
            status: isAdmin ? 'approved' : 'pending', // 管理员直接通过
          });

        if (error) throw error;
        toast({
          title: isAdmin ? '✅ 链接已添加' : '✅ 申请已提交',
          description: isAdmin ? undefined : '等待管理员审核',
        });
      }

      setShowDialog(false);
      setEditingLink(null);
      resetForm();
      fetchLinks();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, note?: string) => {
    if (!isAdmin) {
      toast({
        title: '权限不足',
        description: '只有管理员可以审核',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('friend_links')
        .update({
          status: newStatus,
          admin_note: note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ 状态已更新',
        description: `链接已${statusLabels[newStatus]}`,
      });
      fetchLinks();
    } catch (error) {
      console.error('Status change error:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (link: FriendLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || '',
      logo_url: link.logo_url || '',
      category: link.category || '旅游网站',
      contact_name: link.contact_name || '',
      contact_email: link.contact_email || '',
      display_order: link.display_order,
      is_featured: link.is_featured,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('friend_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: '✅ 链接已删除' });
      fetchLinks();
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
      name: '',
      url: '',
      description: '',
      logo_url: '',
      category: '旅游网站',
      contact_name: '',
      contact_email: '',
      display_order: 0,
      is_featured: false,
    });
  };

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      searchQuery === '' ||
      link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || link.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: links.length,
    approved: links.filter(l => l.status === 'approved').length,
    pending: links.filter(l => l.status === 'pending').length,
    clicks: links.reduce((sum, l) => sum + l.click_count, 0),
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总链接</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已启用</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待审核</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ExternalLink className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总点击</p>
                <p className="text-2xl font-bold">{stats.clicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 链接列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>友情链接管理</CardTitle>
              <CardDescription>管理网站底部的友情链接</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) {
                setEditingLink(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {isAdmin ? '添加链接' : '申请链接'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingLink ? '编辑链接' : (isAdmin ? '添加友情链接' : '申请友情链接')}</DialogTitle>
                  <DialogDescription>
                    {isAdmin ? '直接添加友情链接' : '提交申请后等待管理员审核'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>网站名称 *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="网站名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>网站URL *</Label>
                      <Input
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>网站描述</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="网站简介"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>LOGO URL</Label>
                      <Input
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>联系人</Label>
                      <Input
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        placeholder="姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>联系邮箱</Label>
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>显示顺序</Label>
                        <Input
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>精选链接</Label>
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
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingLink ? '更新' : (isAdmin ? '添加' : '提交申请')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* 筛选和搜索 */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="搜索网站名称、URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
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
                  <TableHead>网站信息</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>数据</TableHead>
                  <TableHead>提交者</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{link.name}</span>
                          {link.is_featured && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                        >
                          {link.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {link.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{link.category || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[link.status]}>
                        {statusLabels[link.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>点击: {link.click_count}</div>
                        <div className="text-muted-foreground">排序: {link.display_order}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3" />
                        {link.profiles?.username || '匿名'}
                      </div>
                      {link.contact_email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {link.contact_email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isAdmin && link.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(link.id, 'approved')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              通过
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(link.id, 'rejected')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              拒绝
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(link)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(link.id)}
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

          {!loading && filteredLinks.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              暂无友情链接
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
              确定要删除这个友情链接吗？此操作无法撤销。
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
