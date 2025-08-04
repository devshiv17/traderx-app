import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';

interface ChartDataPoint {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  exchange: string;
}

interface ChartDataResponse {
  symbol: string;
  timeframe: string;
  date: string;
  data: ChartDataPoint[];
  count: number;
  data_source: string;
  latest_price: number;
  real_time: boolean;
  tick_count: number;
}

interface UseChartDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
}

export function useChartData(
  symbol: string,
  timeframe: string = '1m',
  options: UseChartDataOptions = {}
) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // Increased to 30 seconds to reduce server load
    enabled = true
  } = options;

  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [chartInfo, setChartInfo] = useState<{
    dataSource: string;
    latestPrice: number;
    realTime: boolean;
    tickCount: number;
  } | null>(null);

  const intervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isRefresh: boolean = false) => {
    if (!symbol || !enabled) return;

    try {
      // Cancel previous request if it's still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      console.log(`📊 Fetching chart data for ${symbol} (${timeframe})`);
      
      // Add timeout handling for chart data specifically
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Chart data request timeout (45s)')), 45000);
      });

      const fetchPromise = apiService.getChartData(symbol, timeframe);
      
      const response: ChartDataResponse = await Promise.race([fetchPromise, timeoutPromise]) as ChartDataResponse;
      
      // Handle empty data gracefully
      if (!response || !response.data) {
        console.warn(`⚠️ No chart data returned for ${symbol}`);
        setData([]);
        setChartInfo({
          dataSource: 'no_data',
          latestPrice: 0,
          realTime: false,
          tickCount: 0
        });
        setLastUpdate(new Date());
        return;
      }
      
      setData(response.data);
      setChartInfo({
        dataSource: response.data_source,
        latestPrice: response.latest_price,
        realTime: response.real_time,
        tickCount: response.tick_count
      });
      setLastUpdate(new Date());

      console.log(`✅ Chart data updated: ${response.data.length} points, source: ${response.data_source}, real-time: ${response.real_time}`);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('📊 Chart data request cancelled');
        return;
      }

      console.error('❌ Error fetching chart data:', err);
      
      // Set more specific error messages
      let errorMessage = 'Failed to fetch chart data';
      if (err.message === 'Chart data request timeout (45s)') {
        errorMessage = 'Chart data is loading slowly, please wait...';
      } else if (err.response?.status === 404) {
        errorMessage = 'No data available for this symbol';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error - chart data temporarily unavailable';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      
      // Don't clear existing data on refresh errors
      if (!isRefresh) {
        setData([]);
      }
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  }, [symbol, timeframe, enabled]);

  // Initial fetch
  useEffect(() => {
    if (symbol && enabled) {
      fetchData();
    }
  }, [symbol, timeframe, enabled, fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !enabled || !symbol) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      fetchData(true); // Pass true to indicate this is a refresh
    }, refreshInterval);

    console.log(`🔄 Auto-refresh enabled for ${symbol}: ${refreshInterval}ms interval`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbol, timeframe, autoRefresh, refreshInterval, enabled, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Get latest price
  const getLatestPrice = useCallback(() => {
    if (data.length > 0) {
      return data[data.length - 1].close;
    }
    return chartInfo?.latestPrice || 0;
  }, [data, chartInfo]);

  // Get price change
  const getPriceChange = useCallback(() => {
    if (data.length < 2) return { change: 0, percent: 0, isPositive: true };
    
    const firstPrice = data[0].open;
    const lastPrice = data[data.length - 1].close;
    const change = lastPrice - firstPrice;
    const percent = (change / firstPrice) * 100;
    
    return {
      change: Math.abs(change),
      percent: Math.abs(percent),
      isPositive: change >= 0
    };
  }, [data]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    chartInfo,
    fetchData,
    refresh,
    getLatestPrice,
    getPriceChange,
    isRealTime: chartInfo?.realTime || false,
    dataSource: chartInfo?.dataSource || 'unknown'
  };
} 