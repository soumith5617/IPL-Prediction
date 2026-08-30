import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function MainLayout({
  systemHealthy = true,
  children
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Map route path to active tab ID
  const getActiveTab = (pathname) => {
    if (pathname.startsWith('/match-prediction')) return 'score';
    if (pathname.startsWith('/live-prediction')) return 'win';
    if (pathname.startsWith('/players')) return 'players';
    if (pathname.startsWith('/teams') || pathname.startsWith('/team-comparison')) return 'teams';
    if (pathname.startsWith('/history')) return 'history';
    if (pathname.startsWith('/model-insights')) return 'metrics';
    if (pathname.startsWith('/about')) return 'about';
    return 'dashboard';
  };

  const activeTab = getActiveTab(location.pathname);

  const handleTabChange = (tabId) => {
    const routeMap = {
      dashboard: '/',
      score: '/match-prediction',
      win: '/live-prediction',
      players: '/players',
      teams: '/teams',
      h2h: '/teams',
      history: '/history',
      metrics: '/model-insights',
      about: '/about'
    };
    navigate(routeMap[tabId] || '/');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex selection:bg-cyan-500 selection:text-black">
      
      {/* Reusable Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        systemHealthy={systemHealthy}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          systemHealthy={systemHealthy}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        {/* Dynamic Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <Outlet />}
        </main>

        {/* Sports Analytics Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 IPL Prediction Intelligence Pro • Production Sports Analytics Platform</p>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>FastAPI Backend</span>
              <span>•</span>
              <span>Scikit-Learn Ensemble</span>
              <span>•</span>
              <span>React 18 + Vite</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
