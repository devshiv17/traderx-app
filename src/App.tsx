import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StockChart from './pages/StockChart';
import Signals from './pages/Signals';
import Login from './pages/Login';
import Register from './pages/Register';
import { User } from './types';
import { apiService } from './services/api';
import './styles/index.css';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // In a real app, you'd validate the token here
      return {
        id: '1',
        email: 'admin@admin.com',
        name: 'Admin User',
        preferences: {
          theme: 'light',
          defaultTimeframe: '1d',
          favoriteStocks: ['AAPL', 'GOOGL', 'MSFT'],
          notifications: {
            priceAlerts: true,
            signalAlerts: true,
            email: false,
          },
        },
      };
    }
    return null;
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleRegister = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Routes>
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? <Navigate to="/dashboard" replace /> : <Register onRegister={handleRegister} />
              } 
            />
            <Route 
              path="/" 
              element={
                user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <Dashboard user={user} />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/chart/:symbol" 
              element={
                user ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <StockChart />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/signals" 
              element={
                user ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <Signals />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App; 