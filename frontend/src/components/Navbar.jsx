import React from 'react';
import { 
  Menu,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  Cpu,
  Trophy
} from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';

export default function Navbar({
  activeTab,
  setActiveTab,
  systemHealthy,
  onOpenMobileMenu
}) {
  const currentItem = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Mobile Menu Trigger + Breadcrumb / Active Page Indicator */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand (Only shown on small screens where sidebar is hidden) */}
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex lg:hidden items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Trophy className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">IPL PREDICTOR</span>
            </div>

            {/* Desktop Page Breadcrumb Title */}
            <div className="hidden lg:flex items-center gap-2.5 text-xs">
              <span className="text-slate-400 font-medium">Workspace</span>
              <span className="text-slate-600">/</span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-bold">
                <currentItem.icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentItem.label}</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px] hidden xl:inline">
                • {currentItem.description}
              </span>
            </div>
          </div>

          {/* Right: Quick Action & Live Telemetry Badge */}
          <div className="flex items-center gap-3">
            {/* Quick Match Action */}
            <button
              onClick={() => setActiveTab('score')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-xs transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Predict Match</span>
            </button>

            {/* System Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner">
              <span className={`w-2 h-2 rounded-full ${systemHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-200 font-mono text-[11px] font-semibold">
                {systemHealthy ? 'ML SYSTEM LIVE' : 'CONNECTING'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
