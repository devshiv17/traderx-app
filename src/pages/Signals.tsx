import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Loader2,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import apiService from '../services/api';
import Chart from '../components/Chart';
import EnhancedChart from '../components/EnhancedChart';
import SignalsPanel from '../components/SignalsPanel';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-2 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Market Signals
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Real-time market data and charting for major indices
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{getCurrentDate()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-8 gap-2">
          {/* Search Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sticky top-2">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Search Indices
                </h2>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                    placeholder="Search indices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
                </div>
                
              {/* Symbols List */}
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {filteredSymbols.map((symbol) => (
                  <button
                    key={symbol.symbol}
                    onClick={() => handleSymbolSelect(symbol)}
                    className={`w-full text-left p-2 rounded-lg border transition-all duration-200 ${
                      selectedSymbol?.symbol === symbol.symbol
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {symbol.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {symbol.symbol} • {symbol.exchange}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
                      </div>
                    </div>
                  </button>
                ))}
                </div>
                
              {filteredSymbols.length === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">No indices found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
                </div>
                
          {/* Chart Panel */}
          <div className="xl:col-span-5">
            {selectedSymbol ? (
              <div className="h-full">
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
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center h-96 flex items-center justify-center">
                <div>
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select an Index
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose an index from the list to view its chart and market data
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Signals Panel */}
          <div className="xl:col-span-2">
            <SignalsPanel 
              symbol={selectedSymbol?.symbol}
              className="h-full max-h-[calc(100vh-120px)] overflow-hidden"
            />
          </div>
        </div>

        {/* Market Overview */}
        {selectedSymbol && (
          <div className="mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Market Overview - {selectedSymbol.name}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {/* chartData.length > 0 ? formatPrice(chartData[chartData.length - 1].close) : 'N/A' */}
                    N/A
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Current Price</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {/* chartData.length > 0 ? formatPrice(Math.max(...chartData.map(d => d.high))) : 'N/A' */}
                    N/A
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Day High</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {/* chartData.length > 0 ? formatPrice(Math.min(...chartData.map(d => d.low))) : 'N/A' */}
                    N/A
                </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Day Low</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {/* chartData.length > 0 ? formatPrice(chartData[0].open) : 'N/A' */}
                    N/A
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Open</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 