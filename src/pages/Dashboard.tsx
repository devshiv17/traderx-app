import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Target, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Settings,
  Bell,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { StockData, User } from '../types';
import { apiService } from '../services/api';
import { useFeedData } from '../hooks/useFeedData';
import { formatCurrency, formatPercentage, getChangeColor, getChangeBgColor } from '../utils';
import StockSearch from '../components/StockSearch';

interface DashboardProps {
  user?: User;
}

interface IndexData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  lastUpdated: string;
  isActive: boolean;
}

interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  entry: number;
  target: number;
  stopLoss: number;
  timestamp: string;
  confidence: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export default function Dashboard({ user }: DashboardProps) {
  // Add null check for user prop
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('1m');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [marketOverview, setMarketOverview] = useState<{
    gainers: StockData[];
    losers: StockData[];
    mostActive: StockData[];
  } | null>(null);
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isRealTime, setIsRealTime] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'signals' | 'portfolio'>('overview');

  // Use feed data hook
  const { 
    data: feedData, 
    loading: feedLoading, 
    error: feedError, 
    lastUpdate: feedLastUpdate,
    getLatestForSymbol,
    getTopGainers,
    getTopLosers,
    getMostActive,
    refresh: refreshFeed
  } = useFeedData({ 
    autoRefresh: isRealTime, 
    refreshInterval: 5000 
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 Feed Data Debug:', {
      feedData,
      feedLoading,
      feedError,
      feedLastUpdate,
      dataLength: feedData?.length || 0
    });
    
    if (feedData && feedData.length > 0) {
      console.log('📊 Latest NIFTY data:', getLatestForSymbol('NIFTY'));
      console.log('📊 Latest BANKNIFTY data:', getLatestForSymbol('BANKNIFTY'));
    }
  }, [feedData, feedLoading, feedError, feedLastUpdate, getLatestForSymbol]);

  // Convert feed data to index data format
  const indices: IndexData[] = [
    {
      symbol: 'NIFTY',
      name: 'NIFTY 50',
      currentPrice: getLatestForSymbol('NIFTY')?.ltpc || 22450.75,
      change: getLatestForSymbol('NIFTY')?.ch || 125.50,
      changePercent: getLatestForSymbol('NIFTY')?.chp || 0.56,
      high: getLatestForSymbol('NIFTY')?.high || 22500.00,
      low: getLatestForSymbol('NIFTY')?.low || 22300.00,
      volume: getLatestForSymbol('NIFTY')?.volume || 125000000,
      lastUpdated: getLatestForSymbol('NIFTY')?.received_at || new Date().toISOString(),
      isActive: true
    },
    {
      symbol: 'BANKNIFTY',
      name: 'NIFTY BANK',
      currentPrice: getLatestForSymbol('BANKNIFTY')?.ltpc || 48500.25,
      change: getLatestForSymbol('BANKNIFTY')?.ch || -85.75,
      changePercent: getLatestForSymbol('BANKNIFTY')?.chp || -0.18,
      high: getLatestForSymbol('BANKNIFTY')?.high || 48700.00,
      low: getLatestForSymbol('BANKNIFTY')?.low || 48300.00,
      volume: getLatestForSymbol('BANKNIFTY')?.volume || 85000000,
      lastUpdated: getLatestForSymbol('BANKNIFTY')?.received_at || new Date().toISOString(),
      isActive: true
    },
    {
      symbol: 'FINNIFTY',
      name: 'NIFTY FINANCIAL SERVICES',
      currentPrice: getLatestForSymbol('FINNIFTY')?.ltpc || 20150.50,
      change: getLatestForSymbol('FINNIFTY')?.ch || 45.25,
      changePercent: getLatestForSymbol('FINNIFTY')?.chp || 0.23,
      high: getLatestForSymbol('FINNIFTY')?.high || 20200.00,
      low: getLatestForSymbol('FINNIFTY')?.low || 20050.00,
      volume: getLatestForSymbol('FINNIFTY')?.volume || 65000000,
      lastUpdated: getLatestForSymbol('FINNIFTY')?.received_at || new Date().toISOString(),
      isActive: true
    },
    {
      symbol: 'SENSEX',
      name: 'S&P BSE SENSEX',
      currentPrice: getLatestForSymbol('SENSEX')?.ltpc || 74500.00,
      change: getLatestForSymbol('SENSEX')?.ch || 225.00,
      changePercent: getLatestForSymbol('SENSEX')?.chp || 0.30,
      high: getLatestForSymbol('SENSEX')?.high || 74600.00,
      low: getLatestForSymbol('SENSEX')?.low || 74200.00,
      volume: getLatestForSymbol('SENSEX')?.volume || 95000000,
      lastUpdated: getLatestForSymbol('SENSEX')?.received_at || new Date().toISOString(),
      isActive: true
    },
    // NIFTY Futures
    {
      symbol: 'NIFTY_FUT1',
      name: 'NIFTY Futures 1',
      currentPrice: getLatestForSymbol('NIFTY_FUT1')?.ltpc || 11400.00,
      change: getLatestForSymbol('NIFTY_FUT1')?.ch || 50.00,
      changePercent: getLatestForSymbol('NIFTY_FUT1')?.chp || 0.44,
      high: getLatestForSymbol('NIFTY_FUT1')?.high || 11450.00,
      low: getLatestForSymbol('NIFTY_FUT1')?.low || 11350.00,
      volume: getLatestForSymbol('NIFTY_FUT1')?.volume || 25000000,
      lastUpdated: getLatestForSymbol('NIFTY_FUT1')?.received_at || new Date().toISOString(),
      isActive: true
    },
    {
      symbol: 'NIFTY_FUT2',
      name: 'NIFTY Futures 2',
      currentPrice: getLatestForSymbol('NIFTY_FUT2')?.ltpc || 13456.00,
      change: getLatestForSymbol('NIFTY_FUT2')?.ch || 75.00,
      changePercent: getLatestForSymbol('NIFTY_FUT2')?.chp || 0.56,
      high: getLatestForSymbol('NIFTY_FUT2')?.high || 13500.00,
      low: getLatestForSymbol('NIFTY_FUT2')?.low || 13400.00,
      volume: getLatestForSymbol('NIFTY_FUT2')?.volume || 18000000,
      lastUpdated: getLatestForSymbol('NIFTY_FUT2')?.received_at || new Date().toISOString(),
      isActive: true
    },
    {
      symbol: 'NIFTY_ALT',
      name: 'NIFTY Alternative',
      currentPrice: getLatestForSymbol('NIFTY_ALT')?.ltpc || 1414.60,
      change: getLatestForSymbol('NIFTY_ALT')?.ch || 8.50,
      changePercent: getLatestForSymbol('NIFTY_ALT')?.chp || 0.60,
      high: getLatestForSymbol('NIFTY_ALT')?.high || 1420.00,
      low: getLatestForSymbol('NIFTY_ALT')?.low || 1400.00,
      volume: getLatestForSymbol('NIFTY_ALT')?.volume || 5000000,
      lastUpdated: getLatestForSymbol('NIFTY_ALT')?.received_at || new Date().toISOString(),
      isActive: true
    }
  ];

  // Set selected index to first one if not set
  useEffect(() => {
    if (!selectedIndex && indices.length > 0) {
      setSelectedIndex(indices[0]);
    }
  }, [indices, selectedIndex]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, watchlistData] = await Promise.all([
          apiService.getMarketOverview(),
          apiService.getWatchlist(),
        ]);
        setMarketOverview(overview);
        setWatchlist(watchlistData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const addToWatchlist = async (symbol: string) => {
    try {
      await apiService.addToWatchlist(symbol);
      const updatedWatchlist = await apiService.getWatchlist();
      setWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await apiService.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getChangeBgColor = (change: number) => {
    return change >= 0 ? 'bg-emerald-50' : 'bg-red-50';
  };

  const getSignalColor = (type: 'BUY' | 'SELL') => {
    return type === 'BUY' ? 'text-emerald-600' : 'text-red-600';
  };

  const getSignalBgColor = (type: 'BUY' | 'SELL') => {
    return type === 'BUY' ? 'bg-emerald-50' : 'bg-red-50';
  };

  const handleIndexSelect = (index: IndexData) => {
    setSelectedIndex(index);
    setIsLoading(true);
    // Simulate data loading
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    await refreshFeed();
    setTimeout(() => setIsLoading(false), 800);
  };

  if (isLoading || feedLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Trading Signals Pro</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-sm text-slate-500">
                <span>Welcome back,</span>
                <span className="font-semibold text-slate-700">{user?.name || 'User'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feed Status */}
        {feedError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">Feed Error: {feedError}</span>
            </div>
          </div>
        )}

        {/* Index Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Market Indices</h2>
              <p className="text-slate-600">
                {feedLastUpdate ? `Last updated: ${feedLastUpdate.toLocaleTimeString()}` : 'Real-time market data'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-1">
                {(['1m', '5m', '15m', '1h', '1d'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      timeframe === tf
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {indices.map((index) => (
              <div
                key={index.symbol}
                onClick={() => handleIndexSelect(index)}
                className={`relative bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${
                  selectedIndex?.symbol === index.symbol
                    ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{index.symbol}</h3>
                      <p className="text-sm text-slate-600">{index.name}</p>
                    </div>
                    {index.isActive && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-slate-900">
                        {formatNumber(index.currentPrice)}
                      </span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${getChangeBgColor(index.change)}`}>
                        {index.change >= 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-semibold ${getChangeColor(index.change)}`}>
                          {index.change >= 0 ? '+' : ''}{formatNumber(index.change)} ({index.changePercent}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">High</span>
                        <p className="font-semibold text-slate-900">{formatNumber(index.high)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Low</span>
                        <p className="font-semibold text-slate-900">{formatNumber(index.low)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedIndex?.symbol === index.symbol && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-4 h-4 bg-primary-500 rotate-45 border-b border-r border-primary-500"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedIndex?.symbol} - {selectedIndex?.name}
                  </h3>
                  <p className="text-slate-600">
                    Real-time price chart with technical analysis
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              {/* Chart Placeholder */}
              <div className="h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Interactive Chart Coming Soon</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Real-time candlestick chart with buy/sell signals
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Metrics */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Technical Indicators</h3>
                <button
                  onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {showAdvancedMetrics ? 'Show Less' : 'Show More'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">RSI</div>
                  <div className="text-sm text-slate-600">65.4</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">MACD</div>
                  <div className="text-sm text-emerald-600">Bullish</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">MA</div>
                  <div className="text-sm text-slate-600">22,450</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">Volume</div>
                  <div className="text-sm text-slate-600">125M</div>
                </div>
              </div>
            </div>
          </div>

          {/* Signals Panel */}
          <div className="space-y-6">
            {/* Active Signals */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Active Signals</h3>
                <span className="text-sm text-slate-500">{signals.length} signals</span>
              </div>
              
              <div className="space-y-4">
                {signals.map((signal) => (
                  <div key={signal.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getSignalBgColor(signal.type)}`}>
                        {signal.type === 'BUY' ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-semibold ${getSignalColor(signal.type)}`}>
                          {signal.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{signal.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Entry</span>
                        <span className="font-semibold text-slate-900">{formatNumber(signal.entry)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Target</span>
                        <span className="font-semibold text-emerald-600">{formatNumber(signal.target)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Stop Loss</span>
                        <span className="font-semibold text-red-600">{formatNumber(signal.stopLoss)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                        <span className="capitalize">{signal.status.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-primary-600" />
                    <span className="font-medium text-slate-900">Set Price Alerts</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-primary-600" />
                    <span className="font-medium text-slate-900">Portfolio Analysis</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-primary-600" />
                    <span className="font-medium text-slate-900">Auto Trading</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 