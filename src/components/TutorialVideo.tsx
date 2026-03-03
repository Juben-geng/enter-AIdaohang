import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, X, SkipForward } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TutorialStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  video_url: string | null;
  image_url: string | null;
}

interface TutorialVideoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function TutorialVideo({ open, onOpenChange, onComplete }: TutorialVideoProps) {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSteps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchSteps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tutorial_steps')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!error && data && data.length > 0) {
      setSteps(data);
    } else {
      // 如果没有数据，使用默认步骤
      setSteps(getDefaultSteps());
    }
    setLoading(false);
  };

  const getDefaultSteps = (): TutorialStep[] => [
    {
      id: '1',
      step_number: 1,
      title: '欢迎使用智联导航中心',
      description: '让您的导航更智能，让您的分享更便捷。通过简单的步骤，快速上手所有功能。',
      video_url: null,
      image_url: null,
    },
    {
      id: '2',
      step_number: 2,
      title: '创建您的第一个分类',
      description: '点击"新建分类"按钮，选择图标和名称，即可创建一个分类来组织您的链接。',
      video_url: null,
      image_url: null,
    },
    {
      id: '3',
      step_number: 3,
      title: '添加链接到分类',
      description: '在分类卡片中点击"添加链接"，输入标题和URL，支持网页链接和小程序路径。',
      video_url: null,
      image_url: null,
    },
    {
      id: '4',
      step_number: 4,
      title: '使用智能搜索',
      description: '通过顶部搜索框，快速找到您需要的分类或链接，提高工作效率。',
      video_url: null,
      image_url: null,
    },
    {
      id: '5',
      step_number: 5,
      title: '升级会员解锁更多功能',
      description: '升级为VIP会员，解锁AI助手、无限分类、数据导出等高级功能。',
      video_url: null,
      image_url: null,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  if (loading || steps.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 进度条 */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
            <span>步骤 {currentStep + 1} / {steps.length}</span>
            <button onClick={handleSkip} className="hover:text-foreground transition-colors flex items-center gap-1">
              <SkipForward className="w-4 h-4" />
              跳过教程
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 pt-4">
          {step.video_url && (
            <div className="aspect-video bg-muted rounded-lg mb-6 overflow-hidden">
              <video
                src={step.video_url}
                controls
                className="w-full h-full object-cover"
                autoPlay
                muted
              />
            </div>
          )}

          {step.image_url && !step.video_url && (
            <div className="aspect-video bg-muted rounded-lg mb-6 overflow-hidden flex items-center justify-center">
              <img
                src={step.image_url}
                alt={step.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {!step.video_url && !step.image_url && (
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold mb-2">步骤 {step.step_number}</h3>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-3xl font-bold">{step.title}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex justify-between items-center p-6 bg-muted/30 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            上一步
          </Button>

          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary w-6'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext} className="bg-gradient-brand min-w-[120px]">
            {currentStep === steps.length - 1 ? (
              '开始使用'
            ) : (
              <>
                下一步
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}