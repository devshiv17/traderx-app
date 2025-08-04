# Stock Market Analysis & Signals Dashboard - Frontend

A modern React-based frontend for the Stock Market Analysis & Signals Dashboard, built with TypeScript, Tailwind CSS, and real-time WebSocket integration with Angel One market data.

## 🚀 Features

- **Real-time Stock Data**: Live price updates via WebSocket from Angel One
- **Interactive Charts**: Multiple charting libraries with timeframe controls
- **Trading Signals**: Buy/Sell/Hold signals with confidence levels
- **Index Trading**: Focus on major Indian indices (NIFTY, BANKNIFTY, FINNIFTY, etc.)
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Authentication**: User login/register with JWT tokens
- **Watchlist Management**: Add/remove stocks from personal watchlist
- **Market Overview**: Top gainers, losers, and most active stocks
- **Search Functionality**: Real-time stock search with autocomplete
- **Chart Analysis**: Historical data visualization with multiple timeframes

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Charts**: 
  - TradingView Lightweight Charts
  - Recharts
  - ApexCharts
- **Icons**: Lucide React
- **Real-time**: WebSocket
- **State Management**: React Hooks
- **Form Validation**: Custom validation utilities

## 📦 Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

### API Configuration

The frontend is configured to proxy API requests to the backend at `http://localhost:8000`. This is configured in `vite.config.ts`.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   ├── StockSearch.tsx  # Stock search modal
│   │   ├── Chart.tsx        # Chart component with timeframe controls
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── StockChart.tsx   # Stock chart page
│   │   ├── Signals.tsx      # Trading signals page with index charts
│   │   ├── Login.tsx        # Login page
│   │   └── Register.tsx     # Registration page
│   ├── services/           # API and WebSocket services
│   │   ├── api.ts          # HTTP API client
│   │   └── websocket.ts    # WebSocket service
│   ├── hooks/              # Custom React hooks
│   │   ├── useStockData.ts # Stock data hook
│   │   ├── useSignals.ts   # Trading signals hook
│   │   └── useFeedData.ts  # Real-time feed data hook
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # All type definitions
│   ├── utils/              # Utility functions
│   │   ├── cn.ts           # Class name utilities
│   │   └── index.ts        # Formatting and helper functions
│   ├── styles/             # Global styles
│   │   ├── index.css       # Tailwind CSS imports
│   │   └── theme.css       # Theme variables
│   ├── contexts/           # React contexts
│   │   └── ThemeContext.tsx # Theme management
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎨 UI Components

### Layout Component
- Responsive sidebar navigation
- Mobile-friendly hamburger menu
- User profile section
- Notification and settings buttons

### Stock Search
- Real-time autocomplete for indices
- Keyboard navigation
- Click outside to close
- Add to watchlist functionality

### Chart Component
- Interactive price charts
- Multiple timeframe options (1m, 5m, 15m, 1h)
- Real-time data updates
- Responsive design
- Customizable chart types

### Dashboard
- Market overview cards (gainers, losers, most active)
- Personal watchlist table
- Quick actions for adding stocks
- Real-time price updates

### Signals Page
- Index selection interface
- Chart visualization with timeframe controls
- Today's data focus
- Real-time price updates

## 🔌 API Integration

### HTTP API Service
The `apiService` handles all HTTP requests to the backend:

- **Authentication**: Login, register, logout
- **Market Data**: Search, get stock info, historical data
- **Chart Data**: Get chart data with timeframe filtering
- **Trading Signals**: Get and generate signals
- **User Preferences**: Watchlist management

### WebSocket Service
The `wsService` handles real-time updates:

- **Price Updates**: Live stock price changes from Angel One
- **Signal Updates**: Real-time trading signals
- **Connection Management**: Auto-reconnect on disconnection

## 🎯 Key Features Implementation

### Real-time Updates
```typescript
// Subscribe to stock price updates
const unsubscribe = wsService.subscribeToStockUpdates('NIFTY', (data) => {
  setStockData(data);
});

// Subscribe to signal updates
const unsubscribe = wsService.subscribeToSignalUpdates((signal) => {
  setSignals(prev => [signal, ...prev]);
});
```

### Custom Hooks
```typescript
// Use stock data with auto-refresh
const { stockData, loading, error } = useStockData({
  symbol: 'NIFTY',
  autoRefresh: true,
  refreshInterval: 5000
});

// Use trading signals
const { signals, generateSignal } = useSignals({
  symbol: 'NIFTY'
});

// Use real-time feed data
const { feedData, loading } = useFeedData();
```

### Chart Integration
The application supports multiple charting libraries:

1. **TradingView Lightweight Charts**: Professional-grade charts
2. **Recharts**: React-based charting library
3. **ApexCharts**: Feature-rich charting library

### Index Trading Focus
The application is optimized for Indian market indices:

- **NIFTY 50**: Main market index
- **BANKNIFTY**: Banking sector index
- **FINNIFTY**: Financial services index
- **MIDCPNIFTY**: Mid-cap index
- **SENSEX**: BSE main index
- **BANKEX**: BSE banking index

## 📊 Chart Features

### Timeframe Controls
- **1 Minute**: Intraday trading
- **5 Minutes**: Short-term analysis
- **15 Minutes**: Medium-term analysis
- **1 Hour**: Long-term analysis

### Data Visualization
- **Candlestick Charts**: Price action visualization
- **Volume Analysis**: Trading volume indicators
- **Technical Indicators**: Moving averages, RSI, etc.
- **Real-time Updates**: Live price changes

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Environment Setup
Make sure to update the API URLs in the production environment:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_WS_URL=wss://your-api-domain.com/ws
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Development Workflow

1. **Start Backend**: Ensure the FastAPI backend is running on port 8000
2. **Start Frontend**: Run `npm run dev` in the frontend directory
3. **Access Application**: Open `http://localhost:3000`
4. **API Documentation**: Access backend docs at `http://localhost:8000/docs`

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code (if using Prettier)
npm run format
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**: Check if backend is running on port 8000
2. **WebSocket Issues**: Verify WebSocket URL configuration
3. **Chart Not Loading**: Check network requests and API responses
4. **Authentication Issues**: Verify JWT token handling

### Debug Mode

Enable debug logging by setting the environment variable:
```env
VITE_DEBUG=true
```

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full-featured experience
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🎨 Theming

The application supports:
- **Light Theme**: Default theme
- **Dark Theme**: Dark mode support
- **Custom Colors**: Configurable color scheme

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **HTTPS**: Production-ready with SSL/TLS
- **Input Validation**: Client-side validation
- **XSS Protection**: React's built-in protection

## 📈 Performance

- **Code Splitting**: Lazy loading of components
- **Optimized Bundles**: Vite's fast build system
- **Caching**: Efficient caching strategies
- **Real-time Updates**: Optimized WebSocket handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.