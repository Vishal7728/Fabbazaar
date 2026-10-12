'use client';

import { useEffect } from 'react';

export function SystemTheme() {
  useEffect(() => {
    let timer: number;
    const applyTheme = () => {
      const now = new Date();
      const hour = now.getHours();
      document.documentElement.dataset.theme = hour >= 7 && hour < 19 ? 'light' : 'dark';

      const nextSwitch = new Date(now);
      if (hour >= 19) nextSwitch.setDate(nextSwitch.getDate() + 1);
      nextSwitch.setHours(hour >= 7 && hour < 19 ? 19 : 7, 0, 0, 0);

      window.clearTimeout(timer);
      timer = window.setTimeout(applyTheme, nextSwitch.getTime() - now.getTime());
    };

    applyTheme();
    window.addEventListener('focus', applyTheme);
    document.addEventListener('visibilitychange', applyTheme);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', applyTheme);
      document.removeEventListener('visibilitychange', applyTheme);
    };
  }, []);

  return null;
}
