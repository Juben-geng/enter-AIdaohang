import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RotateCcw, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  description: string | null;
}

export default function SystemConfigManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [maxWeekly, setMaxWeekly] = useState('2');
  const [intervalDays, setIntervalDays] = useState('3');

  const isAdmin = profile?.membership_type === 'national_agent';

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .in('config_key', ['profession_popup_max_weekly', 'profession_popup_interval_days']);

      if (error) throw error;

      setConfigs(data || []);
      
      // 设置当前值
      const weeklyConfig = data?.find(c => c.config_key === 'profession_popup_max_weekly');
      const intervalConfig = data?.find(c => c.config_key === 'profession_popup_interval_days');
      
      if (weeklyConfig) setMaxWeekly(weeklyConfig.config_value);
      if (intervalConfig) setIntervalDays(intervalConfig.config_value);
    } catch (error) {
      console.error('Fetch configs error:', error);
      toast({
        title: '加载失败',
        description: '无法加载系统配置',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: '权限不足',
        description: '仅管理员可以修改系统配置',
        variant: 'destructive',
      });
      return;
    }

    // 验证输入
    const weeklyNum = parseInt(maxWeekly);
    const intervalNum = parseInt(intervalDays);

    if (isNaN(weeklyNum) || weeklyNum < 0 || weeklyNum > 10) {
      toast({
        title: '输入错误',
        description: '每周显示次数必须在0-10之间',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(intervalNum) || intervalNum < 1 || intervalNum > 30) {
      toast({
        title: '输入错误',
        description: '间隔天数必须在1-30之间',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // 更新配置
      const updates = [
        {
          config_key: 'profession_popup_max_weekly',
          config_value: maxWeekly,
          updated_at: new Date().toISOString(),
        },
        {
          config_key: 'profession_popup_interval_days',
          config_value: intervalDays,
          updated_at: new Date().toISOString(),
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_config')
          .update(update)
          .eq('config_key', update.config_key);

        if (error) throw error;
      }

      toast({
        title: '✅ 保存成功',
        description: '系统配置已更新',
      });

      fetchConfigs();
    } catch (error) {
      console.error('Save configs error:', error);
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMaxWeekly('2');
    setIntervalDays('3');
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">权限不足</h2>
            <p className="text-muted-foreground">
              仅管理员可以访问系统配置
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8" />
          系统配置管理
        </h1>
        <p className="text-muted-foreground mt-2">
          管理系统全局配置参数
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">加载中...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 职业标签弹窗配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">用户体验</Badge>
                职业标签弹窗设置
              </CardTitle>
              <CardDescription>
                控制职业标签选择弹窗的显示频率，避免过度打扰用户
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 每周最多显示次数 */}
              <div className="space-y-2">
                <Label htmlFor="maxWeekly" className="flex items-center gap-2">
                  每周最多显示次数
                  <Badge variant="secondary" className="text-xs">
                    当前: {maxWeekly}次/周
                  </Badge>
                </Label>
                <Input
                  id="maxWeekly"
                  type="number"
                  min="0"
                  max="10"
                  value={maxWeekly}
                  onChange={(e) => setMaxWeekly(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    未选择职业标签的用户，在一周内最多显示该弹窗的次数。
                    设置为0则完全禁用弹窗。
                    <br />
                    <strong className="text-foreground">建议值：1-2次</strong>（避免频繁打扰）
                  </span>
                </p>
              </div>

              {/* 最小间隔天数 */}
              <div className="space-y-2">
                <Label htmlFor="intervalDays" className="flex items-center gap-2">
                  最小间隔天数
                  <Badge variant="secondary" className="text-xs">
                    当前: {intervalDays}天
                  </Badge>
                </Label>
                <Input
                  id="intervalDays"
                  type="number"
                  min="1"
                  max="30"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    两次弹窗显示之间必须间隔的最少天数。即使未达到每周最大次数，
                    也需要等待指定天数后才会再次显示。
                    <br />
                    <strong className="text-foreground">建议值：3-7天</strong>（给用户足够的缓冲期）
                  </span>
                </p>
              </div>

              {/* 示例说明 */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  当前配置下的行为
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>新用户首次登录：立即显示弹窗</li>
                  <li>用户点击"稍后再说"或关闭：记录为1次显示</li>
                  <li>
                    下次显示时间：至少{intervalDays}天后，且本周显示次数少于{maxWeekly}次
                  </li>
                  <li>用户选择标签后：永久不再显示</li>
                  <li>
                    示例：设置2次/周 + 3天间隔，则用户最多在第1天、第4天看到弹窗，
                    第8天开始新的一周计数
                  </li>
                </ul>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : '保存配置'}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  恢复默认值
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 配置历史提示 */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    配置修改注意事项
                  </p>
                  <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc ml-4">
                    <li>配置修改后立即生效，影响所有用户</li>
                    <li>已选择职业标签的用户不受影响（不再显示弹窗）</li>
                    <li>建议在非高峰期修改配置</li>
                    <li>修改记录会被自动保存，可追溯</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
