import { useState, useEffect } from 'react';

const USAGE_COUNT_KEY = 'anonymous_usage_count';
const MAX_ANONYMOUS_USAGE = 10;

export function useAnonymousUsage() {
  const [usageCount, setUsageCount] = useState(0);
  const [shouldPromptLogin, setShouldPromptLogin] = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(USAGE_COUNT_KEY) || '0', 10);
    setUsageCount(count);
    
    if (count >= MAX_ANONYMOUS_USAGE) {
      setShouldPromptLogin(true);
    }
  }, []);

  const incrementUsage = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem(USAGE_COUNT_KEY, newCount.toString());
    
    if (newCount >= MAX_ANONYMOUS_USAGE) {
      setShouldPromptLogin(true);
    }
    
    return newCount;
  };

  const resetUsage = () => {
    setUsageCount(0);
    setShouldPromptLogin(false);
    localStorage.removeItem(USAGE_COUNT_KEY);
  };

  return {
    usageCount,
    shouldPromptLogin,
    incrementUsage,
    resetUsage,
    remainingUsage: Math.max(0, MAX_ANONYMOUS_USAGE - usageCount),
  };
}