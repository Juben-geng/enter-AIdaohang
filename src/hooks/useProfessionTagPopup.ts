import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * 职业标签弹窗逻辑Hook
 * 
 * 规则（从系统配置中读取）：
 * 1. 新用户第一次登录时显示
 * 2. 如果用户未选择，每周最多显示N次（可配置，默认2次）
 * 3. 如果用户已选择，不再显示
 * 4. 如果用户点击"稍后再说"或关闭，记录为一次显示
 * 5. 最小间隔天数可配置（默认3天）
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
      // 0. 读取系统配置
      const { data: configs } = await supabase
        .from('system_config')
        .select('config_key, config_value')
        .in('config_key', ['profession_popup_max_weekly', 'profession_popup_interval_days']);

      const maxWeekly = parseInt(configs?.find(c => c.config_key === 'profession_popup_max_weekly')?.config_value || '2');
      const intervalDays = parseInt(configs?.find(c => c.config_key === 'profession_popup_interval_days')?.config_value || '3');

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

      // 4. 检查本周显示次数（使用配置的最大次数）
      const thisWeekCount = history.length;
      
      if (thisWeekCount >= maxWeekly) {
        // 本周已达到最大显示次数，不再显示
        setShouldShow(false);
        return;
      }

      // 5. 检查最后一次显示时间（使用配置的间隔天数）
      const lastShown = new Date(history[0].shown_at);
      const minIntervalDate = new Date();
      minIntervalDate.setDate(minIntervalDate.getDate() - intervalDays);

      if (lastShown > minIntervalDate) {
        // 最后一次显示在间隔期内，不显示
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
