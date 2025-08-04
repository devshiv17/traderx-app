import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { StockData, CandlestickData as AppCandlestickData, TradingSignal } from '../types';
import { apiService } from '../services/api';
import { useStockData } from '../hooks/useStockData';
import { useSignals } from '../hooks/useSignals';
import { formatCurrency, formatPercentage, getChangeColor, getSignalColor, getSignalIcon } from '../utils';

export default function StockChart() {
  const { symbol } = useParams<{ symbol: string }>();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const signalMarkersRef = useRef<any[]>([]);

  const [timeframe, setTimeframe] = useState<'1d' | '1w' | '1M'>('1d');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [historicalData, setHistoricalData] = useState<AppCandlestickData[]>([]);

  const { stockData, loading: stockLoading } = useStockData({ symbol });
  const { signals, generateSignal } = useSignals({ symbol });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !symbol) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#ddd',
      },
      timeScale: {
        borderColor: '#ddd',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Create SMA series
    const sma20Series = chart.addLineSeries({
      color: '#2196F3',
      lineWidth: 2,
      title: 'SMA 20',
    });
    sma20SeriesRef.current = sma20Series;

    const sma50Series = chart.addLineSeries({
      color: '#FF9800',
      lineWidth: 2,
      title: 'SMA 50',
    });
    sma50SeriesRef.current = sma50Series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  // Fetch historical data
  useEffect(() => {
    if (!symbol) return;

    const fetchHistoricalData = async () => {
      try {
        const response = await apiService.getHistoricalData(symbol, timeframe);
        setHistoricalData(response.data);
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
      }
    };

    fetchHistoricalData();
  }, [symbol, timeframe]);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || !historicalData.length) return;

    const candlestickData: CandlestickData[] = historicalData.map(item => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    const volumeData = historicalData.map(item => ({
      time: item.time,
      value: item.volume || 0,
      color: item.close >= item.open ? '#26a69a' : '#ef5350',
    }));

    // Calculate SMAs
    const sma20Data: LineData[] = [];
    const sma50Data: LineData[] = [];

    for (let i = 19; i < candlestickData.length; i++) {
      const sma20 = candlestickData.slice(i - 19, i + 1).reduce((sum, d) => sum + d.close, 0) / 20;
      sma20Data.push({ time: candlestickData[i].time, value: sma20 });
    }

    for (let i = 49; i < candlestickData.length; i++) {
      const sma50 = candlestickData.slice(i - 49, i + 1).reduce((sum, d) => sum + d.close, 0) / 50;
      sma50Data.push({ time: candlestickData[i].time, value: sma50 });
    }

    // Update series
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(candlestickData);
    }

    if (volumeSeriesRef.current && showVolume) {
      volumeSeriesRef.current.setData(volumeData);
    }

    if (sma20SeriesRef.current && showSMA) {
      sma20SeriesRef.current.setData(sma20Data);
    }

    if (sma50SeriesRef.current && showSMA) {
      sma50SeriesRef.current.setData(sma50Data);
    }

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [historicalData, showVolume, showSMA]);

  // Add signal markers
  useEffect(() => {
    if (!chartRef.current || !signals.length || !historicalData.length) return;

    // Clear existing markers
    signalMarkersRef.current.forEach(marker => {
      chartRef.current?.removeMarkers([marker]);
    });
    signalMarkersRef.current = [];

    // Add new markers for the latest signal
    const latestSignal = signals[0];
    if (latestSignal && historicalData.length > 0) {
      const lastDataPoint = historicalData[historicalData.length - 1];
      
      const markers = [
        {
          time: lastDataPoint.time,
          position: 'aboveBar',
          color: latestSignal.signal === 'BUY' ? '#26a69a' : latestSignal.signal === 'SELL' ? '#ef5350' : '#ff9800',
          shape: 'arrowDown',
          text: `${latestSignal.signal} ${getSignalIcon(latestSignal.signal)}`,
        },
        {
          time: lastDataPoint.time,
          position: 'belowBar',
          color: '#2196F3',
          shape: 'circle',
          text: `Target: ${formatCurrency(latestSignal.targetPrice)}`,
        },
        {
          time: lastDataPoint.time,
          position: 'belowBar',
          color: '#f44336',
          shape: 'circle',
          text: `Stop: ${formatCurrency(latestSignal.stopLoss)}`,
        },
      ];

      chartRef.current.addMarkers(markers);
      signalMarkersRef.current = markers;
    }
  }, [signals, historicalData]);

  const handleGenerateSignal = async () => {
    if (!symbol) return;
    try {
      await generateSignal(symbol);
    } catch (error) {
      console.error('Failed to generate signal:', error);
    }
  };

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No symbol provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{symbol}</h1>
          {stockData && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(stockData.price)}
              </span>
              <span className={`text-lg ${getChangeColor(stockData.changePercent)}`}>
                {formatPercentage(stockData.changePercent)}
              </span>
              <span className="text-sm text-gray-500">
                Vol: {stockData.volume.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleGenerateSignal}
          className="btn-primary flex items-center gap-2"
        >
          <BarChart3 size={16} />
          Generate Signal
        </button>
      </div>

      {/* Chart Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="input-field w-24"
            >
              <option value="1d">1D</option>
              <option value="1w">1W</option>
              <option value="1M">1M</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Chart Type:</span>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="input-field w-32"
            >
              <option value="candlestick">Candlestick</option>
              <option value="line">Line</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => setShowVolume(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Volume</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showSMA}
                onChange={(e) => setShowSMA(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">SMA</span>
            </label>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-0">
        <div ref={chartContainerRef} className="w-full h-[500px]" />
      </div>

      {/* Signals */}
      {signals.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trading Signals</h2>
          <div className="space-y-4">
            {signals.slice(0, 5).map((signal, index) => (
              <div
                key={`${signal.symbol}-${signal.timestamp}-${index}`}
                className={`p-4 rounded-lg border ${getSignalColor(signal.signal)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSignalIcon(signal.signal)}</span>
                    <div>
                      <h3 className="font-semibold">{signal.signal}</h3>
                      <p className="text-sm opacity-75">Confidence: {signal.confidence}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Target: {formatCurrency(signal.targetPrice)}</p>
                    <p className="text-sm">Stop Loss: {formatCurrency(signal.stopLoss)}</p>
                  </div>
                </div>
                {signal.reasoning.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">Reasoning:</p>
                    <ul className="text-sm space-y-1">
                      {signal.reasoning.map((reason, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span>•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 