import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface FeedData {
  tk: string;
  ltpc: number;
  ch: number;
  chp: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  bid: number;
  ask: number;
  bid_qty: number;
  ask_qty: number;
  exchange: string;
  symbol: string;
  received_at: string;
}

interface ApiFeedData {
  _id: string;
  symbol: string;
  price: number;
  timestamp: string;
  token: string;
  exchange: string;
  high: number | null;
  low: number | null;
  volume: number | null;
  change: number | null;
  change_percent: number | null;
  source: string;
  market_status: string;
  received_at: string;
}

interface UseFeedDataOptions {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
}

// Helper function to map API data to frontend format
const mapApiDataToFeedData = (apiData: ApiFeedData): FeedData => {
  return {
    tk: apiData.symbol,
    ltpc: apiData.price,
    ch: apiData.change || 0,
    chp: apiData.change_percent || 0,
    high: apiData.high || apiData.price,
    low: apiData.low || apiData.price,
    open: apiData.price, // Use current price as fallback
    close: apiData.price,
    volume: apiData.volume || 0,
    bid: apiData.price, // Use current price as fallback
    ask: apiData.price, // Use current price as fallback
    bid_qty: 0, // Not available in API
    ask_qty: 0, // Not available in API
    exchange: apiData.exchange,
    symbol: apiData.symbol,
    received_at: apiData.received_at
  };
};

export function useFeedData(options: UseFeedDataOptions = {}) {
  const { 
    symbol, 
    autoRefresh = true, 
    refreshInterval = 5000, // 5 seconds for real-time data
    limit = 100 
  } = options;
  
  const [data, setData] = useState<FeedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    // Only show loading on initial fetch, not on auto-refresh
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('🔄 Fetching market data...');
      const response = await apiService.getLatestMarketData(symbol, limit);
      console.log('📡 API Response:', response);
      
      if (response.status === 'success') {
        const mappedData = (response.data || []).map(mapApiDataToFeedData);
        console.log('🔄 Mapped data:', mappedData);
        setData(mappedData);
        setLastUpdate(new Date());
      } else {
        console.error('❌ API returned error status:', response);
        setError('Failed to fetch feed data');
      }
    } catch (err) {
      console.error('❌ API call failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feed data');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [symbol, limit]);

  const fetchSummary = useCallback(async (isRefresh = false) => {
    // Only show loading on initial fetch, not on auto-refresh
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('🔄 Fetching market summary...');
      const response = await apiService.getMarketSummary();
      console.log('📡 API Response:', response);
      
      if (response.status === 'success') {
        const mappedData = (response.data || []).map(mapApiDataToFeedData);
        console.log('🔄 Mapped data:', mappedData);
        setData(mappedData);
        setLastUpdate(new Date());
      } else {
        console.error('❌ API returned error status:', response);
        setError('Failed to fetch market summary');
      }
    } catch (err) {
      console.error('❌ API call failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market summary');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await apiService.getFeedHealth();
      return response.status === 'healthy';
    } catch (err) {
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (symbol) {
      fetchData();
    } else {
      fetchSummary();
    }
  }, [symbol, fetchData, fetchSummary]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (symbol) {
        fetchData(true); // Pass true to indicate this is a refresh
      } else {
        fetchSummary(true); // Pass true to indicate this is a refresh
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [symbol, autoRefresh, refreshInterval, fetchData, fetchSummary]);

  // Get latest data for a specific symbol
  const getLatestForSymbol = useCallback((symbolName: string): FeedData | null => {
    return data.find(item => item.tk === symbolName || item.symbol === symbolName) || null;
  }, [data]);

  // Get top gainers
  const getTopGainers = useCallback((count: number = 5): FeedData[] => {
    return data
      .filter(item => item.chp > 0)
      .sort((a, b) => b.chp - a.chp)
      .slice(0, count);
  }, [data]);

  // Get top losers
  const getTopLosers = useCallback((count: number = 5): FeedData[] => {
    return data
      .filter(item => item.chp < 0)
      .sort((a, b) => a.chp - b.chp)
      .slice(0, count);
  }, [data]);

  // Get most active (by volume)
  const getMostActive = useCallback((count: number = 5): FeedData[] => {
    return data
      .sort((a, b) => b.volume - a.volume)
      .slice(0, count);
  }, [data]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    fetchData,
    fetchSummary,
    checkHealth,
    getLatestForSymbol,
    getTopGainers,
    getTopLosers,
    getMostActive,
    refresh: symbol ? fetchData : fetchSummary
  };
} 