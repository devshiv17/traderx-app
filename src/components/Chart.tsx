import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Loader2, Clock, RefreshCw } from 'lucide-react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType, Time } from 'lightweight-charts';
import wsService from '../services/websocket';
import { useChartData } from '../hooks/useChartData';

interface ChartData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  exchange: string;
}

interface ChartProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  displayName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const timeframes = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' }
];

// Utility function to format timestamps in IST timezone
const formatISTTime = (unixTimestamp: number, includeSeconds: boolean = false) => {
  // The backend now sends UTC Unix timestamps
  // We need to format them as IST timezone
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

// Utility function to format date in IST timezone
const formatISTDate = (unixTimestamp: number) => {
  const date = new Date(unixTimestamp * 1000);
  
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

export default function Chart({ symbol, timeframe, onTimeframeChange, displayName, autoRefresh = true, refreshInterval = 5000 }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: any;
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
    refreshInterval,
    enabled: !!symbol
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
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
        barSpacing: 12, // Increased for better readability
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        borderVisible: false,
        visible: true,
        tickMarkFormatter: (time: number) => {
          return formatISTTime(time, false);
        },
        minBarSpacing: 6, // Increased for wider bars
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

    // Remove volume series: do not addHistogramSeries or use volumeSeriesRef
    // Store references
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = null; // Set to null as volume series is removed

    // Setup tooltip functionality
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.padding = '8px 12px';
    tooltip.style.backgroundColor = 'rgba(17, 24, 39, 0.95)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '6px';
    tooltip.style.fontSize = '12px';
    tooltip.style.fontFamily = 'Arial, sans-serif';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    tooltip.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    chartContainerRef.current?.appendChild(tooltip);

    // Handle mouse move for tooltip
    const handleMouseMove = (param: any) => {
      if (param.point === undefined || !param.time || param.seriesData.size === 0) {
        tooltip.style.display = 'none';
        return;
      }

      const candlestickData = param.seriesData.get(candlestickSeries);
      const volumeData = param.seriesData.get(volumeSeriesRef.current); // volumeSeriesRef is null, so this will be undefined

      if (!candlestickData) {
        tooltip.style.display = 'none';
        return;
      }

      const timeString = formatISTTime(param.time, true);
      const dateString = formatISTDate(param.time);

      const priceChange = candlestickData.close - candlestickData.open;
      const priceChangePercent = ((priceChange / candlestickData.open) * 100);

      tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${symbol}</div>
        <div style="color: #9ca3af; font-size: 11px; margin-bottom: 6px;">${dateString} ${timeString}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div>
            <span style="color: #9ca3af;">O:</span> 
            <span style="color: white;">${formatPrice(candlestickData.open)}</span>
          </div>
          <div>
            <span style="color: #9ca3af;">H:</span> 
            <span style="color: #10b981;">${formatPrice(candlestickData.high)}</span>
          </div>
          <div>
            <span style="color: #9ca3af;">L:</span> 
            <span style="color: #ef4444;">${formatPrice(candlestickData.low)}</span>
          </div>
          <div>
            <span style="color: #9ca3af;">C:</span> 
            <span style="color: white;">${formatPrice(candlestickData.close)}</span>
          </div>
        </div>
        <div style="margin-top: 4px; font-size: 11px;">
          <span style="color: #9ca3af;">Change:</span> 
          <span style="color: ${priceChange >= 0 ? '#10b981' : '#ef4444'};">
            ${priceChange >= 0 ? '+' : ''}${formatPrice(priceChange)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)
          </span>
        </div>
        ${volumeData ? `
        <div style="margin-top: 4px; font-size: 11px;">
          <span style="color: #9ca3af;">Volume:</span> 
          <span style="color: white;">${volumeData.value?.toLocaleString() || 'N/A'}</span>
        </div>
        ` : ''}
      `;

      let left = param.point.x + 15;
      let top = param.point.y - 80;

      // Adjust position to keep tooltip within chart bounds
      const chartRect = chartContainerRef.current?.getBoundingClientRect();
      if (chartRect) {
        if (left + 200 > chartRect.width) {
          left = param.point.x - 215;
        }
        if (top < 0) {
          top = param.point.y + 10;
        }
      }

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.display = 'block';
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
      tooltip.style.display = 'none';
    };

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove(handleMouseMove);
    chartContainerRef.current?.addEventListener('mouseleave', handleMouseLeave);

    // Handle resize
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth || 800,
        height: chartContainerRef.current?.clientHeight || 400,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chartContainerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
      chart.unsubscribeCrosshairMove(handleMouseMove);
      tooltip.remove();
      chart.remove();
    };
  }, [symbol]);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || data.length === 0) return;

    // Convert data to lightweight-charts format
    const candlestickData: CandlestickData[] = data.map(item => ({
      time: item.time as Time, // Backend already sends Unix timestamps in seconds
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    // Set data
    candlestickSeriesRef.current.setData(candlestickData);

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }

    console.log('📊 Chart data updated:', candlestickData.length, 'candles');
  }, [data]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!symbol || !candlestickSeriesRef.current) return;

    console.log('🔌 Subscribing to WebSocket updates for:', symbol);
    
    const unsubscribe = wsService.subscribeToStockUpdates(symbol, (newData) => {
      console.log('📡 Received real-time update:', newData);
      setIsRealTime(true);
      
      // Extract price from the correct field
      const price = newData.ltpc || newData.price || newData.close;
      setCurrentPrice(price || null);
      
      // Update the last candle with new data if we have data
      if (data.length > 0 && candlestickSeriesRef.current && price) {
        const lastCandle = data[data.length - 1];
        
        const updatedCandle: CandlestickData = {
          time: lastCandle.time as Time, // Backend already sends Unix timestamps in seconds
          open: lastCandle.open,
          high: Math.max(lastCandle.high, price),
          low: Math.min(lastCandle.low, price),
          close: price,
        };

        // Update the last candle
        candlestickSeriesRef.current.update(updatedCandle);
        
        // Update volume if available
        if (volumeSeriesRef.current && newData.volume) {
          const volumeData = {
            time: lastCandle.time as Time, // Backend already sends Unix timestamps in seconds
            value: (lastCandle.volume || 0) + (newData.volume || 0),
            color: updatedCandle.close >= updatedCandle.open ? '#10b981' : '#ef4444',
          };
          volumeSeriesRef.current.update(volumeData);
        }
        
        console.log('📊 Updated chart with real-time data:', updatedCandle);
      }
    });

    return () => {
      console.log('🔌 Unsubscribing from WebSocket updates for:', symbol);
      unsubscribe();
    };
  }, [symbol, data]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const priceChange = getPriceChange();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {displayName || symbol}
            </h3>
            <div className="flex items-center space-x-2">
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
              {dataSource && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <span>{dataSource}</span>
                </div>
              )}
            </div>
          </div>
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

      {/* Chart Container */}
      <div className="relative w-full h-[calc(100vh-300px)]">
        {loading && (
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

      {/* Chart Info */}
      {data.length > 0 && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
        </div>
      )}
    </div>
  );
} 