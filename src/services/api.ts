import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  StockData, 
  CandlestickData, 
  TradingSignal, 
  ApiResponse, 
  StockSearchResponse, 
  HistoricalDataResponse, 
  SignalsResponse,
  LoginCredentials,
  AuthResponse,
  User
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Use full backend URL for development
    const baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000/api/v1'
      : '/api/v1';
    
    this.api = axios.create({
      baseURL,
      timeout: 30000, // Increased timeout to 30 seconds for chart data
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: { email: string; password: string; name: string }): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    localStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  // Feed Endpoints
  async getLatestMarketData(symbol?: string, limit: number = 100): Promise<any> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    if (limit) params.append('limit', limit.toString());
    
    const response: AxiosResponse<any> = await this.api.get(`/feed/latest?${params.toString()}`);
    return response.data;
  }

  async getMarketSummary(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/feed/summary');
    return response.data;
  }

  async getFeedHealth(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/feed/health');
    return response.data;
  }

  // Stock Data
  async searchStocks(query: string): Promise<StockSearchResponse> {
    const response: AxiosResponse<ApiResponse<StockSearchResponse>> = await this.api.get(`/stocks/search?q=${query}`);
    return response.data.data;
  }

  async getStockData(symbol: string): Promise<StockData> {
    const response: AxiosResponse<ApiResponse<StockData>> = await this.api.get(`/stocks/${symbol}`);
    return response.data.data;
  }

  async getHistoricalData(symbol: string, timeframe: string = '1d'): Promise<HistoricalDataResponse> {
    const response: AxiosResponse<ApiResponse<HistoricalDataResponse>> = await this.api.get(
      `/stocks/${symbol}/historical?timeframe=${timeframe}`
    );
    return response.data.data;
  }

  async getMultipleStockData(symbols: string[]): Promise<StockData[]> {
    const response: AxiosResponse<ApiResponse<StockData[]>> = await this.api.post('/stocks/batch', { symbols });
    return response.data.data;
  }

  // Trading Signals
  async getSignals(symbol?: string): Promise<TradingSignal[]> {
    // Use the working direct endpoint
    const response: AxiosResponse<any> = await this.api.get('/signals/direct');
    return response.data.signals || [];
  }

  async generateSignal(symbol: string): Promise<TradingSignal> {
    const response: AxiosResponse<ApiResponse<TradingSignal>> = await this.api.post(`/signals/generate`, { symbol });
    return response.data.data;
  }

  // User Preferences
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/user/preferences', preferences);
    return response.data.data;
  }

  async getFavorites(): Promise<string[]> {
    const response: AxiosResponse<ApiResponse<string[]>> = await this.api.get('/user/favorites');
    return response.data.data;
  }

  async addToFavorites(symbol: string): Promise<void> {
    await this.api.post('/user/favorites', { symbol });
  }

  async removeFromFavorites(symbol: string): Promise<void> {
    await this.api.delete(`/user/favorites/${symbol}`);
  }

  // Market Data
  async getMarketOverview(): Promise<{
    gainers: StockData[];
    losers: StockData[];
    mostActive: StockData[];
  }> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/market/overview');
    return response.data.data;
  }

  async getWatchlist(): Promise<StockData[]> {
    const response: AxiosResponse<ApiResponse<StockData[]>> = await this.api.get('/user/watchlist');
    return response.data.data;
  }

  async addToWatchlist(symbol: string): Promise<void> {
    await this.api.post('/user/watchlist', { symbol });
  }

  async removeFromWatchlist(symbol: string): Promise<void> {
    await this.api.delete(`/user/watchlist/${symbol}`);
  }

  // Chart Data
  async getChartData(symbol: string, timeframe: string = '1m', date?: string): Promise<{
    symbol: string;
    timeframe: string;
    date: string;
    data: Array<{
      time: number; // Unix timestamp in seconds
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      symbol: string;
      exchange: string;
    }>;
    count: number;
    data_source: string;
    latest_price: number;
    real_time: boolean;
    tick_count: number;
  }> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    if (date) params.append('date', date);
    
    const response: AxiosResponse<any> = await this.api.get(
      `/chart-data/${symbol}?${params.toString()}`
    );
    // The backend returns the data directly, not wrapped in a data property
    return response.data;
  }

  async getAvailableSymbols(): Promise<{
    symbols: Array<{
      symbol: string;
      name: string;
      exchange: string;
    }>;
    count: number;
  }> {
    const response: AxiosResponse<any> = await this.api.get('/available-symbols');
    // The backend returns the data directly, not wrapped in a data property
    return response.data;
  }

  // Signal Detection API methods
  async startSignalMonitoring(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/signals/start-monitoring');
    return response.data;
  }

  async stopSignalMonitoring(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/signals/stop-monitoring');
    return response.data;
  }

  async getActiveSignals(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/signals/active');
    return response.data;
  }

  async getSignalHistory(params?: {
    limit?: number;
    symbol?: string;
    signal_type?: string;
    session_name?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.symbol) queryParams.append('symbol', params.symbol);
    if (params?.signal_type) queryParams.append('signal_type', params.signal_type);
    if (params?.session_name) queryParams.append('session_name', params.session_name);
    
    const response: AxiosResponse<any> = await this.api.get(`/signals/history?${queryParams.toString()}`);
    return response.data;
  }

  async getSessionStatus(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/signals/sessions');
    return response.data;
  }

  async getTechnicalAnalysis(symbol: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/signals/technical/${symbol}`);
    return response.data;
  }

  async getMonitoringStatus(): Promise<any> {
    // Use the new today-only endpoint that properly filters current day data
    const response: AxiosResponse<any> = await this.api.get('/signals/today');
    return response.data;
  }

  async getTodaySignals(): Promise<any> {
    // Use the new today-only endpoint that returns pre-filtered data
    const response: AxiosResponse<any> = await this.api.get('/signals/today');
    return response.data;
  }

  async getChartSignals(symbol: string, params?: {
    date?: string;
    timeframe?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.timeframe) queryParams.append('timeframe', params.timeframe);
    
    const response: AxiosResponse<any> = await this.api.get(`/signals/chart-signals/${symbol}?${queryParams.toString()}`);
    return response.data;
  }

  async getSignalPerformance(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/signals/performance');
    return response.data;
  }

  // New enhanced signal endpoints
  async getSignalsWithBreakoutDetails(params?: {
    limit?: number;
    session_name?: string;
  }): Promise<any> {
    // Use the working direct endpoint
    const response: AxiosResponse<any> = await this.api.get('/signals/direct');
    return { signals: response.data.signals || [] };
  }

  async getSignalsBySession(params?: {
    date?: string;
    limit?: number;
  }): Promise<any> {
    // Use the working monitoring-status endpoint which has all_signals
    const response: AxiosResponse<any> = await this.api.get('/signals/monitoring-status');
    const signals = response.data.all_signals || [];
    
    // Group signals by session manually
    const sessions: { [key: string]: any[] } = {};
    signals.forEach((signal: any) => {
      const sessionName = signal.session_name || 'Unknown Session';
      if (!sessions[sessionName]) {
        sessions[sessionName] = [];
      }
      sessions[sessionName].push(signal);
    });
    
    return { sessions };
  }

  async getSignalHistoryGrouped(params?: {
    limit?: number;
    symbol?: string;
    signal_type?: string;
    session_name?: string;
    group_by_session?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.symbol) queryParams.append('symbol', params.symbol);
    if (params?.signal_type) queryParams.append('signal_type', params.signal_type);
    if (params?.session_name) queryParams.append('session_name', params.session_name);
    if (params?.group_by_session) queryParams.append('group_by_session', 'true');
    
    const response: AxiosResponse<any> = await this.api.get(`/signals/history?${queryParams.toString()}`);
    return response.data;
  }

  async getChartSignalsGrouped(symbol: string, params?: {
    date?: string;
    timeframe?: string;
    group_by_session?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.timeframe) queryParams.append('timeframe', params.timeframe);
    if (params?.group_by_session) queryParams.append('group_by_session', 'true');
    
    const response: AxiosResponse<any> = await this.api.get(`/signals/chart-signals/${symbol}?${queryParams.toString()}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 