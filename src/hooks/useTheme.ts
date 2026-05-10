import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('pdf-studio-theme') as Theme | null;
    return saved ?? 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('pdf-studio-theme', theme);
  }, [theme]);

  // Apply on mount immediately (before first paint)
  useEffect(() => {
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
