import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function TestAuth() {
  const { user, profile } = useAuth();
  const [testEmail, setTestEmail] = useState('test' + Date.now() + '@example.com');
  const [testPassword, setTestPassword] = useState('test123456');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Array<{ name: string; status: 'success' | 'error' | 'pending'; message: string }>>([]);

  const addResult = (name: string, status: 'success' | 'error', message: string) => {
    setResults(prev => [...prev, { name, status, message }]);
  };

  const runFullTest = async () => {
    setResults([]);
    setTesting(true);

    try {
      // 1. 测试数据库连接
      addResult('数据库连接', 'pending', '测试中...');
      const { data: dbTest, error: dbError } = await supabase.from('profiles').select('count').limit(1);
      if (dbError) {
        addResult('数据库连接', 'error', dbError.message);
        setTesting(false);
        return;
      }
      addResult('数据库连接', 'success', '连接成功');

      // 2. 测试注册
      addResult('用户注册', 'pending', '注册中...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (signUpError) {
        addResult('用户注册', 'error', signUpError.message);
        setTesting(false);
        return;
      }

      if (!signUpData.user) {
        addResult('用户注册', 'error', '未返回用户信息');
        setTesting(false);
        return;
      }

      addResult('用户注册', 'success', `用户创建成功 (ID: ${signUpData.user.id.slice(0, 8)}...)`);

      // 3. 等待触发器创建profile
      addResult('Profile创建', 'pending', '等待触发器...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .maybeSingle();

      if (profileError) {
        addResult('Profile创建', 'error', profileError.message);
      } else if (profileData) {
        addResult('Profile创建', 'success', `Profile已创建 (会员类型: ${profileData.membership_type})`);
      } else {
        addResult('Profile创建', 'error', 'Profile未找到');
      }

      // 4. 测试登出
      addResult('用户登出', 'pending', '登出中...');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        addResult('用户登出', 'error', signOutError.message);
      } else {
        addResult('用户登出', 'success', '登出成功');
      }

      // 5. 测试登录
      addResult('用户登录', 'pending', '登录中...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        addResult('用户登录', 'error', signInError.message);
      } else if (signInData.user) {
        addResult('用户登录', 'success', `登录成功 (ID: ${signInData.user.id.slice(0, 8)}...)`);
        
        // 立即登出测试账号
        await supabase.auth.signOut();
      } else {
        addResult('用户登录', 'error', '未返回用户信息');
      }

      addResult('测试完成', 'success', '✅ 所有测试通过！');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addResult('测试失败', 'error', errorMessage);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🧪 注册登录功能测试</CardTitle>
            <CardDescription>
              自动测试注册、登录、Profile创建等功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">测试邮箱</label>
                <Input 
                  value={testEmail} 
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">测试密码</label>
                <Input 
                  type="password"
                  value={testPassword} 
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="至少6个字符"
                />
              </div>
            </div>

            <Button 
              onClick={runFullTest} 
              disabled={testing || !testEmail || !testPassword}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  测试进行中...
                </>
              ) : (
                '🚀 开始完整测试'
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card border"
                  >
                    {result.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
                    {result.status === 'pending' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {user && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">当前登录状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>用户ID:</strong> {user.id}</div>
              <div><strong>邮箱:</strong> {user.email}</div>
              <div><strong>会员类型:</strong> {profile?.membership_type || '加载中...'}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
