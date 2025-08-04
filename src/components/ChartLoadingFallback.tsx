import React from 'react';
import { Loader2, BarChart3, AlertTriangle } from 'lucide-react';

interface ChartLoadingFallbackProps {
  loading: boolean;
  error?: string | null;
  symbol?: string;
  onRetry?: () => void;
}

const ChartLoadingFallback: React.FC<ChartLoadingFallbackProps> = ({ 
  loading, 
  error, 
  symbol,
  onRetry 
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Unable to Load Chart
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
          {error.includes('timeout') ? (
            <>
              Chart data is taking longer than usual to load. This can happen during high market activity.
              <br />
              <span className="font-medium">Please try refreshing or wait a moment.</span>
            </>
          ) : error.includes('No data available') ? (
            <>
              No chart data is available for {symbol || 'this symbol'} at the moment.
              <br />
              <span className="font-medium">Data may become available during market hours (9:15 AM - 3:30 PM IST).</span>
            </>
          ) : (
            error
          )}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="relative mb-4">
          <BarChart3 className="w-12 h-12 text-gray-400" />
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin absolute -top-1 -right-1" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Loading Chart Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {symbol ? `Fetching data for ${symbol}...` : 'Fetching chart data...'}
          <br />
          <span className="text-xs opacity-75">This may take a few moments during market hours</span>
        </p>
        <div className="mt-4 flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChartLoadingFallback;