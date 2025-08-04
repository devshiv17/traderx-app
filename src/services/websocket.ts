import { WebSocketMessage, StockData, TradingSignal } from '../types';

type WebSocketCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private callbacks: Map<string, WebSocketCallback[]> = new Map();
  private isConnecting = false;
  private subscribedSymbols: Set<string> = new Set();
  private pingInterval: number | null = null;

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    const token = localStorage.getItem('authToken');
    const wsUrl = token 
      ? `ws://localhost:8000/ws?token=${token}`
      : 'ws://localhost:8000/ws';

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Start ping interval
      this.startPingInterval();
      
      // Resubscribe to symbols after reconnection
      this.resubscribeToSymbols();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
      this.stopPingInterval();
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('📡 WebSocket message received:', message);
    
    const callbacks = this.callbacks.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(message.data));
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000); // Send ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private resubscribeToSymbols(): void {
    this.subscribedSymbols.forEach(symbol => {
      this.subscribeToSymbol(symbol);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  public subscribe(event: string, callback: WebSocketCallback): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    
    this.callbacks.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  public subscribeToSymbol(symbol: string): void {
    if (this.subscribedSymbols.has(symbol)) {
      console.log(`Already subscribed to ${symbol}`);
      return;
    }

    this.subscribedSymbols.add(symbol);
    this.send({ type: 'subscribe', symbol });
    console.log(`Subscribed to ${symbol} updates`);
  }

  public unsubscribeFromSymbol(symbol: string): void {
    if (!this.subscribedSymbols.has(symbol)) {
      console.log(`Not subscribed to ${symbol}`);
      return;
    }

    this.subscribedSymbols.delete(symbol);
    this.send({ type: 'unsubscribe', symbol });
    console.log(`Unsubscribed from ${symbol} updates`);
  }

  public subscribeToStockUpdates(symbol: string, callback: (data: StockData) => void): () => void {
    // Subscribe to the symbol
    this.subscribeToSymbol(symbol);
    
    // Return subscription for price updates
    const unsubscribe = this.subscribe('price_update', (data) => {
      if (data.symbol === symbol) {
        callback(data);
      }
    });

    // Return cleanup function
    return () => {
      unsubscribe();
      this.unsubscribeFromSymbol(symbol);
    };
  }

  public subscribeToSignalUpdates(callback: (signal: TradingSignal) => void): () => void {
    return this.subscribe('signal_update', callback);
  }

  public subscribeToPriceUpdates(callback: (data: StockData) => void): () => void {
    return this.subscribe('price_update', callback);
  }

  public subscribeToChartUpdates(symbol: string, callback: (data: any) => void): () => void {
    // Subscribe to the symbol
    this.subscribeToSymbol(symbol);
    
    // Return subscription for chart updates
    const unsubscribe = this.subscribe('chart_update', (data) => {
      if (data.symbol === symbol) {
        callback(data);
      }
    });

    // Return cleanup function
    return () => {
      unsubscribe();
      this.unsubscribeFromSymbol(symbol);
    };
  }

  public send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  public disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
    this.subscribedSymbols.clear();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
export default wsService; 