import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocalStorageHook {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addLink: (link: any) => void;
}

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  onSuccess: () => void;
  isAnonymous?: boolean;
  localStorage?: LocalStorageHook;
}

export default function AddLinkDialog({ 
  open, 
  onOpenChange, 
  categoryId, 
  onSuccess,
  isAnonymous = false,
  localStorage: localStorageHook,
}: AddLinkDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [linkType, setLinkType] = useState<'web' | 'miniprogram'>('web');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // 诊断信息
  useEffect(() => {
    if (open) {
      const info = [
        `🔍 诊断信息:`,
        `- 用户ID: ${user?.id || '未登录'}`,
        `- 邮箱: ${user?.email || 'N/A'}`,
        `- 会员: ${profile?.membership_type || 'N/A'}`,
        `- 分类ID: ${categoryId || '未选择'}`,
        `- 匿名模式: ${isAnonymous ? '是' : '否'}`,
      ].join('\n');
      setDebugInfo(info);
      console.log(info);
    }
  }, [open, user, profile, categoryId, isAnonymous]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('═══════════════════════════════════════');
    console.log('🚀 [添加链接] 开始处理...');
    console.log('═══════════════════════════════════════');
    
    // 验证分类ID
    if (!categoryId) {
      console.error('❌ [验证失败] categoryId 为空');
      toast({
        title: '❌ 错误',
        description: '未选择分类，请刷新页面重试',
        variant: 'destructive',
      });
      return;
    }

    // 验证登录状态（非匿名模式）
    if (!isAnonymous && !user) {
      console.error('❌ [验证失败] 用户未登录');
      toast({
        title: '❌ 错误',
        description: '请先登录',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isAnonymous && localStorageHook) {
        console.log('📝 [本地模式] 使用LocalStorage保存');
        // 使用本地存储
        localStorageHook.addLink({
          category_id: categoryId,
          title,
          url,
          description: description || null,
          icon: null,
          link_type: linkType,
          sort_order: Date.now(),
        });

        toast({
          title: '✅ 添加成功',
          description: '链接已保存到本地',
        });

        resetForm();
        onOpenChange(false);
        onSuccess();
      } else {
        console.log('💾 [数据库模式] 准备插入数据库...');
        
        // 首先检查用户session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [Session错误]', sessionError);
          throw new Error('无法获取用户会话，请重新登录');
        }
        
        if (!sessionData.session) {
          console.error('❌ [Session不存在] 用户未登录或会话已过期');
          throw new Error('用户会话已过期，请重新登录');
        }
        
        console.log('✅ [Session有效] User ID:', sessionData.session.user.id);
        
        // 验证分类归属
        console.log('🔍 [验证分类] 检查分类是否属于当前用户...');
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name, user_id')
          .eq('id', categoryId)
          .single();
        
        if (categoryError) {
          console.error('❌ [分类查询失败]', categoryError);
          throw new Error('无法找到该分类，请刷新页面重试');
        }
        
        if (!categoryData) {
          console.error('❌ [分类不存在]');
          throw new Error('分类不存在，请刷新页面重试');
        }
        
        if (categoryData.user_id !== user!.id) {
          console.error('❌ [权限错误] 分类不属于当前用户');
          console.error('分类归属:', categoryData.user_id);
          console.error('当前用户:', user!.id);
          throw new Error('无权限操作此分类');
        }
        
        console.log('✅ [分类验证通过]', categoryData.name);
        
        // 准备插入数据
        const insertData = {
          user_id: user!.id,
          category_id: categoryId,
          title: title.trim(),
          url: url.trim(),
          description: description?.trim() || null,
          link_type: linkType,
          sort_order: Date.now(),
        };
        
        console.log('📦 [插入数据]', JSON.stringify(insertData, null, 2));
        
        // 执行插入
        const { data, error } = await supabase
          .from('links')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('═══════════════════════════════════════');
          console.error('❌ [数据库错误] 插入失败');
          console.error('═══════════════════════════════════════');
          console.error('错误代码:', error.code);
          console.error('错误消息:', error.message);
          console.error('错误详情:', error.details);
          console.error('错误提示:', error.hint);
          console.error('完整错误:', JSON.stringify(error, null, 2));
          console.error('═══════════════════════════════════════');
          
          // 特定错误处理
          let errorMessage = error.message;
          if (error.code === '42501') {
            errorMessage = 'RLS策略阻止：请确认您有权限添加链接';
          } else if (error.code === '23503') {
            errorMessage = '外键约束失败：分类不存在';
          } else if (error.code === '23505') {
            errorMessage = '链接已存在';
          }
          
          toast({
            title: '❌ 添加失败',
            description: `${errorMessage} (${error.code})`,
            variant: 'destructive',
          });
          
          throw new Error(errorMessage);
        }

        if (!data) {
          console.error('❌ [无返回数据] Insert成功但没有返回数据');
          throw new Error('插入失败：没有返回数据');
        }

        console.log('═══════════════════════════════════════');
        console.log('✅ [添加成功] 链接已创建');
        console.log('═══════════════════════════════════════');
        console.log('链接ID:', data.id);
        console.log('链接标题:', data.title);
        console.log('═══════════════════════════════════════');
        
        toast({
          title: '✅ 添加成功',
          description: `链接"${title}"已添加`,
        });

        resetForm();
        onOpenChange(false);
        
        // 延迟刷新确保数据同步
        setTimeout(() => {
          console.log('🔄 [刷新] 触发页面数据刷新...');
          onSuccess();
        }, 300);
      }
    } catch (error) {
      console.error('═══════════════════════════════════════');
      console.error('💥 [捕获异常] 顶层错误处理');
      console.error('═══════════════════════════════════════');
      console.error(error);
      console.error('═══════════════════════════════════════');
      
      const message = error instanceof Error ? error.message : '添加失败，请重试';
      toast({
        title: '❌ 操作失败',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setLinkType('web');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加链接</DialogTitle>
        </DialogHeader>
        
        {/* 调试信息 */}
        {showDebug && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-title">链接标题 *</Label>
            <Input
              id="link-title"
              placeholder="输入链接标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url">链接地址 *</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-desc">描述（可选）</Label>
            <Textarea
              id="link-desc"
              placeholder="简单描述这个链接"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>链接类型</Label>
            <RadioGroup 
              value={linkType} 
              onValueChange={(v: 'web' | 'miniprogram') => setLinkType(v)}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="web" id="web" />
                <Label htmlFor="web" className="cursor-pointer">网页链接</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="miniprogram" id="miniprogram" />
                <Label htmlFor="miniprogram" className="cursor-pointer">小程序路径</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="flex-1"
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-brand" 
              disabled={loading || !title.trim() || !url.trim()}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  添加中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  添加链接
                </>
              )}
            </Button>
          </div>
          
          {/* 调试按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="w-full text-xs text-muted-foreground"
          >
            {showDebug ? '隐藏' : '显示'}诊断信息
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
