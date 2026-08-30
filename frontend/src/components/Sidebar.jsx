import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Percent, 
  Users, 
  Swords, 
  History, 
  BrainCircuit, 
  Activity, 
  X, 
  ChevronRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', path: '/', label: 'Dashboard', description: 'Match Overview & Telemetry', icon: Activity },
  { id: 'score', path: '/match-prediction', label: 'Match Prediction', description: '1st Innings Final Score', icon: TrendingUp, badge: 'ML Score' },
  { id: 'win', path: '/live-prediction', label: 'Live Prediction', description: '2nd Innings Win Probability', icon: Percent, badge: 'Live AI' },
  { id: 'players', path: '/players', label: 'Players', description: '560+ Verified Cricketers', icon: Users },
  { id: 'teams', path: '/teams', label: 'Teams', description: 'Franchise Rivalry & Rosters', icon: Swords },
  { id: 'history', path: '/history', label: 'Prediction History', description: 'Audit Log & Exports', icon: History },
  { id: 'metrics', path: '/model-insights', label: 'Model Insights', description: 'Feature Importance & Weights', icon: BrainCircuit, badge: 'Telemetry' },
  { id: 'about', path: '/about', label: 'About', description: 'Architecture & Information', icon: Sparkles },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  systemHealthy,
  mobileOpen = false,
  setMobileOpen
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container (Desktop static or Mobile drawer) */}
      <aside className={`
        fixed lg:sticky top-0 h-screen z-50
        w-72 bg-[#0E1424] border-r border-slate-800/80
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Branding */}
        <div>
          <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
            <div 
              onClick={() => {
                setActiveTab('dashboard');
                if (setMobileOpen) setMobileOpen(false);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    IPL PREDICTOR
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 -mt-0.5 font-medium">Enterprise Cricket AI</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (setMobileOpen) setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal truncate">{item.description}</div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Status Widget */}
        <div className="p-4 m-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              System Health
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${systemHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-mono text-slate-300">
                {systemHealthy ? 'ONLINE' : 'CONNECTING'}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <div className="flex justify-between">
              <span>Score Regressor:</span>
              <span className="text-cyan-400 font-semibold">Random Forest</span>
            </div>
            <div className="flex justify-between">
              <span>Win Classifier:</span>
              <span className="text-emerald-400 font-semibold">Grad Boosting</span>
            </div>
            <div className="flex justify-between">
              <span>Dataset Records:</span>
              <span className="text-white">50,000+ Balls</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
