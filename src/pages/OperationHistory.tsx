import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Trash2, RotateCcw, Plus, Edit, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface HistoryItem {
  id: string;
  operation_type: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  can_restore: boolean;
}

export default function OperationHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('operation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Fetch history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('operation_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: '✅ 清除成功',
        description: '操作历史已清空',
      });

      setHistory([]);
      setClearDialogOpen(false);
    } catch (error) {
      console.error('Clear history error:', error);
      toast({
        title: '❌ 清除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const getActionIcon = (operationType: string) => {
    switch (operationType) {
      case 'create':
        return <Plus className="w-4 h-4" />;
      case 'update':
        return <Edit className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionText = (operationType: string) => {
    const actionMap: Record<string, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      export: '导出',
      import: '导入',
      restore: '还原',
    };
    return actionMap[operationType] || operationType;
  };

  const getEntityTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      link: '链接',
      category: '分类',
      customer: '客户',
      order: '订单',
      trip: '行程',
    };
    return typeMap[type] || type;
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
                    <History className="w-6 h-6" />
                    操作历史
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    查看最近100条操作记录
                  </p>
                </div>
                {history.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setClearDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空历史
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 历史记录 */}
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  加载中...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">暂无操作历史</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    您的操作记录将显示在这里
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {getActionIcon(item.operation_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {getActionText(item.operation_type)}
                          </Badge>
                          <Badge variant="secondary">
                            {getEntityTypeText(item.entity_type)}
                          </Badge>
                          {item.can_restore && (
                            <Badge className="bg-green-600">可还原</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold truncate mb-1">
                          {item.new_data?.name || item.new_data?.title || item.old_data?.name || item.old_data?.title || '未知'}
                        </h3>
                        {(item.old_data || item.new_data) && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {item.operation_type === 'update' && item.old_data && (
                              <p className="line-clamp-1">
                                <span className="text-destructive">旧值:</span> {JSON.stringify(item.old_data).slice(0, 100)}
                              </p>
                            )}
                            {item.new_data && (
                              <p className="line-clamp-1">
                                <span className="text-green-600">新值:</span> {JSON.stringify(item.new_data).slice(0, 100)}
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(item.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      {item.can_restore && item.operation_type === 'delete' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              title: '还原功能',
                              description: '还原功能将在下个版本推出',
                            });
                          }}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          还原
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 清空确认对话框 */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空历史记录？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有操作历史记录，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-destructive hover:bg-destructive/90"
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
