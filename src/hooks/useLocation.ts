import { useState, useEffect } from 'react';

interface LocationData {
  city: string;
  ip: string;
  country: string;
  region: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // 使用免费的IP定位API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      setLocation({
        city: data.city || '未知',
        ip: data.ip || '未知',
        country: data.country_name || '未知',
        region: data.region || '未知',
      });
    } catch (err) {
      setError('获取位置信息失败');
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, getLocation };
}