import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Link2, Sparkles } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(email, password, referralCode || undefined);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败，请重试';
      
      // 检查是否是用户已存在的错误
      if (message.includes('already registered') || message.includes('already exists')) {
        toast({
          title: '该邮箱已注册',
          description: '请直接登录或使用其他邮箱注册',
          variant: 'destructive',
        });
        // 自动切换到登录页面
        setTimeout(() => setActiveTab('signin'), 2000);
      } else {
        toast({
          title: '注册失败',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败，请重试';
      toast({
        title: '登录失败',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary-light/10 to-secondary/10 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-brand rounded-xl">
              <Link2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text">智联导航中心</h1>
          <p className="text-muted-foreground">让您的导航更智能，让您的分享更便捷</p>
        </div>

        <Card className="animate-fade-in border-2">
          <CardHeader>
            <CardTitle>欢迎使用</CardTitle>
            <CardDescription>登录或注册开始管理您的导航</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">登录</TabsTrigger>
                <TabsTrigger value="signup">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">邮箱</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">密码</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-brand" disabled={loading}>
                    {loading ? '登录中...' : '登录'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">邮箱</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">密码</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-code">邀请码（可选）</Label>
                    <Input
                      id="referral-code"
                      type="text"
                      placeholder="输入邀请码获取奖励"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-brand" disabled={loading}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {loading ? '注册中...' : '立即注册'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}