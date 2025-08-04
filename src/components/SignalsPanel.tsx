import React, { useState, useEffect } from 'react';
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
  ChevronUp
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

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY_CALL':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'BUY_PUT':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
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
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getSignalIcon(signal.signal_type)}
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {signal.signal_type.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {signal.session_name} • {formatTime(signal.timestamp)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Confidence Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(signal.confidence)} bg-opacity-10`}>
              {signal.confidence}%
            </span>
            
            {/* Status Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              signal.status === 'ACTIVE' ? 'text-green-600 bg-green-100' :
              signal.status === 'COMPLETED' ? 'text-blue-600 bg-blue-100' :
              'text-gray-600 bg-gray-100'
            }`}>
              {signal.status}
            </span>
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => toggleSignalExpanded(signal.id)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Display Text */}
        {signal.display_text && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {signal.display_text}
            </p>
          </div>
        )}

        {/* Breakout Summary */}
        {breakoutSummary && (
          <div className="mb-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getBreakoutTypeColor(breakoutSummary.breakout_type)}`}>
              {breakoutSummary.breakout_type} BREAKOUT
            </div>
          </div>
        )}

        {/* Price Information */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">NIFTY Price</div>
            <div className="font-semibold text-gray-900 dark:text-white">₹{formatPrice(signal.nifty_price)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{signal.future_symbol}</div>
            <div className="font-semibold text-gray-900 dark:text-white">₹{formatPrice(signal.future_price)}</div>
          </div>
        </div>

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

            {/* Session Levels */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Session Levels</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-green-600 font-medium">High: ₹{formatPrice(breakoutSummary.levels.nifty_session_high)}</div>
                  <div className="text-red-600 font-medium">Low: ₹{formatPrice(breakoutSummary.levels.nifty_session_low)}</div>
                </div>
                <div>
                  <div className="text-green-600 font-medium">High: ₹{formatPrice(breakoutSummary.levels.future_session_high)}</div>
                  <div className="text-red-600 font-medium">Low: ₹{formatPrice(breakoutSummary.levels.future_session_low)}</div>
                </div>
              </div>
            </div>

            {/* VWAP Information */}
            {(signal.vwap_nifty || signal.vwap_future) && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                {signal.vwap_nifty && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">NIFTY VWAP</div>
                    <div className="text-sm font-medium text-blue-600">₹{formatPrice(signal.vwap_nifty)}</div>
                  </div>
                )}
                {signal.vwap_future && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Future VWAP</div>
                    <div className="text-sm font-medium text-blue-600">₹{formatPrice(signal.vwap_future)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trading Signals
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('sessions')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'sessions'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                List
              </button>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchSignals}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading signals...</span>
          </div>
        )}

        {/* Sessions View */}
        {viewMode === 'sessions' && !loading && (
          <div className="space-y-6">
            {Object.entries(sessionSignals).map(([sessionName, sessionSignalsList]) => (
              sessionSignalsList.length > 0 && (
                <div key={sessionName}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{sessionName}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {sessionSignalsList.length} signal{sessionSignalsList.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {sessionSignalsList.map((signal) => renderSignalCard(signal))}
                  </div>
                </div>
              )
            ))}
            
            {Object.keys(sessionSignals).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No signals found for today</p>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && !loading && (
          <div className="space-y-3">
            {signals.map((signal) => renderSignalCard(signal))}
            
            {signals.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No signals available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalsPanel;