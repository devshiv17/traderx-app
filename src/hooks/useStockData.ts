import { useState, useEffect, useCallback } from 'react';
import { StockData } from '../types';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';

interface UseStockDataOptions {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useStockData(options: UseStockDataOptions = {}) {
  const { symbol, autoRefresh = true, refreshInterval = 5000 } = options;
  
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = useCallback(async (stockSymbol: string) => {
    if (!stockSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getStockData(stockSymbol);
      setStockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (symbol) {
      fetchStockData(symbol);
    }
  }, [symbol, fetchStockData]);

  // Auto-refresh
  useEffect(() => {
    if (!symbol || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchStockData(symbol);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [symbol, autoRefresh, refreshInterval, fetchStockData]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!symbol) return;

    const unsubscribe = wsService.subscribeToStockUpdates(symbol, (data) => {
      setStockData(data);
    });

    return unsubscribe;
  }, [symbol]);

  return {
    stockData,
    loading,
    error,
    refetch: () => symbol && fetchStockData(symbol),
  };
} 