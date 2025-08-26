import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Filter,
  Grid,
  List,
  Activity,
  Zap,
  Bell
} from 'lucide-react';
import apiService from '../services/api';
import Chart from '../components/Chart';
import EnhancedChart from '../components/EnhancedChart';
import ProfessionalSignalsPanel from '../components/ProfessionalSignalsPanel';

interface Symbol {
  symbol: string;
  name: string;
  exchange: string;
}

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  exchange: string;
}

const AVAILABLE_SYMBOLS: Symbol[] = [
  { symbol: 'NIFTY', name: 'NIFTY 50', exchange: 'NFO' },
  { symbol: 'BANKNIFTY', name: 'BANKNIFTY', exchange: 'NFO' },
  { symbol: 'FINNIFTY', name: 'FINNIFTY', exchange: 'NFO' },
  { symbol: 'MIDCPNIFTY', name: 'MIDCPNIFTY', exchange: 'NFO' },
  { symbol: 'SENSEX', name: 'SENSEX', exchange: 'BFO' },
  { symbol: 'BANKEX', name: 'BANKEX', exchange: 'BFO' },
  // NIFTY Futures
  { symbol: 'NIFTY_FUT1', name: 'NIFTY Futures 1', exchange: 'NFO' },
  { symbol: 'NIFTY_FUT2', name: 'NIFTY Futures 2', exchange: 'NFO' },
  { symbol: 'NIFTY_ALT', name: 'NIFTY Alternative', exchange: 'NFO' }
];

export default function Signals() {
  const [availableSymbols, setAvailableSymbols] = useState<Symbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
  const [timeframe, setTimeframe] = useState('1m');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState<Symbol[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  // Load available symbols on component mount
  const loadAvailableSymbols = async () => {
    try {
      const response = await apiService.getAvailableSymbols();
      setAvailableSymbols(response.symbols);
      setFilteredSymbols(response.symbols);
    } catch (err: any) {
      console.error('❌ Error loading available symbols:', err);
      setError(err.response?.data?.detail || 'Failed to load available symbols');
      // Fallback to default symbols
      setAvailableSymbols(AVAILABLE_SYMBOLS);
      setFilteredSymbols(AVAILABLE_SYMBOLS);
    }
  };

  useEffect(() => {
    loadAvailableSymbols();
  }, []);

  // Filter symbols based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSymbols(availableSymbols);
    } else {
      const filtered = availableSymbols.filter(
        (symbol) =>
          symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSymbols(filtered);
    }
  }, [searchTerm, availableSymbols]);

  // Handle symbol selection
  const handleSymbolSelect = (symbol: Symbol) => {
    setSelectedSymbol(symbol);
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full px-2 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Trading Signals
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Real-time market intelligence and analysis</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getCurrentDate()}</span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Live Market</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {/* Market Indices Panel - Leftmost */}
          <div className="col-span-2">
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-4 sticky top-6 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
              <div className="mb-4">
                <div className="text-center mb-3">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-center space-x-2">
                    <Search className="w-4 h-4 text-blue-500" />
                    <span>Indices</span>
                  </h2>
                </div>
                
                {/* Compact Search Input */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              {/* Compact Symbols List */}
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar space-y-1">
                {filteredSymbols.map((symbol) => (
                  <button
                    key={symbol.symbol}
                    onClick={() => handleSymbolSelect(symbol)}
                    className={`w-full text-left p-2 rounded-lg border transition-all duration-200 ${
                      selectedSymbol?.symbol === symbol.symbol
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-xs truncate mb-1 ${
                          selectedSymbol?.symbol === symbol.symbol
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {symbol.name}
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300 truncate">
                            {symbol.symbol}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">{symbol.exchange}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredSymbols.length === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">No indices found</p>
                  <p className="text-xs">Adjust search</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart Panel - Middle */}
          <div className="col-span-5">
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {selectedSymbol ? (
                <div className="h-full">
                  {/* Chart Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{selectedSymbol.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedSymbol.symbol} • {selectedSymbol.exchange}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-1">
                    <EnhancedChart
                      symbol={selectedSymbol.symbol}
                      displayName={selectedSymbol.name}
                      timeframe={timeframe}
                      onTimeframeChange={handleTimeframeChange}
                      showSignals={true}
                      showVWAP={true}
                      showSessionLevels={true}
                      refreshInterval={60000}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
                      <BarChart3 className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Select Market Index
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Choose an index from the sidebar to view real-time charts and technical analysis
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Live market data available</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            
            {/* Enhanced Error Display */}
            {error && (
              <div className="mt-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-200">Connection Error</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Professional Signals Panel - Uses All Remaining Space */}
          <div className="col-span-5">
            <ProfessionalSignalsPanel 
              symbol={selectedSymbol?.symbol}
              className="h-full max-h-[calc(100vh-140px)]"
            />
          </div>
        </div>

      </div>
    </div>
  );
} 