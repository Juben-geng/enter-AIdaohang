import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  ip_address: string | null;
  location_count: number;
  membership_type: 'free' | 'basic' | 'vip' | 'city_agent' | 'national_agent';
  membership_expires_at: string | null;
  referral_code: string | null;
  referred_by: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, referralCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    // 获取当前session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id).then(setProfile);
        }, 0);
      }
      
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id).then(setProfile);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, referralCode?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;

    // 如果有邀请码，处理邀请关系
    if (referralCode && data.user) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (referrer) {
        await supabase
          .from('profiles')
          .update({ referred_by: referrer.id })
          .eq('id', data.user.id);

        // 创建邀请记录
        await supabase.from('referrals').insert({
          referrer_id: referrer.id,
          referee_id: data.user.id,
          referral_type: 'free_signup',
        });
      }
    }

    // 迁移本地数据到数据库
    if (data.user) {
      await migrateLocalDataToDatabase(data.user.id);
    }

    toast({
      title: '注册成功',
      description: '欢迎使用智联导航中心！本地数据已同步到云端',
    });
  };

  const migrateLocalDataToDatabase = async (userId: string) => {
    try {
      // 获取本地存储的数据
      const localCategories = localStorage.getItem('local_categories');
      const localLinks = localStorage.getItem('local_links');

      if (!localCategories && !localLinks) return;

      const categories = localCategories ? JSON.parse(localCategories) : [];
      const links = localLinks ? JSON.parse(localLinks) : [];

      // 迁移分类
      const categoryIdMap = new Map<string, string>();
      
      for (const category of categories) {
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: category.name,
            icon: category.icon,
            color: category.color,
            sort_order: category.sort_order,
            is_custom: true,
          })
          .select()
          .single();

        if (newCategory) {
          categoryIdMap.set(category.id, newCategory.id);
        }
      }

      // 迁移链接
      for (const link of links) {
        const newCategoryId = categoryIdMap.get(link.category_id);
        if (newCategoryId) {
          await supabase.from('links').insert({
            user_id: userId,
            category_id: newCategoryId,
            title: link.title,
            url: link.url,
            description: link.description,
            icon: link.icon,
            link_type: link.link_type,
            sort_order: link.sort_order,
            click_count: link.click_count || 0,
          });
        }
      }

      // 清除本地数据
      localStorage.removeItem('local_categories');
      localStorage.removeItem('local_links');
      localStorage.removeItem('anonymous_usage_count');
      
      console.log('Local data migrated successfully');
    } catch (error) {
      console.error('Error migrating local data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    toast({
      title: '登录成功',
      description: '欢迎回来！',
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    toast({
      title: '已退出登录',
      description: '期待您的再次光临',
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    await refreshProfile();
    
    toast({
      title: '更新成功',
      description: '您的资料已更新',
    });
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Separate export to fix fast-refresh warning
export type { Profile, AuthContextType };