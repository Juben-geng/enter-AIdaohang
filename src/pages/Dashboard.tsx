import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Menu, LogOut, User, Crown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CategorySection from '@/components/dashboard/CategorySection';
import AddCategoryDialog from '@/components/dashboard/AddCategoryDialog';
import AddLinkDialog from '@/components/dashboard/AddLinkDialog';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_custom: boolean;
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user?.id)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleAddLink = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowAddLink(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getMembershipBadge = () => {
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold gradient-text">智联导航</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.class}`}>
              {badge.label}
            </span>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCategory(true)}
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建分类
            </Button>

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-light rounded-full mb-4">
              <Menu className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">开始创建您的导航</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              还没有任何分类。点击下面的按钮创建第一个分类，开始管理您的链接。
            </p>
            <Button onClick={() => setShowAddCategory(true)} size="lg" className="bg-gradient-brand">
              <Plus className="w-5 h-5 mr-2" />
              创建第一个分类
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories
              .filter((cat) =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  onAddLink={handleAddLink}
                  onRefresh={fetchCategories}
                />
              ))}
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <Button
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full bg-gradient-brand shadow-lg"
        size="icon"
        onClick={() => setShowAddCategory(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <AddCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onSuccess={fetchCategories}
      />

      <AddLinkDialog
        open={showAddLink}
        onOpenChange={setShowAddLink}
        categoryId={selectedCategoryId}
        onSuccess={fetchCategories}
      />
    </div>
  );
}