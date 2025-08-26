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
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Zap,
  Bell,
  Star,
  Shield,
  Gauge,
  Radio
} from 'lucide-react';
import { BreakoutSignal, SessionSignals } from '../types';
import apiService from '../services/api';

interface SignalsPanelProps {
  symbol?: string;
  className?: string;
}

const ProfessionalSignalsPanel: React.FC<SignalsPanelProps> = ({ symbol, className = '' }) => {
  const [signals, setSignals] = useState<BreakoutSignal[]>([]);
  const [sessionSignals, setSessionSignals] = useState<SessionSignals>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'sessions'>('sessions');
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPoints = (points: number | null | undefined) => {
    if (points === null || points === undefined || isNaN(points)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(points);
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden ${className}`}>
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  LIVE SIGNALS
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-300 uppercase tracking-wide">REAL-TIME MONITORING</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Professional Toggle */}
              <div className="flex bg-slate-800/50 border border-slate-600 rounded-lg p-1.5">
                <button
                  onClick={() => setViewMode('sessions')}
                  className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center space-x-2 uppercase tracking-wider ${
                    viewMode === 'sessions'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Sessions</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center space-x-2 uppercase tracking-wider ${
                    viewMode === 'list'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>List</span>
                </button>
              </div>
              
              {/* Professional Refresh Button */}
              <button
                onClick={fetchSignals}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
                title="Refresh signals"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-sm font-bold text-slate-400">Loading...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-slate-400 hover:text-white" />
                    <span className="text-sm font-bold text-slate-400 hover:text-white">Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        {/* Error and Loading */}
        <div className="flex-shrink-0 px-6 pt-4">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-base text-red-300 font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden px-6 pb-6 relative">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto custom-scrollbar"
          >
            {/* Sessions View */}
            {viewMode === 'sessions' && !loading && (
              <div className="space-y-6">
                {Object.entries(sessionSignals).map(([sessionName, sessionSignalsList]) => (
                  sessionSignalsList.length > 0 && (
                    <div key={sessionName}>
                      <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-800/95 backdrop-blur-sm py-3 px-4 rounded-lg border border-slate-700 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <Radio className="w-5 h-5 text-emerald-400" />
                          <h3 className="font-bold text-white text-lg uppercase tracking-wide">{sessionName}</h3>
                        </div>
                        <span className="text-sm text-slate-300 bg-slate-700 px-3 py-1.5 rounded-lg font-mono border border-slate-600">
                          {sessionSignalsList.length} signal{sessionSignalsList.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-4 mb-8">
                        {sessionSignalsList.map((signal: any) => (
                          <div key={signal.id || signal._id} className="bg-slate-800 border border-slate-600 rounded-xl shadow-lg overflow-hidden">
                            <div className="p-6">
                              {/* Signal Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${
                                    signal.signal_type === 'BUY_CALL' 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {signal.signal_type === 'BUY_CALL' ? (
                                      <TrendingUp className="w-5 h-5" />
                                    ) : (
                                      <TrendingDown className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-white text-lg">
                                      {signal.signal_type?.replace('_', ' ') || 'SIGNAL'}
                                    </h4>
                                    <p className="text-sm text-slate-400">{formatTime(signal.timestamp)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                    signal.confidence >= 70 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : signal.confidence >= 50
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {signal.confidence}% Confidence
                                  </span>
                                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                    signal.status === 'ACTIVE' 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-slate-500/20 text-slate-400'
                                  }`}>
                                    {signal.status}
                                  </span>
                                </div>
                              </div>

                              {/* Signal Reason */}
                              {signal.reason && (
                                <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                  <p className="text-sm text-slate-300">{signal.reason}</p>
                                </div>
                              )}

                              {/* Price Information */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                  <div className="text-xs text-slate-400 mb-1">Entry Price</div>
                                  <div className="font-bold text-white">₹{formatPoints(signal.entry_price)}</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                  <div className="text-xs text-slate-400 mb-1">Stop Loss</div>
                                  <div className="font-bold text-red-400">₹{formatPoints(signal.stop_loss)}</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                  <div className="text-xs text-slate-400 mb-1">Target 1</div>
                                  <div className="font-bold text-emerald-400">₹{formatPoints(signal.target_1)}</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                  <div className="text-xs text-slate-400 mb-1">Target 2</div>
                                  <div className="font-bold text-emerald-400">₹{formatPoints(signal.target_2)}</div>
                                </div>
                              </div>

                              {/* Additional Details */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">NIFTY Price: </span>
                                  <span className="text-white font-medium">₹{formatPoints(signal.nifty_price)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Future Price: </span>
                                  <span className="text-white font-medium">₹{formatPoints(signal.future_price)}</span>
                                </div>
                              </div>

                              {/* Future Symbol */}
                              {signal.future_symbol && (
                                <div className="mt-3 text-sm">
                                  <span className="text-slate-400">Future Symbol: </span>
                                  <span className="text-blue-400 font-mono">{signal.future_symbol}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {Object.keys(sessionSignals).length === 0 && (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">No active signals</h3>
                      <p className="text-slate-400">Signals will appear here when market conditions are met</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && !loading && (
              <div className="space-y-3">
                {signals.length === 0 && (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">No signals available</h3>
                      <p className="text-slate-400">Try switching to Sessions view</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-medium">Loading signals...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Scroll to Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="absolute bottom-4 right-4 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl shadow-xl transition-all duration-200 hover:scale-105"
              title="Scroll to top"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSignalsPanel;