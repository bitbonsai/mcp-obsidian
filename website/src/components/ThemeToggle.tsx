import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydration check
  useEffect(() => {
    setMounted(true);

    // Check localStorage first, then system preference
    let theme = localStorage.getItem('theme');

    if (!theme) {
      // Check user's system preference
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
    }

    setIsDark(theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');

    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('themeChanged'));
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-14 h-8 bg-card/50 rounded-full animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="
        relative w-14 h-8 bg-card/50 backdrop-blur-sm rounded-full
        border border-border/50 transition-all duration-300
        hover:border-accent/50 focus:outline-none focus:ring-2
        focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background
        group
      "
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Toggle slider */}
      <div
        className={`
          absolute top-1 w-6 h-6 bg-foreground rounded-full
          transition-all duration-300 shadow-lg
          ${isDark ? 'left-1' : 'left-7'}
          group-hover:scale-110
        `}
      >
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isDark ? (
            <svg
              className="w-3 h-3 text-background transition-transform duration-300 group-hover:rotate-12"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-3 h-3 text-background transition-transform duration-300 group-hover:-rotate-12"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </div>
      </div>

      {/* Background gradient */}
      <div
        className={`
          absolute inset-0 rounded-full transition-opacity duration-300
          ${isDark
            ? 'bg-gradient-to-r from-accent/20 to-accent-2/20 opacity-100'
            : 'bg-gradient-to-r from-warning/20 to-accent/20 opacity-100'
          }
        `}
      />

      {/* Ambient glow effect */}
      <div
        className={`
          absolute inset-0 rounded-full transition-opacity duration-300
          ${isDark
            ? 'shadow-lg shadow-accent/25 opacity-100'
            : 'shadow-lg shadow-warning/25 opacity-100'
          }
        `}
      />

      {/* Status text */}
      <span className="sr-only">
        {isDark ? 'Dark mode active' : 'Light mode active'}
      </span>
    </button>
  );
}