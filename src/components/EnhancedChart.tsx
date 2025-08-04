import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Loader2, Clock, RefreshCw, Target, AlertTriangle, Zap } from 'lucide-react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType, Time, LineData } from 'lightweight-charts';
import wsService from '../services/websocket';
import { useChartData } from '../hooks/useChartData';
import apiService from '../services/api';

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  exchange: string;
}

interface TradingSignal {
  id: string;
  time: number;
  type: string;
  price: number;
  confidence: number;
  session_name: string;
  reason: string;
  breakout_type: 'HIGH' | 'LOW';
  vwap?: number;
  session_high?: number;
  session_low?: number;
  status: string;
}

interface EnhancedChartProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  displayName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showSignals?: boolean;
  showVWAP?: boolean;
  showSessionLevels?: boolean;
}

const timeframes = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' }
];

// Signal color mapping
const getSignalColor = (signalType: string) => {
  switch (signalType) {
    case 'BUY_CALL':
      return '#10b981'; // Green
    case 'BUY_PUT':
      return '#ef4444'; // Red  
    case 'SELL_CALL':
      return '#f59e0b'; // Amber
    case 'SELL_PUT':
      return '#8b5cf6'; // Purple
    default:
      return '#6b7280'; // Gray
  }
};

const formatISTTime = (unixTimestamp: number, includeSeconds: boolean = false) => {
  const date = new Date(unixTimestamp * 1000);
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  };
  
  if (includeSeconds) {
    timeOptions.second = '2-digit';
  }
  
  return date.toLocaleTimeString('en-IN', timeOptions);
};

const formatISTDate = (unixTimestamp: number) => {
  const date = new Date(unixTimestamp * 1000);
  
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

export default function EnhancedChart({ 
  symbol, 
  timeframe, 
  onTimeframeChange, 
  displayName, 
  autoRefresh = true, 
  refreshInterval = 5000,
  showSignals = true,
  showVWAP = true,
  showSessionLevels = true
}: EnhancedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sessionHighSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sessionLowSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  const [isRealTime, setIsRealTime] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [activeSignal, setActiveSignal] = useState<TradingSignal | null>(null);
  const [vwapData, setVwapData] = useState<LineData[]>([]);
  const [sessionLevels, setSessionLevels] = useState<{
    high: number | null;
    low: number | null;
    session_name: string | null;
  } | null>(null);

  // Use the chart data hook
  const { 
    data, 
    loading, 
    error, 
    lastUpdate, 
    chartInfo, 
    fetchData, 
    refresh, 
    getLatestPrice, 
    getPriceChange,
    isRealTime: isDataRealTime,
    dataSource 
  } = useChartData(symbol, timeframe, {
    autoRefresh,
    refreshInterval: refreshInterval || 30000, // Default to 30 seconds if not specified
    enabled: !!symbol
  });

  // Load signals for current symbol and date
  const loadSignals = useCallback(async () => {
    if (!symbol || !showSignals) return;
    
    setSignalsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.getChartSignals(symbol, { date: today, timeframe });
      setSignals(response.signals || []);
    } catch (error) {
      console.error('Failed to load signals:', error);
      setSignals([]);
    } finally {
      setSignalsLoading(false);
    }
  }, [symbol, timeframe, showSignals]);

  // Load technical data (VWAP, session levels)
  const loadTechnicalData = useCallback(async () => {
    if (!symbol) return;
    
    try {
      const response = await apiService.getTechnicalAnalysis(symbol);
      const technicalData = response.technical_data;
      
      // Process VWAP data
      if (technicalData.vwap && showVWAP) {
        const vwapValue = technicalData.vwap;
        // Create VWAP line data based on chart data
        if (data.length > 0) {
          const vwapLineData = data.map(candle => ({
            time: candle.time as Time,
            value: vwapValue
          }));
          setVwapData(vwapLineData);
        }
      }
      
      // Get session status for current levels
      const sessionResponse = await apiService.getSessionStatus();
      const sessions = sessionResponse.sessions || [];
      
      // Find most recent completed session with data
      const completedSession = sessions.find((s: any) => 
        s.is_completed && s.session_data && s.session_data[symbol]
      );
      
      if (completedSession && showSessionLevels) {
        const sessionData = completedSession.session_data[symbol];
        setSessionLevels({
          high: sessionData.high,
          low: sessionData.low,
          session_name: completedSession.name
        });
      }
      
    } catch (error) {
      console.error('Failed to load technical data:', error);
    }
  }, [symbol, data, showVWAP, showSessionLevels]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#374151',
      },
      grid: {
        vertLines: { color: '#e5e7eb' },
        horzLines: { color: '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 12,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        borderVisible: false,
        visible: true,
        tickMarkFormatter: (time: number) => {
          return formatISTTime(time, false);
        },
        minBarSpacing: 6,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      watermark: {
        visible: false,
      },
      localization: {
        timeFormatter: (time: number) => {
          return formatISTTime(time, false);
        },
      },
    });

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    // Create VWAP line series
    const vwapSeries = chart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 2,
      lineStyle: 2, // Dotted line
      title: 'VWAP',
      visible: showVWAP,
    });

    // Create session level lines
    const sessionHighSeries = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      lineStyle: 1, // Dashed line
      title: 'Session High',
      visible: showSessionLevels,
    });

    const sessionLowSeries = chart.addLineSeries({
      color: '#06b6d4',
      lineWidth: 1,
      lineStyle: 1, // Dashed line
      title: 'Session Low',
      visible: showSessionLevels,
    });

    // Store references
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    vwapSeriesRef.current = vwapSeries;
    sessionHighSeriesRef.current = sessionHighSeries;
    sessionLowSeriesRef.current = sessionLowSeries;

    return () => {
      chart.remove();
    };
  }, [showVWAP, showSessionLevels]);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !data.length) return;

    const chartData = data.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeriesRef.current.setData(chartData);
    
    // Set current price
    if (data.length > 0) {
      setCurrentPrice(data[data.length - 1].close);
    }
  }, [data]);

  // Update VWAP data
  useEffect(() => {
    if (!vwapSeriesRef.current || !vwapData.length || !showVWAP) return;
    vwapSeriesRef.current.setData(vwapData);
  }, [vwapData, showVWAP]);

  // Update session levels
  useEffect(() => {
    if (!sessionLevels || !data.length || !showSessionLevels) return;

    const timeRange = data.map(d => ({ time: d.time as Time, value: 0 }));

    if (sessionHighSeriesRef.current && sessionLevels.high) {
      const highData = timeRange.map(t => ({ time: t.time, value: sessionLevels.high! }));
      sessionHighSeriesRef.current.setData(highData);
    }

    if (sessionLowSeriesRef.current && sessionLevels.low) {
      const lowData = timeRange.map(t => ({ time: t.time, value: sessionLevels.low! }));
      sessionLowSeriesRef.current.setData(lowData);
    }
  }, [sessionLevels, data, showSessionLevels]);

  // Add signal markers to chart
  useEffect(() => {
    if (!candlestickSeriesRef.current || !signals.length || !showSignals) return;

    const markers = signals.map(signal => ({
      time: signal.time as Time,
      position: signal.breakout_type === 'HIGH' ? 'aboveBar' as const : 'belowBar' as const,
      color: getSignalColor(signal.type),
      shape: signal.type.includes('CALL') ? 'arrowUp' as const : 'arrowDown' as const,
      text: `${signal.type.replace('BUY_', '')} ${signal.confidence}%`,
      size: 2,
      id: signal.id,
    }));

    candlestickSeriesRef.current.setMarkers(markers);
  }, [signals, showSignals]);

  // Load data when symbol or timeframe changes
  useEffect(() => {
    loadSignals();
    loadTechnicalData();
  }, [loadSignals, loadTechnicalData]);

  // WebSocket integration for real-time signals
  useEffect(() => {
    if (!showSignals) return;

    const handleSignalUpdate = (data: any) => {
      if (data.type === 'trading_signal' && data.signal) {
        const signal = data.signal;
        
        // Check if signal is relevant to current symbol
        if (signal.symbol === symbol || signal.future_symbol === symbol) {
          const newSignal: TradingSignal = {
            id: signal.id,
            time: new Date(signal.timestamp).getTime() / 1000,
            type: signal.signal_type,
            price: symbol === 'NIFTY' ? signal.nifty_price : signal.future_price,
            confidence: signal.confidence,
            session_name: signal.session_name,
            reason: signal.reason,
            breakout_type: signal.reason.toLowerCase().includes('high') ? 'HIGH' : 'LOW',
            vwap: symbol === 'NIFTY' ? signal.vwap_nifty : signal.vwap_future,
            session_high: signal.session_high,
            session_low: signal.session_low,
            status: signal.status
          };
          
          setSignals(prev => [...prev, newSignal]);
          setActiveSignal(newSignal);
          
          // Auto-hide active signal after 10 seconds
          setTimeout(() => setActiveSignal(null), 10000);
        }
      }
    };

    // Subscribe and get unsubscribe function
    const unsubscribe = wsService.subscribe('trading_signal', handleSignalUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [symbol, showSignals]);

  // Calculate price change
  const priceChange = getPriceChange();

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {displayName || symbol}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentPrice ? formatPrice(currentPrice) : 
                 data.length > 0 ? formatPrice(data[data.length - 1].close) : 'N/A'}
              </span>
              {data.length > 0 && (
                <div className={`flex items-center space-x-1 text-sm ${
                  priceChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceChange.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {formatPrice(priceChange.change)} ({priceChange.percent.toFixed(2)}%)
                  </span>
                </div>
              )}
              {(isRealTime || isDataRealTime) && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Signal Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = '#'}
              className={`px-2 py-1 text-xs rounded ${
                showSignals ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              Signals
            </button>
            <button
              onClick={() => window.location.href = '#'}
              className={`px-2 py-1 text-xs rounded ${
                showVWAP ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              VWAP
            </button>
            <button
              onClick={() => window.location.href = '#'}
              className={`px-2 py-1 text-xs rounded ${
                showSessionLevels ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Levels
            </button>
          </div>

          {/* Timeframe Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Clock className="w-4 h-4 text-gray-500" />
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => onTimeframeChange(tf.value)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    timeframe === tf.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Signal Alert */}
      {activeSignal && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 ${
          activeSignal.type.includes('CALL') 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span className="font-semibold">
                {activeSignal.type.replace('BUY_', '')} Signal - {activeSignal.confidence}% Confidence
              </span>
            </div>
            <div className="text-sm">
              {activeSignal.session_name} • ₹{formatPrice(activeSignal.price)}
            </div>
          </div>
          <div className="text-sm mt-1 opacity-80">
            {activeSignal.reason}
          </div>
        </div>
      )}

      {/* Session Levels Info */}
      {sessionLevels && showSessionLevels && (
        <div className="mb-4 flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-300">{sessionLevels.session_name}:</span>
            <span className="text-orange-600">High: ₹{formatPrice(sessionLevels.high!)}</span>
            <span className="text-cyan-600">Low: ₹{formatPrice(sessionLevels.low!)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {signals.length} signals today
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="relative w-full h-[calc(100vh-400px)]">
        {(loading || signalsLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Loading chart data...
              </span>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg"
        />
      </div>

      {/* Chart Info & Signal Summary */}
      {data.length > 0 && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Open</div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatPrice(data[0].open)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-xs">High</div>
            <div className="font-semibold text-green-600 text-sm">
              {formatPrice(Math.max(...data.map(d => d.high)))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Low</div>
            <div className="font-semibold text-red-600 text-sm">
              {formatPrice(Math.min(...data.map(d => d.low)))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Close</div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatPrice(data[data.length - 1].close)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Signals</div>
            <div className="font-semibold text-blue-600 text-sm">
              {signals.filter(s => s.status === 'ACTIVE').length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Last Update</div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {lastUpdate ? formatISTTime(lastUpdate.getTime() / 1000, true) : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Error loading chart data</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}