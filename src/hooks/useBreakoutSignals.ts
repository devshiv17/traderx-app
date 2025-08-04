import { useState, useEffect, useCallback } from 'react';
import { BreakoutSignal, SessionSignals } from '../types';
import { apiService } from '../services/api';

interface UseBreakoutSignalsOptions {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  viewMode?: 'list' | 'sessions';
}

export function useBreakoutSignals(options: UseBreakoutSignalsOptions = {}) {
  const { 
    symbol, 
    autoRefresh = true, 
    refreshInterval = 30000,
    viewMode = 'sessions'
  } = options;
  
  const [signals, setSignals] = useState<BreakoutSignal[]>([]);
  const [sessionSignals, setSessionSignals] = useState<SessionSignals>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (viewMode === 'sessions') {
        const response = await apiService.getSignalsBySession({ limit: 50 });
        setSessionSignals(response.sessions);
        
        // Also update flat signals list for convenience
        const allSignals: BreakoutSignal[] = [];
        Object.values(response.sessions).forEach(sessionSignalsList => {
          allSignals.push(...sessionSignalsList);
        });
        setSignals(allSignals);
      } else {
        const response = await apiService.getSignalsWithBreakoutDetails({ 
          limit: 50,
          session_name: symbol ? undefined : undefined // Can filter by session if needed
        });
        setSignals(response.signals);
        
        // Group by sessions for convenience
        const grouped: SessionSignals = {};
        response.signals.forEach((signal: BreakoutSignal) => {
          const sessionName = signal.session_name;
          if (!grouped[sessionName]) {
            grouped[sessionName] = [];
          }
          grouped[sessionName].push(signal);
        });
        setSessionSignals(grouped);
      }
    } catch (err: any) {
      console.error('Error fetching breakout signals:', err);
      setError(err.response?.data?.detail || 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [viewMode, symbol]);

  const fetchActiveSignals = useCallback(async () => {
    try {
      const response = await apiService.getActiveSignals();
      return response.signals || [];
    } catch (err: any) {
      console.error('Error fetching active signals:', err);
      return [];
    }
  }, []);

  const getSignalHistory = useCallback(async (params?: {
    limit?: number;
    session_name?: string;
    group_by_session?: boolean;
  }) => {
    try {
      const response = await apiService.getSignalHistoryGrouped({
        ...params,
        group_by_session: params?.group_by_session ?? true
      });
      return response;
    } catch (err: any) {
      console.error('Error fetching signal history:', err);
      throw err;
    }
  }, []);

  const getSessionStatus = useCallback(async () => {
    try {
      const response = await apiService.getSessionStatus();
      return response.sessions || [];
    } catch (err: any) {
      console.error('Error fetching session status:', err);
      return [];
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSignals();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSignals]);

  // Real-time updates via WebSocket could be added here
  // useEffect(() => {
  //   const unsubscribe = wsService.subscribeToSignalUpdates((signal) => {
  //     // Handle real-time signal updates
  //   });
  //   return unsubscribe;
  // }, []);

  return {
    signals,
    sessionSignals,
    loading,
    error,
    refetch: fetchSignals,
    fetchActiveSignals,
    getSignalHistory,
    getSessionStatus,
  };
}