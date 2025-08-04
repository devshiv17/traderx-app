import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  AlertCircle,
  BarChart3,
  Settings,
  PlayCircle,
  PauseCircle,
  Loader2
} from 'lucide-react';
import SignalsPanel from '../components/SignalsPanel';
import { useBreakoutSignals } from '../hooks/useBreakoutSignals';
import apiService from '../services/api';

interface MonitoringStatus {
  monitoring_active: boolean;
  market_hours: boolean;
  current_time_ist: string;
  service_status: string;
  latest_signal?: any;
}

interface SessionStatus {
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_completed: boolean;
  session_data?: any;
}

export default function BreakoutSignals() {
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    signals,
    sessionSignals,
    loading: signalsLoading,
    error: signalsError,
    refetch: refetchSignals
  } = useBreakoutSignals({
    autoRefresh: true,
    refreshInterval: 30000,
    viewMode: 'sessions'
  });

  const fetchMonitoringStatus = async () => {
    try {
      const [monitoringResponse, sessionResponse] = await Promise.all([
        apiService.getMonitoringStatus(),
        apiService.getSessionStatus()
      ]);
      
      setMonitoringStatus(monitoringResponse);
      setSessionStatus(sessionResponse.sessions || []);
    } catch (err: any) {
      console.error('Error fetching status:', err);
      setError(err.response?.data?.detail || 'Failed to fetch status');
    }
  };

  const toggleMonitoring = async () => {
    setLoading(true);
    try {
      if (monitoringStatus?.monitoring_active) {
        await apiService.stopSignalMonitoring();
      } else {
        await apiService.startSignalMonitoring();
      }
      
      // Refresh status after toggle
      setTimeout(() => {
        fetchMonitoringStatus();
        refetchSignals();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to toggle monitoring');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringStatus();
    
    // Refresh status every minute
    const interval = setInterval(fetchMonitoringStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrentSessionInfo = () => {
    const activeSession = sessionStatus.find(s => s.is_active);
    const completedSessions = sessionStatus.filter(s => s.is_completed);
    const pendingSessions = sessionStatus.filter(s => !s.is_active && !s.is_completed);
    
    return { activeSession, completedSessions, pendingSessions };
  };

  const { activeSession, completedSessions, pendingSessions } = getCurrentSessionInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Breakout Signals
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Real-time session-based breakout signals with NIFTY and Futures analysis
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Monitoring Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Monitoring</h3>
              </div>
              <button
                onClick={toggleMonitoring}
                disabled={loading}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  monitoringStatus?.monitoring_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : monitoringStatus?.monitoring_active ? (
                  <PauseCircle className="w-3 h-3" />
                ) : (
                  <PlayCircle className="w-3 h-3" />
                )}
                <span>{monitoringStatus?.service_status || 'Unknown'}</span>
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Market Hours:</span>
                <span className={monitoringStatus?.market_hours ? 'text-green-600' : 'text-red-600'}>
                  {monitoringStatus?.market_hours ? 'Open' : 'Closed'}
                </span>
              </div>
              {monitoringStatus?.current_time_ist && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">IST Time:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatTime(monitoringStatus.current_time_ist)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Active Session */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Current Session</h3>
            </div>
            
            {activeSession ? (
              <div className="space-y-2">
                <div className="font-medium text-orange-600">{activeSession.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {activeSession.start_time} - {activeSession.end_time}
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-orange-600 font-medium">ACTIVE</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {pendingSessions.length > 0 ? (
                  <>
                    <div>Next: {pendingSessions[0].name}</div>
                    <div>{pendingSessions[0].start_time} - {pendingSessions[0].end_time}</div>
                  </>
                ) : (
                  'No active session'
                )}
              </div>
            )}
          </div>

          {/* Signal Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Today's Signals</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                <span className="font-medium text-gray-900 dark:text-white">{signals.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Active:</span>
                <span className="font-medium text-green-600">
                  {signals.filter(s => s.status === 'ACTIVE').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sessions:</span>
                <span className="font-medium text-blue-600">
                  {Object.keys(sessionSignals).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Status Bar */}
        {sessionStatus.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Session Timeline</h3>
            <div className="flex items-center space-x-4 overflow-x-auto">
              {sessionStatus.map((session, index) => (
                <div
                  key={session.name}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg border text-sm ${
                    session.is_active
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : session.is_completed
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="font-medium">{session.name}</div>
                  <div className="text-xs opacity-75">
                    {session.start_time} - {session.end_time}
                  </div>
                  {session.is_active && (
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-xs">ACTIVE</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Signals Panel */}
          <SignalsPanel className="min-h-[600px]" />
        </div>

        {/* Error Display */}
        {(error || signalsError) && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">
                {error || signalsError}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}