'use client';

import { useEffect } from 'react';

export function SystemTheme() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const savedTheme = window.localStorage.getItem('fabbazaar-theme');
      document.documentElement.dataset.theme = savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : preference.matches ? 'dark' : 'light';
    };

    applyTheme();
    preference.addEventListener('change', applyTheme);
    window.addEventListener('storage', applyTheme);
    return () => {
      preference.removeEventListener('change', applyTheme);
      window.removeEventListener('storage', applyTheme);
    };
  }, []);

  return null;
}
