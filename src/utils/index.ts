import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {
  // Round the value first to avoid floating point precision issues
  const roundedValue = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `${roundedValue >= 0 ? '+' : ''}${roundedValue.toFixed(decimals)}%`;
}

// Format large numbers (K, M, B)
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toString();
}

// Format volume
export function formatVolume(volume: number): string {
  return formatNumber(volume);
}

// Get color based on value change
export function getChangeColor(change: number): string {
  if (change > 0) return 'text-success-600';
  if (change < 0) return 'text-danger-600';
  return 'text-gray-600';
}

// Get background color based on value change
export function getChangeBgColor(change: number): string {
  if (change > 0) return 'bg-success-100';
  if (change < 0) return 'bg-danger-100';
  return 'bg-gray-100';
}

// Get signal color
export function getSignalColor(signal: 'BUY' | 'SELL' | 'HOLD'): string {
  switch (signal) {
    case 'BUY':
      return 'text-success-600 bg-success-100 border-success-200';
    case 'SELL':
      return 'text-danger-600 bg-danger-100 border-danger-200';
    case 'HOLD':
      return 'text-warning-600 bg-warning-100 border-warning-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

// Get signal icon
export function getSignalIcon(signal: 'BUY' | 'SELL' | 'HOLD'): string {
  switch (signal) {
    case 'BUY':
      return '📈';
    case 'SELL':
      return '📉';
    case 'HOLD':
      return '⏸️';
    default:
      return '📊';
  }
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Format timestamp
export function formatTimestamp(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format relative time
export function formatRelativeTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Local storage utilities
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Failed to save to localStorage');
    }
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
};

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
} 