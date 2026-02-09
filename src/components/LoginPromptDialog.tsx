import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Share2, Shield } from 'lucide-react';

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageCount: number;
  remainingUsage: number;
}

export default function LoginPromptDialog({ 
  open, 
  onOpenChange, 
  usageCount, 
  remainingUsage 
}: LoginPromptDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {usageCount >= 10 ? '免费试用已达上限' : '即将达到使用上限'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {usageCount >= 10 
              ? '您已使用10次，注册登录后继续使用所有功能'
              : `您还剩 ${remainingUsage} 次免费使用机会`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary-light rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">注册前</p>
                <p className="text-sm text-muted-foreground">数据保存在本地浏览器</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">注册后</p>
                <p className="text-sm text-muted-foreground">
                  数据永久保存云端，可在任何设备访问
                </p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">或分享给好友</p>
                <p className="text-sm text-muted-foreground">
                  邀请1位好友注册后，您可继续免费使用
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              稍后再说
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate('/auth');
              }}
              className="w-full bg-gradient-brand"
            >
              立即注册
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}