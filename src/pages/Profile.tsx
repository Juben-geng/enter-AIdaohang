import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    city: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        phone: profile.phone || '',
        city: profile.city || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: '错误',
        description: '请先登录',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username.trim() || null,
          phone: formData.phone.trim() || null,
          city: formData.city.trim() || null,
          avatar_url: formData.avatar_url.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // 刷新profile数据
      await refreshProfile();

      toast({
        title: '✅ 保存成功',
        description: '个人资料已更新',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: '❌ 保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMembershipInfo = () => {
    const typeMap: Record<string, { name: string; color: string; icon: string }> = {
      free: { name: '免费会员', color: 'bg-gray-500', icon: '🆓' },
      basic: { name: '普通会员', color: 'bg-blue-500', icon: '📦' },
      vip: { name: 'VIP会员', color: 'bg-purple-500', icon: '👑' },
      city_agent: { name: '城市代理', color: 'bg-orange-500', icon: '🌆' },
      national_agent: { name: '国家代理', color: 'bg-red-500', icon: '🏛️' },
    };

    return typeMap[profile?.membership_type || 'free'] || typeMap.free;
  };

  const membershipInfo = getMembershipInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Button>

        <div className="space-y-6">
          {/* 头部信息卡片 */}
          <Card className="bg-gradient-brand text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="头像" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{formData.username || '未设置昵称'}</h1>
                  <p className="text-white/80 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${membershipInfo.color} border-0`}>
                      {membershipInfo.icon} {membershipInfo.name}
                    </Badge>
                    {profile?.membership_expires_at && (
                      <span className="text-sm text-white/80">
                        有效期至 {new Date(profile.membership_expires_at).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 管理员权限说明（仅国家代理显示） */}
          {profile?.membership_type === 'national_agent' && (
            <Card className="border-2 border-red-500/20 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-red-600">管理员权限</CardTitle>
                </div>
                <CardDescription>您拥有系统最高权限，可以访问以下管理功能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2 p-3 bg-background rounded-lg">
                    <span className="text-xl">👥</span>
                    <div>
                      <h4 className="font-semibold">用户管理</h4>
                      <p className="text-sm text-muted-foreground">查看所有用户、修改权限、初始化数据</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-background rounded-lg">
                    <span className="text-xl">🔧</span>
                    <div>
                      <h4 className="font-semibold">系统配置</h4>
                      <p className="text-sm text-muted-foreground">管理系统设置、功能开关、备案信息</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-background rounded-lg">
                    <span className="text-xl">🌐</span>
                    <div>
                      <h4 className="font-semibold">导航广场审核</h4>
                      <p className="text-sm text-muted-foreground">审核用户投放的链接，查看浏览统计</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-background rounded-lg">
                    <span className="text-xl">📊</span>
                    <div>
                      <h4 className="font-semibold">数据统计</h4>
                      <p className="text-sm text-muted-foreground">查看平台数据、用户活跃度、收益报表</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={() => navigate('/admin-panel')} 
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    进入后台管理
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 编辑个人资料 */}
          <Card>
            <CardHeader>
              <CardTitle>编辑个人资料</CardTitle>
              <CardDescription>完善您的个人信息，让其他用户更了解您</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    <User className="w-4 h-4 inline mr-2" />
                    昵称
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="请输入昵称"
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground">将在个人主页和评论中显示</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    手机号码
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入手机号"
                    maxLength={11}
                  />
                  <p className="text-sm text-muted-foreground">用于账号安全验证和重要通知</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    所在城市
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="例如：深圳市"
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground">帮助我们为您推荐本地化内容</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">头像URL（可选）</Label>
                  <Input
                    id="avatar_url"
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-sm text-muted-foreground">支持 JPG、PNG、GIF 格式</p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? '保存中...' : '保存更改'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/member')}
                  >
                    会员中心
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 账号信息 */}
          <Card>
            <CardHeader>
              <CardTitle>账号信息</CardTitle>
              <CardDescription>您的账号相关数据</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">注册时间</span>
                <span className="font-medium">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('zh-CN') : '未知'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">邀请码</span>
                <span className="font-mono font-bold text-primary">{profile?.referral_code || '未设置'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">用户ID</span>
                <span className="font-mono text-xs">{user?.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
