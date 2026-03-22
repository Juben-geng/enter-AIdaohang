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
    try {
      console.log('🚀 [注册] 开始注册流程...', { email, hasReferralCode: !!referralCode });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            referred_by_code: referralCode,
          },
        },
      });

      console.log('📥 [注册] Supabase响应:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        userId: data?.user?.id,
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (error) {
        console.error('❌ [注册] 错误:', error);
        
        // 友好的错误信息
        if (error.message.includes('already') || error.message.includes('exists')) {
          throw new Error('该邮箱已注册，请直接登录');
        }
        throw new Error(error.message || '注册失败，请重试');
      }

      if (!data.user) {
        console.error('❌ [注册] 未返回用户信息');
        throw new Error('注册失败，未返回用户信息');
      }

      console.log('✅ [注册] 用户创建成功！User ID:', data.user.id);

      // 等待触发器创建profile（给足够时间）
      console.log('⏳ [注册] 等待profile创建...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 验证profile是否创建成功
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, membership_type')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('⚠️ [注册] Profile检查失败:', profileError);
      } else if (profileCheck) {
        console.log('✅ [注册] Profile已创建:', profileCheck);
      } else {
        console.warn('⚠️ [注册] Profile未找到，但不影响注册');
      }

      // 异步处理邀请码和数据迁移（不阻塞注册流程）
      setTimeout(async () => {
        try {
          // 如果有邀请码，处理邀请关系
          if (referralCode && data.user) {
            console.log('🔗 [注册] 处理推荐码...');
            const { data: referrer } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', referralCode)
              .maybeSingle();

            if (referrer) {
              await supabase
                .from('profiles')
                .update({ referred_by: referrer.id })
                .eq('id', data.user.id);

              await supabase.from('referrals').insert({
                referrer_id: referrer.id,
                referee_id: data.user.id,
                referral_type: 'free_signup',
              });
              
              console.log('✅ [注册] 推荐关系已建立');
            }
          }

          // 迁移本地数据到数据库
          console.log('📦 [注册] 迁移本地数据...');
          await migrateLocalDataToDatabase(data.user.id);
          console.log('✅ [注册] 本地数据迁移完成');
        } catch (asyncError) {
          console.error('⚠️ [注册] 后台处理错误（不影响注册）:', asyncError);
        }
      }, 100);

      toast({
        title: '🎉 注册成功',
        description: '欢迎加入智联导航中心！',
      });
      
      console.log('✅ [注册] 注册流程完成');
    } catch (error) {
      console.error('💥 [注册] 失败:', error);
      throw error;
    }
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
    try {
      console.log('🔐 [登录] 开始登录流程...', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📥 [登录] Supabase响应:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        userId: data?.user?.id,
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (error) {
        console.error('❌ [登录] 错误:', error);
        
        // 提供更友好的错误信息
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('邮箱或密码错误，请检查后重试');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('邮箱未验证，请查收验证邮件');
        }
        throw new Error(error.message || '登录失败，请重试');
      }

      if (!data.user) {
        console.error('❌ [登录] 未返回用户信息');
        throw new Error('登录失败，未返回用户信息');
      }

      console.log('✅ [登录] 成功！User ID:', data.user.id);

      toast({
        title: '🎉 登录成功',
        description: '欢迎回来！',
      });
      
      console.log('✅ [登录] 登录流程完成');
    } catch (error) {
      console.error('💥 [登录] 失败:', error);
      throw error;
    }
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