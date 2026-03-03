import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import TutorialVideo from './TutorialVideo';
import ProfessionSelector from './ProfessionSelector';

export default function OnboardingFlow() {
  const { user, profile } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showProfession, setShowProfession] = useState(false);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
    checkTutorialConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const checkTutorialConfig = async () => {
    const { data } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'tutorial_enabled')
      .single();

    if (data) {
      setTutorialEnabled(data.value === 'true' || data.value === true);
    }
  };

  const checkOnboardingStatus = () => {
    if (!user || !profile) return;

    // 如果用户已经看过教程且选择了职业，不显示引导
    if (profile.has_seen_tutorial && profile.profession_selected) {
      return;
    }

    // 首先显示教程（如果启用且未看过）
    if (tutorialEnabled && !profile.has_seen_tutorial) {
      setShowTutorial(true);
    } else if (!profile.profession_selected) {
      // 教程结束后显示职业选择
      setShowProfession(true);
    }
  };

  const handleTutorialComplete = async () => {
    if (!user) return;

    // 标记用户已看过教程
    await supabase
      .from('profiles')
      .update({ has_seen_tutorial: true })
      .eq('id', user.id);

    // 关闭教程，显示职业选择
    setShowTutorial(false);
    setShowProfession(true);
  };

  const handleProfessionComplete = () => {
    setShowProfession(false);
  };

  return (
    <>
      <TutorialVideo
        open={showTutorial}
        onOpenChange={setShowTutorial}
        onComplete={handleTutorialComplete}
      />
      <ProfessionSelector
        open={showProfession}
        onOpenChange={setShowProfession}
        onComplete={handleProfessionComplete}
      />
    </>
  );
}