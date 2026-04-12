import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md bg-card border border-border flex items-center gap-2 hover:bg-accent transition-colors ${className}`}
      title="Basculer le thème"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      <span className="text-sm font-medium">{theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}</span>
    </button>
  );
};