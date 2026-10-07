'use client';

import { useEffect } from 'react';

export function ClockTheme() {
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      document.documentElement.dataset.theme = hour >= 7 && hour < 19 ? 'light' : 'dark';
    };
    updateTheme();
    const timer = window.setInterval(updateTheme, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
