import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIStream } from '@/hooks/useAIStream';
import { Loader2, MapPin, Sparkles, BookOpen, ArrowLeft, Image, Video, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

export default function AITools() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

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

  // 图片生成
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageRatio, setImageRatio] = useState('16:9');
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string }>>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  // 视频生成
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState('2');
  const [videoRatio, setVideoRatio] = useState('16:9');
  const [generatedVideos, setGeneratedVideos] = useState<Array<{ url: string }>>([]);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [videoProgress, setVideoProgress] = useState('');
  const cancelledRef = useRef(false);

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
        title: '请填写完整信息',
        description: '所有字段都是必填的',
        variant: 'destructive',
      });
      return;
    }

    itineraryStream.generate({
      destination,
      days,
      budget,
      interests,
    });
  };

  const handleRecommendAttractions = () => {
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
        title: '请填写完整信息',
        description: '位置和偏好是必填的',
        variant: 'destructive',
      });
      return;
    }

    attractionStream.generate({
      location,
      preferences,
      season,
      days: tripDays,
    });
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

    if (!guideDestination || !theme) {
      toast({
        title: '请填写完整信息',
        description: '目的地和主题是必填的',
        variant: 'destructive',
      });
      return;
    }

    guideStream.generate({
      destination: guideDestination,
      theme,
    });
  };

  const handleGenerateImage = async () => {
    if (!canUseAI) {
      toast({
        title: '权限不足',
        description: '需要VIP会员及以上才能使用AI图片生成',
        variant: 'destructive',
      });
      return;
    }

    if (!imagePrompt.trim()) {
      toast({
        title: '请输入描述',
        description: '请描述您想生成的图片',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingImage(true);
    setImageError('');
    setGeneratedImages([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-image-generator-cd290682288b', {
        body: {
          prompt: imagePrompt.trim(),
          type: 'txt_2_img',
          ratio: imageRatio,
          resolution: '2k',
          format: 'png',
        },
      });

      if (error) throw error;

      if (data?.success && data?.images) {
        setGeneratedImages(data.images);
        toast({
          title: '生成成功',
          description: `成功生成 ${data.images.length} 张图片`,
        });
      } else {
        throw new Error(data?.message || '图片生成失败');
      }
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || '图片生成失败，请重试';
      setImageError(errorMessage);
      toast({
        title: '生成失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!canUseAI) {
      toast({
        title: '权限不足',
        description: '需要VIP会员及以上才能使用AI视频生成',
        variant: 'destructive',
      });
      return;
    }

    if (!videoPrompt.trim()) {
      toast({
        title: '请输入描述',
        description: '请描述您想生成的视频内容',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError('');
    setGeneratedVideos([]);
    setVideoProgress('提交生成任务中...');
    cancelledRef.current = false;

    try {
      // 步骤1：提交任务
      const { data: submitData, error: submitError } = await supabase.functions.invoke('ai-video-submit-cd290682288b', {
        body: {
          prompt: videoPrompt.trim(),
          type: 'txt_2_video',
          ratio: videoRatio,
          duration: parseInt(videoDuration),
          format: 'mp4',
        },
      });

      if (submitError) throw submitError;

      if (!submitData?.success || !submitData?.task_id) {
        throw new Error(submitData?.message || '任务提交失败');
      }

      const taskId = submitData.task_id;
      setVideoProgress('视频生成中，请耐心等待...');

      // 步骤2：轮询状态
      const maxAttempts = 60;
      const pollInterval = 15000; // 15秒

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelledRef.current) {
          throw new Error('已取消生成');
        }

        await new Promise(r => setTimeout(r, pollInterval));
        
        setVideoProgress(`生成视频中... (${attempt}/${maxAttempts})`);

        const { data: statusData, error: statusError } = await supabase.functions.invoke('ai-video-status-cd290682288b', {
          body: { task_id: taskId },
        });

        if (statusError) throw statusError;

        if (statusData?.status === 'succeed') {
          setGeneratedVideos(statusData.videos || []);
          setVideoProgress('');
          toast({
            title: '生成成功',
            description: `成功生成 ${statusData.videos?.length || 0} 个视频`,
          });
          return;
        }

        if (statusData?.status === 'failed') {
          throw new Error(statusData.message || '视频生成失败');
        }
      }

      throw new Error('生成超时，请重试');
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || '视频生成失败，请重试';
      setVideoError(errorMessage);
      setVideoProgress('');
      toast({
        title: '生成失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ai-image-${Date.now()}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast({
        title: '下载失败',
        description: '无法下载图片，请重试',
        variant: 'destructive',
      });
    }
  };

  const downloadVideo = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ai-video-${Date.now()}-${index + 1}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast({
        title: '下载失败',
        description: '无法下载视频，请重试',
        variant: 'destructive',
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录才能使用AI功能</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              前往登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canUseAI) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>权限不足</CardTitle>
            <CardDescription>AI功能需要普通会员及以上</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              升级会员即可使用：
            </p>
            <ul className="text-sm space-y-2">
              <li>✅ AI行程规划</li>
              <li>✅ AI景点推荐</li>
              <li>✅ AI攻略生成</li>
              <li>✅ AI图片生成（VIP+）</li>
              <li>✅ AI视频生成（VIP+）</li>
            </ul>
            <Button onClick={() => navigate('/member')} className="w-full">
              升级会员
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">AI助手</h1>
          <p className="text-muted-foreground">AI赋能旅游，让规划更智能</p>
        </div>

        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
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
            <TabsTrigger value="image">
              <Image className="w-4 h-4 mr-2" />
              图片生成
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="w-4 h-4 mr-2" />
              视频生成
            </TabsTrigger>
          </TabsList>

          {/* 行程规划 */}
          <TabsContent value="itinerary">
            <Card>
              <CardHeader>
                <CardTitle>AI行程规划助手</CardTitle>
                <CardDescription>告诉我您的旅行需求，AI为您定制专属行程</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destination">目的地</Label>
                    <Input
                      id="destination"
                      placeholder="如：日本东京"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      disabled={itineraryStream.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="days">旅行天数</Label>
                    <Input
                      id="days"
                      placeholder="如：5"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      disabled={itineraryStream.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">预算范围（元）</Label>
                    <Input
                      id="budget"
                      placeholder="如：8000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      disabled={itineraryStream.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interests">兴趣偏好</Label>
                    <Input
                      id="interests"
                      placeholder="如：美食、购物"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      disabled={itineraryStream.isLoading}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateItinerary} 
                  disabled={itineraryStream.isLoading}
                  className="w-full bg-gradient-brand"
                >
                  {itineraryStream.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成行程'
                  )}
                </Button>

                {itineraryStream.content && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {itineraryStream.content}
                      {itineraryStream.isLoading && (
                        <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                )}

                {itineraryStream.error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {itineraryStream.error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 景点推荐 */}
          <TabsContent value="attractions">
            <Card>
              <CardHeader>
                <CardTitle>AI景点推荐引擎</CardTitle>
                <CardDescription>基于您的偏好，推荐最适合的景点</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">位置</Label>
                    <Input
                      id="location"
                      placeholder="如：北京"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={attractionStream.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferences">偏好类型</Label>
                    <Input
                      id="preferences"
                      placeholder="如：历史文化、自然风光"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      disabled={attractionStream.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="season">旅行季节（可选）</Label>
                    <Input
                      id="season"
                      placeholder="如：秋季"
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      disabled={attractionStream.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tripDays">游玩天数（可选）</Label>
                    <Input
                      id="tripDays"
                      placeholder="如：3"
                      value={tripDays}
                      onChange={(e) => setTripDays(e.target.value)}
                      disabled={attractionStream.isLoading}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleRecommendAttractions} 
                  disabled={attractionStream.isLoading}
                  className="w-full bg-gradient-brand"
                >
                  {attractionStream.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      推荐中...
                    </>
                  ) : (
                    '获取推荐'
                  )}
                </Button>

                {attractionStream.content && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {attractionStream.content}
                      {attractionStream.isLoading && (
                        <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                )}

                {attractionStream.error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {attractionStream.error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 攻略生成 */}
          <TabsContent value="guide">
            <Card>
              <CardHeader>
                <CardTitle>AI攻略生成器</CardTitle>
                <CardDescription>生成详细的旅游攻略，包含吃住行玩全方位信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guideDestination">目的地</Label>
                    <Input
                      id="guideDestination"
                      placeholder="如：成都"
                      value={guideDestination}
                      onChange={(e) => setGuideDestination(e.target.value)}
                      disabled={guideStream.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">攻略主题</Label>
                    <Select value={theme} onValueChange={setTheme} disabled={guideStream.isLoading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="美食">美食</SelectItem>
                        <SelectItem value="文化">文化</SelectItem>
                        <SelectItem value="自然">自然</SelectItem>
                        <SelectItem value="亲子">亲子</SelectItem>
                        <SelectItem value="浪漫">浪漫</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateGuide} 
                  disabled={guideStream.isLoading}
                  className="w-full bg-gradient-brand"
                >
                  {guideStream.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成攻略'
                  )}
                </Button>

                {guideStream.content && (
                  <div className="mt-6 p-4 bg-muted rounded-lg max-h-[600px] overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {guideStream.content}
                      {guideStream.isLoading && (
                        <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                )}

                {guideStream.error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {guideStream.error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI图片生成 */}
          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle>AI图片生成</CardTitle>
                <CardDescription>描述您想要的图片，AI为您创作</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imagePrompt">图片描述</Label>
                  <Textarea
                    id="imagePrompt"
                    placeholder="详细描述您想生成的图片，如：一张夕阳下的海滩，椰树摇曳，海浪轻拍沙滩..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    disabled={isGeneratingImage}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageRatio">画面比例</Label>
                    <Select value={imageRatio} onValueChange={setImageRatio} disabled={isGeneratingImage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (正方形)</SelectItem>
                        <SelectItem value="16:9">16:9 (横屏)</SelectItem>
                        <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                        <SelectItem value="4:3">4:3 (标准)</SelectItem>
                        <SelectItem value="3:4">3:4 (竖版)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateImage} 
                  disabled={isGeneratingImage}
                  className="w-full bg-gradient-brand"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成图片'
                  )}
                </Button>

                {imageError && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {imageError}
                  </div>
                )}

                {generatedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {generatedImages.map((img, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden border">
                        <img src={img.url} alt={`生成的图片 ${index + 1}`} className="w-full h-auto" />
                        <Button
                          onClick={() => downloadImage(img.url, index)}
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          下载
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI视频生成 */}
          <TabsContent value="video">
            <Card>
              <CardHeader>
                <CardTitle>AI视频生成</CardTitle>
                <CardDescription>描述您想要的视频内容，AI为您创作动态视频</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoPrompt">视频描述</Label>
                  <Textarea
                    id="videoPrompt"
                    placeholder="详细描述您想生成的视频内容，如：一段旅游宣传片，展示海边日出，浪花拍岸..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    disabled={isGeneratingVideo}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoDuration">时长（秒）</Label>
                    <Select value={videoDuration} onValueChange={setVideoDuration} disabled={isGeneratingVideo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2秒</SelectItem>
                        <SelectItem value="3">3秒</SelectItem>
                        <SelectItem value="4">4秒</SelectItem>
                        <SelectItem value="5">5秒</SelectItem>
                        <SelectItem value="6">6秒</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoRatio">画面比例</Label>
                    <Select value={videoRatio} onValueChange={setVideoRatio} disabled={isGeneratingVideo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (横屏)</SelectItem>
                        <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                        <SelectItem value="1:1">1:1 (正方形)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateVideo} 
                  disabled={isGeneratingVideo}
                  className="w-full bg-gradient-brand"
                >
                  {isGeneratingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成视频'
                  )}
                </Button>

                {isGeneratingVideo && cancelledRef.current && (
                  <Button 
                    onClick={() => { cancelledRef.current = true; }} 
                    variant="destructive"
                    className="w-full"
                  >
                    取消生成
                  </Button>
                )}

                {isGeneratingVideo && videoProgress && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <div>
                        <p className="text-muted-foreground">{videoProgress}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          视频生成需要1-3分钟，请耐心等待...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {videoError && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {videoError}
                  </div>
                )}

                {generatedVideos.length > 0 && (
                  <div className="space-y-4 mt-6">
                    {generatedVideos.map((video, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden border">
                        <video src={video.url} controls className="w-full">
                          您的浏览器不支持视频播放
                        </video>
                        <Button
                          onClick={() => downloadVideo(video.url, index)}
                          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          下载
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
