import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Bell, 
  Settings, 
  LogOut, 
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Signals', href: '/signals', icon: TrendingUp },
];

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-opacity-90" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-primary-600">Stock Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    isActive
                      ? "bg-primary-100 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors duration-200",
                      isActive 
                        ? "text-primary-500 dark:text-primary-400" 
                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={onLogout}
              className="mt-3 flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
        desktopSidebarCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className={cn(
              "text-xl font-bold text-primary-600 transition-opacity duration-300",
              desktopSidebarCollapsed ? "opacity-0 lg:hidden" : "opacity-100"
            )}>
              {!desktopSidebarCollapsed && "Stock Dashboard"}
            </h1>
            <button
              onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              title={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu size={20} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200",
                    desktopSidebarCollapsed ? "justify-center" : "",
                    isActive
                      ? "bg-primary-100 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                  title={desktopSidebarCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      desktopSidebarCollapsed ? "mr-0" : "mr-3",
                      isActive 
                        ? "text-primary-500 dark:text-primary-400" 
                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                    )}
                  />
                  <span className={cn(
                    "transition-opacity duration-200",
                    desktopSidebarCollapsed ? "opacity-0 lg:hidden" : "opacity-100"
                  )}>
                    {!desktopSidebarCollapsed && item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className={cn(
              "flex items-center",
              desktopSidebarCollapsed ? "justify-center" : "justify-between"
            )}>
              <div className={cn(
                "flex items-center",
                desktopSidebarCollapsed ? "justify-center" : ""
              )}>
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                {!desktopSidebarCollapsed && (
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                )}
              </div>
              {!desktopSidebarCollapsed && <ThemeToggle />}
            </div>
            <button
              onClick={onLogout}
              className={cn(
                "mt-3 flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors duration-200",
                desktopSidebarCollapsed ? "justify-center" : ""
              )}
              title={desktopSidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut className={cn(
                "h-5 w-5 text-gray-400 dark:text-gray-500 transition-all duration-200",
                desktopSidebarCollapsed ? "mr-0" : "mr-3"
              )} />
              <span className={cn(
                "transition-opacity duration-200",
                desktopSidebarCollapsed ? "opacity-0 lg:hidden" : "opacity-100"
              )}>
                {!desktopSidebarCollapsed && "Logout"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        desktopSidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 shadow-sm sm:gap-x-6 sm:px-4 lg:px-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <ThemeToggle />
              <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300">
                <Bell className="h-5 w-5" />
              </button>
              <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-2">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 