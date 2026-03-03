import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemConfig {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  description: string;
}

export default function SystemConfig() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .order('key');

    if (!error && data) {
      setConfigs(data);
    }
    setLoading(false);
  };

  const updateConfig = async (key: string, value: string | number | boolean | Record<string, unknown>) => {
    const { error } = await supabase
      .from('system_configs')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSaveAll = async () => {
    setSaving(true);

    try {
      for (const config of configs) {
        await updateConfig(config.key, config.value);
      }

      toast({
        title: '保存成功',
        description: '所有配置已更新',
      });

      fetchConfigs();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: '保存失败',
        description: '部分配置保存失败',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: string | number | boolean | Record<string, unknown>) => {
    setConfigs((prev) =>
      prev.map((config) =>
        config.key === key ? { ...config, value } : config
      )
    );
  };

  const getConfigValue = (key: string): string | number | boolean | Record<string, unknown> | undefined => {
    const config = configs.find((c) => c.key === key);
    return config?.value;
  };

  const setConfigValue = (key: string, value: string | number | boolean | Record<string, unknown>) => {
    handleConfigChange(key, value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">系统配置</h1>
          <p className="text-muted-foreground mt-1">管理系统全局设置，更改将实时同步到前端</p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving} className="bg-gradient-brand">
          <Save className="w-4 h-4 mr-2" />
          {saving ? '保存中...' : '保存所有更改'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">基础设置</TabsTrigger>
          <TabsTrigger value="features">功能开关</TabsTrigger>
          <TabsTrigger value="company">公司信息</TabsTrigger>
        </TabsList>

        {/* 基础设置 */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>匿名用户设置</CardTitle>
              <CardDescription>控制匿名用户的使用限制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_anonymous_usage">最大使用次数</Label>
                <Input
                  id="max_anonymous_usage"
                  type="number"
                  value={getConfigValue('max_anonymous_usage') || 10}
                  onChange={(e) => setConfigValue('max_anonymous_usage', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  匿名用户在需要登录前可以使用的次数
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>导航版本切换</CardTitle>
              <CardDescription>配置简洁版本的相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="version_switch">启用版本切换</Label>
                  <p className="text-sm text-muted-foreground">
                    允许用户在新版和简洁版之间切换
                  </p>
                </div>
                <Switch
                  id="version_switch"
                  checked={getConfigValue('version_switch_enabled') === 'true' || getConfigValue('version_switch_enabled') === true}
                  onCheckedChange={(checked) => setConfigValue('version_switch_enabled', checked.toString())}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="simple_version_url">简洁版URL</Label>
                <Input
                  id="simple_version_url"
                  value={getConfigValue('simple_version_url')?.replace(/"/g, '') || ''}
                  onChange={(e) => setConfigValue('simple_version_url', `"${e.target.value}"`)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_real_domain">显示真实域名</Label>
                  <p className="text-sm text-muted-foreground">
                    在前端显示简洁版的真实域名
                  </p>
                </div>
                <Switch
                  id="show_real_domain"
                  checked={getConfigValue('show_real_domain') === 'true' || getConfigValue('show_real_domain') === true}
                  onCheckedChange={(checked) => setConfigValue('show_real_domain', checked.toString())}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 功能开关 */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>功能模块开关</CardTitle>
              <CardDescription>控制各功能模块的启用状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <Label htmlFor="tutorial">首页演示教程</Label>
                  <p className="text-sm text-muted-foreground">
                    新用户首次访问时显示功能演示视频
                  </p>
                </div>
                <Switch
                  id="tutorial"
                  checked={getConfigValue('tutorial_enabled') === 'true' || getConfigValue('tutorial_enabled') === true}
                  onCheckedChange={(checked) => setConfigValue('tutorial_enabled', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <Label htmlFor="navigation_square">导航广场</Label>
                  <p className="text-sm text-muted-foreground">
                    用户可以在导航广场投放和浏览链接
                  </p>
                </div>
                <Switch
                  id="navigation_square"
                  checked={getConfigValue('navigation_square_enabled') === 'true' || getConfigValue('navigation_square_enabled') === true}
                  onCheckedChange={(checked) => setConfigValue('navigation_square_enabled', checked.toString())}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 公司信息 */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>备案信息</CardTitle>
              <CardDescription>网站底部显示的备案信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="beian_number">ICP备案号</Label>
                <Input
                  id="beian_number"
                  value={getConfigValue('beian_number')?.replace(/"/g, '') || ''}
                  onChange={(e) => setConfigValue('beian_number', `"${e.target.value}"`)}
                  placeholder="粤ICP备2023013740号-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beian_police">公安备案号</Label>
                <Input
                  id="beian_police"
                  value={getConfigValue('beian_police')?.replace(/"/g, '') || ''}
                  onChange={(e) => setConfigValue('beian_police', `"${e.target.value}"`)}
                  placeholder="粤公网安备44030902003810号"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>公司信息</CardTitle>
              <CardDescription>底部显示的公司详细信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">公司名称</Label>
                <Input
                  id="company_name"
                  value={getConfigValue('company_info')?.name || ''}
                  onChange={(e) => {
                    const companyInfo = getConfigValue('company_info') || {};
                    setConfigValue('company_info', { ...companyInfo, name: e.target.value });
                  }}
                  placeholder="番茄智能(深圳)科技有限公司"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone">联系电话</Label>
                <Input
                  id="company_phone"
                  value={getConfigValue('company_info')?.phone || ''}
                  onChange={(e) => {
                    const companyInfo = getConfigValue('company_info') || {};
                    setConfigValue('company_info', { ...companyInfo, phone: e.target.value });
                  }}
                  placeholder="0755-36624540"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_slogan">宣传语</Label>
                <Input
                  id="company_slogan"
                  value={getConfigValue('company_info')?.slogan || ''}
                  onChange={(e) => {
                    const companyInfo = getConfigValue('company_info') || {};
                    setConfigValue('company_info', { ...companyInfo, slogan: e.target.value });
                  }}
                  placeholder="让每个人都能拥有自己的个人导航页"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}