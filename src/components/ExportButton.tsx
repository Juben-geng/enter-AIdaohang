import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, exportToJSON } from '@/lib/export';

interface ExportButtonProps {
  categoryId?: string; // 如果提供，导出特定分类；否则导出所有
  variant?: 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg';
}

export default function ExportButton({ categoryId, variant = 'outline', size = 'sm' }: ExportButtonProps) {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // 判断用户权限
  const canExportAll = ['vip', 'city_agent', 'national_agent'].includes(profile?.membership_type || '');
  const canExportCurrent = profile?.membership_type !== null; // 所有注册用户都可以导出当前

  const handleExport = async () => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '需要登录后才能导出数据',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let categories, links;

      if (categoryId) {
        // 导出特定分类
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        const { data: linkData } = await supabase
          .from('links')
          .select('*')
          .eq('category_id', categoryId);

        categories = catData ? [catData] : [];
        links = linkData || [];
      } else {
        // 导出所有
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');

        const { data: linkData } = await supabase
          .from('links')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');

        categories = catData || [];
        links = linkData || [];
      }

      // 导出为CSV
      exportToCSV({ categories, links }, categoryId ? '分类数据' : '所有数据');

      // 记录导出日志
      await supabase.from('export_logs').insert({
        user_id: user.id,
        export_type: categoryId ? 'current' : 'all',
        category_id: categoryId || null,
        export_count: links.length,
      });

      toast({
        title: '导出成功',
        description: `已导出 ${categories.length} 个分类，${links.length} 个链接`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: '导出失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 未登录用户不显示
  if (!user) return null;

  // 根据权限显示不同按钮
  if (categoryId && !canExportCurrent) return null;
  if (!categoryId && !canExportAll) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          导出中...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {categoryId ? '导出链接' : '导出所有'}
        </>
      )}
    </Button>
  );
}