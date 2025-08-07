// Stock Data Types
export interface StockData {
  symbol: string;
  name?: string;
  price?: number;
  ltpc?: number; // Last traded price from WebSocket
  ch?: number; // Change
  chp?: number; // Change percent
  change?: number;
  changePercent?: number;
  volume: number;
  marketCap?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  previousClose?: number;
  timestamp?: string;
  received_at?: string;
  exchange?: string;
}

// Candlestick Data for Charts
export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Technical Indicators
export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sma: {
    sma20: number;
    sma50: number;
    sma200: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  volume: number;
}

// Trading Signals
export interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  targetPrice: number;
  stopLoss: number;
  reasoning: string[];
  timestamp: string;
  indicators: {
    rsi: string;
    macd: string;
    sma: string;
    volume: string;
  };
}

// Enhanced Trading Signal with Breakout Details
export interface BreakoutSignal {
  id: string;
  session_name: string;
  signal_type: 'BUY_CALL' | 'BUY_PUT';
  reason: string;
  timestamp: string;
  nifty_price: number;
  future_price: number;
  future_symbol: string;
  entry_price: number;
  stop_loss?: number;
  target_1?: number;
  target_2?: number;
  confidence: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  session_high: number;
  session_low: number;
  future_session_high?: number;
  future_session_low?: number;
  vwap_nifty?: number;
  vwap_future?: number;
  breakout_details?: {
    nifty_breaks_high: boolean;
    nifty_breaks_low: boolean;
    future_breaks_high: boolean;
    future_breaks_low: boolean;
    nifty_breakout_amount: number;
    future_breakout_amount: number;
  };
  breakout_summary?: {
    display_text: string;
    nifty_status: 'BROKE HIGH' | 'BROKE LOW' | 'HELD';
    future_status: 'BROKE HIGH' | 'BROKE LOW' | 'HELD';
    breakout_type: 'BULLISH' | 'BEARISH' | 'DIVERGENT';
    levels: {
      nifty_session_high: number;
      nifty_session_low: number;
      future_session_high: number;
      future_session_low: number;
      nifty_price_at_signal: number;
      future_price_at_signal: number;
    };
  };
  display_text?: string;
}

// Session-grouped signals
export interface SessionSignals {
  [sessionName: string]: BreakoutSignal[];
}

// Chart signal for display
export interface ChartSignal {
  id: string;
  time: number; // Unix timestamp
  type: 'BUY_CALL' | 'BUY_PUT';
  price: number;
  confidence: number;
  session_name: string;
  reason: string;
  breakout_type: 'HIGH' | 'LOW';
  vwap?: number;
  session_high?: number;
  session_low?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface StockSearchResponse {
  stocks: Array<{
    symbol: string;
    name: string;
    exchange: string;
  }>;
}

export interface HistoricalDataResponse {
  symbol: string;
  data: CandlestickData[];
  timeframe: string;
}

export interface SignalsResponse {
  signals: TradingSignal[];
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'price_update' | 'signal_update' | 'chart_update' | 'market_data' | 'subscription_confirmed' | 'unsubscription_confirmed' | 'pong' | 'heartbeat' | 'error';
  data: any;
  timestamp: string;
  symbol?: string;
  timeframe?: string;
}

// Chart Configuration
export interface ChartConfig {
  type: 'candlestick' | 'line';
  timeframe: '1m' | '5m' | '15m' | '1h' | '1d' | '1w' | '1M';
  indicators: string[];
}

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultTimeframe: string;
  favoriteStocks: string[];
  notifications: {
    priceAlerts: boolean;
    signalAlerts: boolean;
    email: boolean;
  };
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
} 