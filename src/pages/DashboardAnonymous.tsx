import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAnonymousUsage } from '@/hooks/useAnonymousUsage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LogOut, User, Crown, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import CategorySectionLocal from '@/components/dashboard/CategorySectionLocal';
import CategorySection from '@/components/dashboard/CategorySection';
import AddCategoryDialog from '@/components/dashboard/AddCategoryDialog';
import AddLinkDialog from '@/components/dashboard/AddLinkDialog';
import LoginPromptDialog from '@/components/LoginPromptDialog';
import OnboardingFlow from '@/components/OnboardingFlow';
import ExportButton from '@/components/ExportButton';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_custom?: boolean;
}

export default function DashboardAnonymous() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 匿名使用钩子
  const { usageCount, shouldPromptLogin, incrementUsage, remainingUsage, resetUsage } = useAnonymousUsage();
  const localStorage = useLocalStorage();
  
  // 数据库数据
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // 根据登录状态选择数据源
  const categories = user ? dbCategories : localStorage.categories;
  const isAnonymous = !user;

  useEffect(() => {
    if (user) {
      fetchDbCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (shouldPromptLogin && isAnonymous) {
      setShowLoginPrompt(true);
    }
  }, [shouldPromptLogin, isAnonymous]);

  const fetchDbCategories = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setDbCategories(data);
    }
    setLoading(false);
  }, [user]);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // 处理分类拖拽
  const handleCategoryDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categories, oldIndex, newIndex).map((cat, idx) => ({
      ...cat,
      sort_order: idx,
    }));

    if (user) {
      setDbCategories(reordered);
      await Promise.all(
        reordered.map((cat) =>
          supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', cat.id)
        )
      );
    } else {
      localStorage.updateCategories(reordered);
    }
  }, [categories, user, localStorage]);

  const handleAddCategory = () => {
    if (isAnonymous) {
      const newCount = incrementUsage();
      if (newCount >= 10) {
        setShowLoginPrompt(true);
        return;
      }
    }
    setShowAddCategory(true);
  };

  const handleAddLink = (categoryId: string) => {
    if (isAnonymous) {
      const newCount = incrementUsage();
      if (newCount >= 10) {
        setShowLoginPrompt(true);
        return;
      }
    }
    setSelectedCategoryId(categoryId);
    setShowAddLink(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getMembershipBadge = () => {
    if (isAnonymous) {
      return { label: '游客模式', class: 'bg-muted text-muted-foreground' };
    }
    
    switch (profile?.membership_type) {
      case 'vip':
        return { label: 'VIP会员', class: 'bg-gradient-brand text-white' };
      case 'city_agent':
        return { label: '城市代理', class: 'bg-gradient-accent text-white' };
      case 'national_agent':
        return { label: '全国代理', class: 'bg-gradient-accent text-white animate-pulse-glow' };
      case 'basic':
        return { label: '普通会员', class: 'bg-primary text-primary-foreground' };
      default:
        return { label: '免费会员', class: 'bg-muted text-muted-foreground' };
    }
  };

  const badge = getMembershipBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      {/* 首次登录引导 */}
      <OnboardingFlow />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold gradient-text">旅游AI工具导航</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.class}`}>
              {badge.label}
            </span>
            {isAnonymous && (
              <Badge variant="outline" className="text-xs">
                剩余 {remainingUsage} 次试用
              </Badge>
            )}
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索分类或链接..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isAnonymous && <ExportButton />}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCategory}
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建分类
            </Button>

            {isAnonymous ? (
              <Button
                onClick={() => navigate('/auth')}
                size="sm"
                className="bg-gradient-brand"
              >
                <LogIn className="w-4 h-4 mr-2" />
                登录/注册
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-brand text-white">
                        {profile?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.username || '用户'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/member')}>
                    <Crown className="w-4 h-4 mr-2" />
                    会员中心
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    个人资料
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isAnonymous && categories.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-light rounded-full mb-4">
              <Plus className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">欢迎来到智慧旅游平台</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              无需注册即可开始使用！您有10次免费试用机会，创建您的第一个分类开始管理链接。
            </p>
            <p className="text-sm text-muted-foreground">
              💡 提示：注册后数据将永久保存到云端，可在任何设备访问
            </p>
            <Button onClick={handleAddCategory} size="lg" className="bg-gradient-brand">
              <Plus className="w-5 h-5 mr-2" />
              创建第一个分类
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories
              .filter((cat) =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((category) =>
                isAnonymous ? (
                  <CategorySectionLocal
                    key={category.id}
                    category={category}
                    onAddLink={handleAddLink}
                    onRefresh={() => {}}
                    localStorage={localStorage}
                    onAction={incrementUsage}
                  />
                ) : (
                  <CategorySection
                    key={category.id}
                    category={category}
                    onAddLink={handleAddLink}
                    onRefresh={fetchDbCategories}
                  />
                )
              )}
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <Button
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full bg-gradient-brand shadow-lg"
        size="icon"
        onClick={handleAddCategory}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <AddCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onSuccess={() => {
          if (isAnonymous) {
            // 本地存储已在对话框中处理
          } else {
            fetchDbCategories();
          }
        }}
        isAnonymous={isAnonymous}
        localStorage={localStorage}
      />

      <AddLinkDialog
        open={showAddLink}
        onOpenChange={setShowAddLink}
        categoryId={selectedCategoryId}
        onSuccess={() => {
          if (isAnonymous) {
            // 本地存储已在对话框中处理
          } else {
            fetchDbCategories();
          }
        }}
        isAnonymous={isAnonymous}
        localStorage={localStorage}
      />

      <LoginPromptDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        usageCount={usageCount}
        remainingUsage={remainingUsage}
      />
    </div>
  );
}