import { useState, useEffect, useCallback } from 'react';
import { TradingSignal } from '../types';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';

interface UseSignalsOptions {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSignals(options: UseSignalsOptions = {}) {
  const { symbol, autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async (stockSymbol?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getSignals(stockSymbol);
      setSignals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSignal = useCallback(async (stockSymbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const signal = await apiService.generateSignal(stockSymbol);
      setSignals(prev => [signal, ...prev]);
      return signal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate signal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSignals(symbol);
  }, [symbol, fetchSignals]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSignals(symbol);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [symbol, autoRefresh, refreshInterval, fetchSignals]);

  // WebSocket real-time updates
  useEffect(() => {
    const unsubscribe = wsService.subscribeToSignalUpdates((signal) => {
      setSignals(prev => {
        const existingIndex = prev.findIndex(s => s.symbol === signal.symbol);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = signal;
          return updated;
        }
        return [signal, ...prev];
      });
    });

    return unsubscribe;
  }, []);

  return {
    signals,
    loading,
    error,
    refetch: () => fetchSignals(symbol),
    generateSignal,
  };
} 