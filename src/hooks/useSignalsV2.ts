import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';

interface SignalV2 {
  id: string;
  session_name: string;
  signal_type: string;
  reason: string;
  timestamp: string;
  nifty_price: number;
  future_price: number;
  future_symbol: string;
  entry_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  confidence: number;
  status: string;
  session_high: number;
  session_low: number;
  breakout_amount: number;
  breakout_type: string;
  display_text: string;
  created_at: string;
  updated_at: string;
}

interface SessionV2 {
  name: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  symbols_data?: Record<string, any>;
  breakouts_checked?: boolean;
  signals_generated?: string[];
}

interface MonitoringStatusV2 {
  version: string;
  monitoring_active: boolean;
  market_hours: boolean;
  current_time_ist: string;
  service_status: string;
  sessions: {
    total: number;
    by_status: Record<string, number>;
    predefined_sessions: string[];
  };
  signals: {
    active_count: number;
  };
  timestamp: string;
  database_backed: boolean;
  race_condition_safe: boolean;
}

interface UseSignalsV2Options {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSignalsV2(options: UseSignalsV2Options = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [signals, setSignals] = useState<SignalV2[]>([]);
  const [sessions, setSessions] = useState<SessionV2[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatusV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getActiveSignals();
      setSignals(data.signals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await apiService.getSessionStatus();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    }
  }, []);

  const fetchMonitoringStatus = useCallback(async () => {
    try {
      const data = await apiService.getMonitoringStatus();
      setMonitoringStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring status');
    }
  }, []);

  const startMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.startSignalMonitoring();
      
      // Refresh status after starting
      await fetchMonitoringStatus();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start monitoring');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMonitoringStatus]);

  const stopMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.stopSignalMonitoring();
      
      // Refresh status after stopping
      await fetchMonitoringStatus();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop monitoring');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMonitoringStatus]);

  const initializeDatabase = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.initDatabase();
      
      // Refresh data after initialization
      await Promise.all([
        fetchMonitoringStatus(),
        fetchSessions(),
        fetchSignals()
      ]);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize database');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMonitoringStatus, fetchSessions, fetchSignals]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      fetchSignals(),
      fetchSessions(),
      fetchMonitoringStatus()
    ]);
  }, [fetchSignals, fetchSessions, fetchMonitoringStatus]);

  // Initial fetch
  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchAll();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchAll]);

  // WebSocket real-time updates for V2 signals
  useEffect(() => {
    const unsubscribe = wsService.subscribeToSignalUpdates((signal: any) => {
      // Check if this looks like a V2 signal
      if (signal.session_name && signal.breakout_type) {
        setSignals(prev => {
          const existingIndex = prev.findIndex(s => s.id === signal.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = signal as SignalV2;
            return updated;
          }
          return [signal as SignalV2, ...prev];
        });
      }
    });

    return unsubscribe;
  }, []);

  return {
    // Data
    signals,
    sessions,
    monitoringStatus,
    
    // State
    loading,
    error,
    
    // Actions
    refetchAll,
    startMonitoring,
    stopMonitoring,
    initializeDatabase,
    
    // Individual refetch methods
    refetchSignals: fetchSignals,
    refetchSessions: fetchSessions,
    refetchStatus: fetchMonitoringStatus,
  };
}