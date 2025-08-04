import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { debounce } from '../utils';

interface StockSearchProps {
  onClose: () => void;
  onAddToWatchlist: (symbol: string) => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export default function StockSearch({ onClose, onAddToWatchlist }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchStocks = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.searchStocks(searchQuery);
      setResults(response.stocks);
    } catch (error) {
      console.error('Failed to search stocks:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    searchStocks(query);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (stock: SearchResult) => {
    onAddToWatchlist(stock.symbol);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div ref={searchRef} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Search Stocks</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for stocks..."
                className="input-field pl-10"
                autoFocus
              />
            </div>

            {loading && (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto">
                <div className="space-y-1">
                  {results.map((stock, index) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock)}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                        index === selectedIndex ? 'bg-primary-50 border border-primary-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{stock.symbol}</p>
                          <p className="text-sm text-gray-500">{stock.name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">{stock.exchange}</span>
                          <Plus size={16} className="text-gray-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="mt-4 text-center text-gray-500">
                No stocks found for "{query}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 