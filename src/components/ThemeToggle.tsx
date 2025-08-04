import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        className={cn(
          "relative p-2 rounded-lg transition-all duration-300 group",
          "bg-gradient-to-r from-primary-100 to-secondary-100",
          "dark:from-primary-900 dark:to-secondary-900",
          "hover:from-primary-200 hover:to-secondary-200",
          "dark:hover:from-primary-800 dark:hover:to-secondary-800",
          "border border-primary-200 dark:border-primary-700",
          "hover:border-primary-300 dark:hover:border-primary-600",
          "shadow-sm hover:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "dark:focus:ring-offset-gray-900"
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <div className="relative w-6 h-6">
          {/* Sun Icon */}
          <Sun 
            className={cn(
              "absolute inset-0 w-6 h-6 transition-all duration-300",
              "text-yellow-500",
              theme === 'light' 
                ? "opacity-100 rotate-0 scale-100" 
                : "opacity-0 -rotate-90 scale-75"
            )}
          />
          
          {/* Moon Icon */}
          <Moon 
            className={cn(
              "absolute inset-0 w-6 h-6 transition-all duration-300",
              "text-primary-600 dark:text-primary-400",
              theme === 'dark' 
                ? "opacity-100 rotate-0 scale-100" 
                : "opacity-0 rotate-90 scale-75"
            )}
          />
          
          {/* Monitor Icon (for system preference) */}
          <Monitor 
            className={cn(
              "absolute inset-0 w-6 h-6 transition-all duration-300",
              "text-gray-500",
              theme === 'system' 
                ? "opacity-100 rotate-0 scale-100" 
                : "opacity-0 rotate-180 scale-75"
            )}
          />
        </div>
        
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-lg transition-all duration-300",
          "bg-gradient-to-r from-primary-500/20 to-secondary-500/20",
          "opacity-0 group-hover:opacity-100",
          "blur-sm scale-110"
        )} />
      </button>
      
      {/* Tooltip */}
      <div className={cn(
        "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1",
        "text-xs font-medium text-white bg-gray-900 rounded",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "pointer-events-none whitespace-nowrap"
      )}>
        {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
} 