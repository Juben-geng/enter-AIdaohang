import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIStream } from '@/hooks/useAIStream';
import { Loader2, MapPin, Sparkles, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AITools() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  // 检查会员权限
  const canUseAI = profile && ['basic', 'vip', 'city_agent', 'national_agent'].includes(profile.membership_type);

  // 行程规划
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState('');

  // 景点推荐
  const [location, setLocation] = useState('');
  const [preferences, setPreferences] = useState('');
  const [season, setSeason] = useState('');
  const [tripDays, setTripDays] = useState('');

  // 攻略生成
  const [guideDestination, setGuideDestination] = useState('');
  const [theme, setTheme] = useState('美食');

  const itineraryStream = useAIStream({ functionName: 'travel-itinerary-generator-cd290682288b' });
  const attractionStream = useAIStream({ functionName: 'attraction-recommender-cd290682288b' });
  const guideStream = useAIStream({ functionName: 'travel-guide-generator-cd290682288b' });

  const handleGenerateItinerary = () => {
    if (!canUseAI) {
      toast({
        title: '权限不足',
        description: '需要普通会员及以上才能使用AI功能',
        variant: 'destructive',
      });
      return;
    }

    if (!destination || !days || !budget || !interests) {
      toast({
        title: '信息不完整',
        description: '请填写所有必填项',
        variant: 'destructive',
      });
      return;
    }

    itineraryStream.generate({ destination, days, budget, interests });
  };

  const handleGenerateAttractions = () => {
    if (!canUseAI) {
      toast({
        title: '权限不足',
        description: '需要普通会员及以上才能使用AI功能',
        variant: 'destructive',
      });
      return;
    }

    if (!location || !preferences) {
      toast({
        title: '信息不完整',
        description: '请至少填写位置和偏好',
        variant: 'destructive',
      });
      return;
    }

    attractionStream.generate({ location, preferences, season, days: tripDays });
  };

  const handleGenerateGuide = () => {
    if (!canUseAI) {
      toast({
        title: '权限不足',
        description: '需要普通会员及以上才能使用AI功能',
        variant: 'destructive',
      });
      return;
    }

    if (!guideDestination) {
      toast({
        title: '信息不完整',
        description: '请输入目的地',
        variant: 'destructive',
      });
      return;
    }

    guideStream.generate({ destination: guideDestination, theme });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">AI旅游助手</h1>
            <p className="text-muted-foreground">让AI为您规划完美旅程</p>
          </div>
        </div>

        {!canUseAI && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">权限提示</CardTitle>
              <CardDescription>
                AI功能需要普通会员及以上权限。
                <Button variant="link" className="p-0 h-auto ml-2" onClick={() => navigate('/member')}>
                  立即升级
                </Button>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="itinerary">
              <MapPin className="w-4 h-4 mr-2" />
              行程规划
            </TabsTrigger>
            <TabsTrigger value="attractions">
              <Sparkles className="w-4 h-4 mr-2" />
              景点推荐
            </TabsTrigger>
            <TabsTrigger value="guide">
              <BookOpen className="w-4 h-4 mr-2" />
              攻略生成
            </TabsTrigger>
          </TabsList>

          {/* 行程规划 */}
          <TabsContent value="itinerary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI行程规划助手</CardTitle>
                <CardDescription>输入您的旅行需求，AI将为您量身定制详细行程</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destination">目的地 *</Label>
                    <Input
                      id="destination"
                      placeholder="例如：日本东京"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="days">旅行天数 *</Label>
                    <Input
                      id="days"
                      type="number"
                      placeholder="例如：5"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">预算范围 *</Label>
                    <Input
                      id="budget"
                      placeholder="例如：5000-8000元"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interests">兴趣偏好 *</Label>
                    <Input
                      id="interests"
                      placeholder="例如：美食、购物、文化"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateItinerary}
                  disabled={itineraryStream.isStreaming}
                  className="w-full bg-gradient-brand"
                >
                  {itineraryStream.isStreaming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成行程
                    </>
                  )}
                </Button>

                {itineraryStream.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                    {itineraryStream.error}
                  </div>
                )}

                {itineraryStream.content && (
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">生成的行程</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {itineraryStream.content}
                        {itineraryStream.isStreaming && (
                          <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 景点推荐 */}
          <TabsContent value="attractions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI景点推荐引擎</CardTitle>
                <CardDescription>基于您的偏好，智能推荐最适合的旅游景点</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">位置 *</Label>
                    <Input
                      id="location"
                      placeholder="例如：北京"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tripDays">游玩天数</Label>
                    <Input
                      id="tripDays"
                      type="number"
                      placeholder="例如：3"
                      value={tripDays}
                      onChange={(e) => setTripDays(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferences">偏好类型 *</Label>
                    <Input
                      id="preferences"
                      placeholder="例如：历史文化、自然风光"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="season">旅行季节</Label>
                    <Select value={season} onValueChange={setSeason}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择季节" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="春季">春季</SelectItem>
                        <SelectItem value="夏季">夏季</SelectItem>
                        <SelectItem value="秋季">秋季</SelectItem>
                        <SelectItem value="冬季">冬季</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateAttractions}
                  disabled={attractionStream.isStreaming}
                  className="w-full bg-gradient-brand"
                >
                  {attractionStream.isStreaming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      推荐中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      获取推荐
                    </>
                  )}
                </Button>

                {attractionStream.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                    {attractionStream.error}
                  </div>
                )}

                {attractionStream.content && (
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">景点推荐</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {attractionStream.content}
                        {attractionStream.isStreaming && (
                          <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 攻略生成 */}
          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI攻略生成器</CardTitle>
                <CardDescription>一键生成详尽的旅游攻略，从交通到美食全覆盖</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guideDestination">目的地 *</Label>
                    <Input
                      id="guideDestination"
                      placeholder="例如：成都"
                      value={guideDestination}
                      onChange={(e) => setGuideDestination(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">攻略主题</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="美食">美食</SelectItem>
                        <SelectItem value="购物">购物</SelectItem>
                        <SelectItem value="亲子">亲子</SelectItem>
                        <SelectItem value="文化">文化</SelectItem>
                        <SelectItem value="自然">自然</SelectItem>
                        <SelectItem value="摄影">摄影</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateGuide}
                  disabled={guideStream.isStreaming}
                  className="w-full bg-gradient-brand"
                >
                  {guideStream.isStreaming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      生成攻略
                    </>
                  )}
                </Button>

                {guideStream.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                    {guideStream.error}
                  </div>
                )}

                {guideStream.content && (
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">旅游攻略</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {guideStream.content}
                        {guideStream.isStreaming && (
                          <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
