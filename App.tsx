import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import ConsoleMode from './components/ConsoleMode';
import GraphingMode from './components/GraphingMode';
import MatrixMode from './components/MatrixMode';
import AccountingMode from './components/AccountingMode';
import EquationsMode from './components/EquationsMode';
import StatisticsMode from './components/StatisticsMode';
import ComplexMode from './components/ComplexMode';
import VectorsMode from './components/VectorsMode';
import Dashboard from './components/Dashboard';
import { AppMode } from './types';
import { Menu } from 'lucide-react';
import { CalculatorProvider } from './CalculatorContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const App: React.FC = () => {
  const [currentMode, setMode] = useState<AppMode>(AppMode.CONSOLE);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keep-Alive for Render (Ghost requests)
  useEffect(() => {
    if ((import.meta as any).env.PROD) {
      const pingId = setInterval(async () => {
        try {
          console.log('--- Ghost Ping: keeping Render awake ---');
          await fetch(`${API_URL}/health`);
        } catch (e) {
          // Ignore network errors to prevent console spam or crashes
        }
      }, 5 * 60 * 1000); // Every 5 minutes
      
      return () => clearInterval(pingId);
    }
  }, []);

  const renderContent = () => {
    switch (currentMode) {
      case AppMode.CONSOLE:
        return <ConsoleMode />;
      case AppMode.GRAPHING:
        return <GraphingMode />;
      case AppMode.MATRIX:
        return <MatrixMode />;
      case AppMode.ACCOUNTING:
        return <AccountingMode />;
      case AppMode.EQUATIONS:
        return <EquationsMode />;
      case AppMode.STATISTICS:
        return <StatisticsMode />;
      case AppMode.COMPLEX:
        return <ComplexMode />;
      case AppMode.VECTORS:
        return <VectorsMode />;
      case AppMode.DASHBOARD:
        return <Dashboard />;
      default:
        return <ConsoleMode />;
    }
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        <CalculatorProvider>
          <div className="flex h-screen overflow-hidden bg-background text-primary font-sans selection:bg-white/20 selection:text-white">
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
              
              {/* Global Top Bar (Floating Header) */}
              <div className="w-full flex justify-center sticky top-0 z-50 pt-4 px-4 pointer-events-none">
                <div className="pointer-events-auto w-full">
                  <TopBar onNavigate={(mode) => setMode(mode)} currentMode={currentMode} />
                </div>
              </div>

              {/* Content View */}
              <main className="flex-1 overflow-y-auto relative custom-scrollbar flex justify-center pt-8 pb-16 px-4">
                <div className="w-full h-full flex flex-col">
                  {renderContent()}
                </div>
              </main>
            </div>
          </div>
        </CalculatorProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
