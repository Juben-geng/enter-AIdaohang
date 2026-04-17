import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * 职业标签弹窗逻辑Hook
 * 
 * 规则：
 * 1. 新用户第一次登录时显示
 * 2. 如果用户未选择，每周最多显示2次
 * 3. 如果用户已选择，不再显示
 * 4. 如果用户点击"稍后再说"或关闭，记录为一次显示
 */
export function useProfessionTagPopup() {
  const { user, profile } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    checkShouldShow();
  }, [user, profile]);

  const checkShouldShow = async () => {
    if (!user) return;

    try {
      // 1. 检查用户是否已经选择过职业标签
      const { data: selections, error: selectError } = await supabase
        .from('user_profession_tags')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (selectError) throw selectError;

      // 如果已经选择过，不再显示
      if (selections && selections.length > 0) {
        setShouldShow(false);
        return;
      }

      // 2. 检查弹窗历史
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: history, error: historyError } = await supabase
        .from('profession_popup_history')
        .select('id, shown_at, action')
        .eq('user_id', user.id)
        .gte('shown_at', sevenDaysAgo.toISOString())
        .order('shown_at', { ascending: false });

      if (historyError) throw historyError;

      // 3. 判断是否应该显示
      if (!history || history.length === 0) {
        // 首次登录，显示弹窗
        setShouldShow(true);
        return;
      }

      // 4. 检查本周显示次数（最多2次）
      const thisWeekCount = history.length;
      
      if (thisWeekCount >= 2) {
        // 本周已显示2次，不再显示
        setShouldShow(false);
        return;
      }

      // 5. 检查最后一次显示时间（至少间隔3天）
      const lastShown = new Date(history[0].shown_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      if (lastShown > threeDaysAgo) {
        // 最后一次显示在3天内，不显示
        setShouldShow(false);
        return;
      }

      // 6. 可以显示
      setShouldShow(true);
    } catch (error) {
      console.error('Check profession popup error:', error);
      setShouldShow(false);
    }
  };

  return { shouldShow, setShouldShow };
}
