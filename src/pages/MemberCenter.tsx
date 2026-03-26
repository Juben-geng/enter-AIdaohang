import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Crown, Sparkles, Zap, Share2, Check } from 'lucide-react';

const MEMBERSHIP_TIERS = [
  {
    id: 'free',
    name: '免费会员',
    price: '¥0',
    period: '永久',
    features: [
      '10个自定义分类',
      '20个链接',
      '导出当前链接',
      '本地数据存储',
    ],
    icon: Sparkles,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  {
    id: 'basic',
    name: '普通会员',
    price: '¥1.9',
    period: '/月',
    quarterlyPrice: '¥9.9',
    features: [
      '20个自定义分类',
      '每分类5个链接',
      '拖拽排序',
      '搜索功能',
      '还原功能',
      '历史记录',
      '导出当前链接',
    ],
    icon: Check,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    popular: false,
  },
  {
    id: 'vip',
    name: 'VIP会员',
    price: '¥19.9',
    period: '/年',
    features: [
      '普通会员所有功能',
      '50个自定义分类',
      '每分类10个链接',
      'AI行程规划助手',
      'AI编程助手',
      'AI视频生成',
      'AI文生图',
      '导出所有链接',
    ],
    icon: Crown,
    color: 'text-secondary',
    bgColor: 'bg-gradient-brand',
    popular: true,
  },
  {
    id: 'city_agent',
    name: '城市代理',
    price: '¥199',
    period: '/永久',
    features: [
      'VIP会员所有功能',
      '无限分类数量',
      '每分类最多999个链接',
      '分享收益50%',
      '分享统计数据',
      '导出所有链接',
      '优先客服支持',
      '申请表单功能',
    ],
    icon: Share2,
    color: 'text-accent',
    bgColor: 'bg-gradient-accent',
    popular: false,
  },
];

export default function MemberCenter() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const getCurrentTier = () => {
    return MEMBERSHIP_TIERS.find((tier) => tier.id === profile?.membership_type) || MEMBERSHIP_TIERS[0];
  };

  const currentTier = getCurrentTier();
  const Icon = currentTier.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold gradient-text">会员中心</h1>
          </div>
          
          <Card className="bg-gradient-brand text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentTier.name}</h2>
                    <p className="text-white/80">
                      当前会员等级 {profile?.membership_expires_at && `· 有效期至 ${new Date(profile.membership_expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                {profile?.referral_code && (
                  <div className="text-right">
                    <p className="text-sm text-white/80">我的邀请码</p>
                    <p className="text-2xl font-bold tracking-wider">{profile.referral_code}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">选择会员方案</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MEMBERSHIP_TIERS.map((tier) => {
              const TierIcon = tier.icon;
              const isCurrentTier = tier.id === profile?.membership_type;
              
              return (
                <Card
                  key={tier.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                    tier.popular ? 'border-primary shadow-lg' : ''
                  } ${isCurrentTier ? 'ring-2 ring-primary' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-tl-none rounded-br-none bg-gradient-brand border-0">
                        推荐
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${tier.bgColor} flex items-center justify-center mb-4`}>
                      <TierIcon className={`w-6 h-6 ${tier.color}`} />
                    </div>
                    <CardTitle>{tier.name}</CardTitle>
                    <div className="space-y-1 mt-2">
                      <div>
                        <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                      {tier.quarterlyPrice && (
                        <div className="text-sm">
                          <span className="text-lg font-semibold text-foreground">{tier.quarterlyPrice}</span>
                          <span className="text-muted-foreground">/季</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {isCurrentTier ? (
                      <Button className="w-full" variant="outline" disabled>
                        当前方案
                      </Button>
                    ) : tier.id === 'free' ? (
                      <Button className="w-full" variant="outline" disabled>
                        默认方案
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${tier.popular ? 'bg-gradient-brand' : ''}`}
                        onClick={() => {
                          // TODO: 实现支付逻辑
                          alert('支付功能即将上线');
                        }}
                      >
                        立即升级
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>社交裂变计划</CardTitle>
            <CardDescription>邀请好友注册，获得丰厚奖励</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-primary-light border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">免费会员</h4>
                  <p className="text-sm text-muted-foreground">
                    邀请5位好友注册，获得1个月普通会员
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-secondary/10 border-secondary/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">普通会员</h4>
                  <p className="text-sm text-muted-foreground">
                    邀请1位付费会员，双方各得1个月普通会员
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-accent/10 border-accent/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">城市代理</h4>
                  <p className="text-sm text-muted-foreground">
                    好友付费后返现50%，无限收益
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {profile?.referral_code && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">您的专属邀请链接：</p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/auth?ref=${profile.referral_code}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/auth?ref=${profile.referral_code}`
                      );
                      alert('已复制到剪贴板');
                    }}
                  >
                    复制
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}