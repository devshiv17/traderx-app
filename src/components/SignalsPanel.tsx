import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Target, 
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Zap,
  Bell,
  Star,
  Shield,
  Gauge
} from 'lucide-react';
import { BreakoutSignal, SessionSignals } from '../types';
import apiService from '../services/api';

interface SignalsPanelProps {
  symbol?: string;
  className?: string;
}

const SignalsPanel: React.FC<SignalsPanelProps> = ({ symbol, className = '' }) => {
  const [signals, setSignals] = useState<BreakoutSignal[]>([]);
  const [sessionSignals, setSessionSignals] = useState<SessionSignals>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'sessions'>('sessions');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (viewMode === 'sessions') {
        const response = await apiService.getSignalsBySession({ limit: 50 });
        setSessionSignals(response.sessions);
      } else {
        const response = await apiService.getSignalsWithBreakoutDetails({ limit: 50 });
        setSignals(response.signals);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [viewMode]);

  const toggleSignalExpanded = (signalId: string) => {
    const newExpanded = new Set(expandedSignals);
    if (newExpanded.has(signalId)) {
      newExpanded.delete(signalId);
    } else {
      newExpanded.add(signalId);
    }
    setExpandedSignals(newExpanded);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setShowScrollTop(scrollTop > 200);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY_CALL':
        return <TrendingUp className="w-7 h-7 text-green-600" />;
      case 'BUY_PUT':
        return <TrendingDown className="w-7 h-7 text-red-600" />;
      default:
        return <Activity className="w-7 h-7 text-blue-600" />;
    }
  };

  const getBreakoutTypeColor = (breakoutType: string) => {
    switch (breakoutType) {
      case 'BULLISH':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'BEARISH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'DIVERGENT':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatPoints = (points: number | null | undefined) => {
    const formatted = formatPrice(points);
    return formatted; // No currency symbol - these are index points
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderSignalCard = (signal: BreakoutSignal, isCompact = false) => {
    const isExpanded = expandedSignals.has(signal.id);
    const breakoutSummary = signal.breakout_summary;
    
    return (
      <div
        key={signal.id}
        className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-gray-200 dark:border-gray-600 p-6 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm"
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-2xl shadow-lg">
              {getSignalIcon(signal.signal_type)}
            </div>
            <div>
              <div className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {signal.signal_type.replace('_', ' ')}
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">{signal.session_name}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="font-bold">{formatTime(signal.timestamp)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Enhanced Confidence Badge */}
            <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 shadow-sm">
              <Gauge className="w-5 h-5 text-yellow-600" />
              <div className="text-center">
                <div className={`text-lg font-bold ${getConfidenceColor(signal.confidence)}`}>
                  {signal.confidence}%
                </div>
                <div className="text-xs text-yellow-800 dark:text-yellow-200 font-bold">Confidence</div>
              </div>
            </div>
            
            {/* Enhanced Status Badge */}
            <div className={`px-4 py-3 rounded-xl border-2 shadow-sm ${
              signal.status === 'ACTIVE' ? 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:text-green-300 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800' :
              signal.status === 'COMPLETED' ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:text-blue-300 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800' :
              'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 dark:text-gray-300 dark:from-gray-800 dark:to-slate-800 dark:border-gray-600'
            }`}>
              <div className="flex items-center space-x-2">
                {signal.status === 'ACTIVE' && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>}
                <span className="font-bold text-sm">{signal.status}</span>
              </div>
            </div>
            
            {/* Enhanced Expand/Collapse Button */}
            <button
              onClick={() => toggleSignalExpanded(signal.id)}
              className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 border border-gray-200 dark:border-gray-600"
              title={isExpanded ? 'Show less' : 'Show more'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
            </button>
          </div>
        </div>

        {/* Enhanced Display Text */}
        {signal.display_text && (
          <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 text-base">Trading Recommendation</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold leading-relaxed">
                  {signal.display_text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Breakout Summary */}
        {breakoutSummary && (
          <div className="mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 ${getBreakoutTypeColor(breakoutSummary.breakout_type)} shadow-md`}>
              <Zap className="w-4 h-4 mr-2" />
              <span>{breakoutSummary.breakout_type} BREAKOUT</span>
            </div>
          </div>
        )}

        {/* Enhanced Price Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm font-bold text-green-800 dark:text-green-200">Entry Points</div>
            </div>
            <div className="text-xl font-bold text-green-900 dark:text-green-100">
              {formatPoints(signal.entry_price || signal.nifty_price)}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1 font-bold">Recommended Entry</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm font-bold text-blue-800 dark:text-blue-200">{signal.future_symbol || 'Future'}</div>
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {formatPoints(signal.future_price)}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-bold">Current Price</div>
          </div>
        </div>

        {/* Enhanced Stop Loss and Targets */}
        {(signal.stop_loss || signal.target_1 || signal.target_2) && (
          <div className="bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-800 dark:via-gray-700 dark:to-slate-700 rounded-2xl p-6 mb-6 border-2 border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-gray-100">Trading Levels</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {signal.stop_loss && (
                <div className="text-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-4 rounded-2xl border-2 border-red-200 dark:border-red-800 shadow-sm">
                  <div className="text-red-700 font-bold text-xs mb-1">STOP LOSS</div>
                  <div className="text-red-800 dark:text-red-300 font-bold text-lg">{formatPoints(signal.stop_loss)}</div>
                  <div className="text-red-600 text-xs mt-1 font-bold">Risk Management</div>
                </div>
              )}
              {signal.target_1 && (
                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-sm">
                  <div className="text-green-700 font-bold text-xs mb-1">TARGET 1</div>
                  <div className="text-green-800 dark:text-green-300 font-bold text-lg">{formatPoints(signal.target_1)}</div>
                  <div className="text-green-600 text-xs mt-1 font-bold">First Objective</div>
                </div>
              )}
              {signal.target_2 && (
                <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                  <div className="text-blue-700 font-bold text-xs mb-1">TARGET 2</div>
                  <div className="text-blue-800 dark:text-blue-300 font-bold text-lg">{formatPoints(signal.target_2)}</div>
                  <div className="text-blue-600 text-xs mt-1 font-bold">Extended Target</div>
                </div>
              )}
            </div>
            
            {/* Enhanced Risk-Reward Ratio */}
            {signal.stop_loss && signal.target_1 && signal.entry_price && (
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-500">
                <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    Risk-Reward Ratio: 1:{((signal.target_1) / Math.abs(signal.entry_price - signal.stop_loss)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && breakoutSummary && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
            {/* Breakout Status */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NIFTY Status</div>
                <div className={`text-sm font-medium ${
                  breakoutSummary.nifty_status === 'BROKE HIGH' ? 'text-green-600' :
                  breakoutSummary.nifty_status === 'BROKE LOW' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {breakoutSummary.nifty_status}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Future Status</div>
                <div className={`text-sm font-medium ${
                  breakoutSummary.future_status === 'BROKE HIGH' ? 'text-green-600' :
                  breakoutSummary.future_status === 'BROKE LOW' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {breakoutSummary.future_status}
                </div>
              </div>
            </div>

            {/* Enhanced Session Levels */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-700 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-slate-600" />
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Session Levels</div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">NIFTY</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">High</span>
                      <span className="text-sm font-bold text-green-800 dark:text-green-200">{formatPoints(breakoutSummary.levels.nifty_session_high)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">Low</span>
                      <span className="text-sm font-bold text-red-800 dark:text-red-200">{formatPoints(breakoutSummary.levels.nifty_session_low)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">FUTURE</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">High</span>
                      <span className="text-sm font-bold text-green-800 dark:text-green-200">{formatPoints(breakoutSummary.levels.future_session_high)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">Low</span>
                      <span className="text-sm font-bold text-red-800 dark:text-red-200">{formatPoints(breakoutSummary.levels.future_session_low)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced VWAP Information */}
            {(signal.vwap_nifty || signal.vwap_future) && (
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">VWAP Levels</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {signal.vwap_nifty && (
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">NIFTY VWAP</div>
                      <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatPoints(signal.vwap_nifty)}</div>
                    </div>
                  )}
                  {signal.vwap_future && (
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Future VWAP</div>
                      <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatPoints(signal.vwap_future)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl ${className}`}>
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Live Signals
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Real-time trading opportunities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Enhanced View Mode Toggle */}
            <div className="flex bg-white/90 dark:bg-gray-800/90 rounded-xl p-1.5 shadow-md border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setViewMode('sessions')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'sessions'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Sessions</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>List</span>
              </button>
            </div>
            
            {/* Enhanced Refresh Button */}
            <button
              onClick={fetchSignals}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold border border-green-400 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              title="Refresh signals"
            >
              <div className="flex items-center space-x-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-bold">Loading...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span className="text-sm font-bold">Refresh</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="flex flex-col h-full">
        {/* Enhanced Error and Loading Section */}
        <div className="flex-shrink-0 px-6 pt-4">
          {error && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm">Error Loading Signals</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Loading signals...</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Scrollable Content Area */}
        <div className="flex-1 overflow-hidden px-6 pb-6 relative">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto signals-scroll-container scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-600 scrollbar-track-blue-50 dark:scrollbar-track-blue-900/20 hover:scrollbar-thumb-blue-400 dark:hover:scrollbar-thumb-blue-500"
          >
            {/* Enhanced Sessions View */}
            {viewMode === 'sessions' && !loading && (
              <div className="space-y-8 signals-content-padding">
                {Object.entries(sessionSignals).map(([sessionName, sessionSignalsList]) => (
                  sessionSignalsList.length > 0 && (
                    <div key={sessionName}>
                      <div className="flex items-center justify-between mb-4 sticky top-0 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 py-3 px-4 z-10 border-b border-blue-200 dark:border-blue-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{sessionName}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Trading Session</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                            {sessionSignalsList.length} signal{sessionSignalsList.length !== 1 ? 's' : ''}
                          </span>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-4 mb-8">
                        {sessionSignalsList.map((signal) => renderSignalCard(signal))}
                      </div>
                    </div>
                  )
                ))}
                
                {Object.keys(sessionSignals).length === 0 && (
                  <div className="text-center py-12 px-6">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                      <Activity className="w-12 h-12 text-blue-600 animate-pulse" />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Active Signals</h3>
                      <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                        Market analysis in progress. Live trading signals will appear here when opportunities arise.
                      </p>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-base font-bold text-green-800 dark:text-green-200">System Active</span>
                        </div>
                        
                        <div className="space-y-3 text-sm bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100 font-bold">Market Monitoring:</span>
                            <span className="font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">Real-time</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100 font-bold">Signal Detection:</span>
                            <span className="font-bold text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Active</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100 font-bold">Next Scan:</span>
                            <span className="font-bold text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">30s</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <div className="flex items-center justify-center space-x-2 text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg py-2 px-3">
                          <Bell className="w-4 h-4" />
                          <span className="text-sm font-bold">Monitoring market conditions...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced List View */}
            {viewMode === 'list' && !loading && (
              <div className="space-y-4 signals-content-padding">
                {signals.map((signal) => renderSignalCard(signal))}
                
                {signals.length === 0 && (
                  <div className="text-center py-12 px-6">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                      <BarChart3 className="w-12 h-12 text-purple-600 animate-pulse" />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Signals Available</h3>
                      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium max-w-sm mx-auto">
                        Switch to Sessions view or wait for new trading opportunities to be generated.
                      </p>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <span className="text-base font-bold text-purple-800 dark:text-purple-200">Scanning Markets</span>
                        </div>
                        
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                          <p>Try the Sessions view for a chronological display of trading signals organized by market sessions.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Enhanced Scroll to Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="absolute bottom-6 right-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl z-20 border border-blue-400"
              title="Scroll to top"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalsPanel;