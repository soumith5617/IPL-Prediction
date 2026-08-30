import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Activity, 
  Users, 
  TrendingUp, 
  Percent, 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  ArrowRight,
  Medal,
  Zap
} from 'lucide-react';
import { fetchDashboardSummary } from '../services/api';

export default function DashboardOverview({ setActiveTab, teams }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboardSummary();
      setSummary(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-[#0E1726] to-cyan-950 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            IPL Intelligence & Analytics Suite
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight font-sans">
            Next-Generation <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300">
              IPL Machine Learning
            </span> Prediction System
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            Real-time cricket analytics engine delivering first-innings score forecasting, second-innings chase probability estimation, franchise rivalry intelligence, and player performance profiles.
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('score')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
            >
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              Predict 1st Innings Score
            </button>

            <button
              onClick={() => setActiveTab('win')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-sm transition transform hover:-translate-y-0.5"
            >
              <Percent className="w-4 h-4 text-emerald-400" />
              Calculate Win Probability
            </button>

            <button
              onClick={() => setActiveTab('h2h')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition"
            >
              Compare Franchises
            </button>
          </div>
        </div>
      </div>

      {/* High Level Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Matches Analyzed</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {summary ? summary.total_matches : '577+'}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Player Database</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {summary ? summary.total_players : '566+'}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Canonical Teams</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              10 Franchises
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Model Precision</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              96.9% AUC
            </div>
          </div>
        </div>
      </div>

      {/* Standings & Leaders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top IPL Franchises */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Franchise Honor Roll & Champions
            </h2>
            <button
              onClick={() => setActiveTab('h2h')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Compare All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {teams.slice(0, 5).map((t, idx) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-500">
                    #{idx + 1}
                  </span>
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: t.primary_color }} 
                  />
                  <div>
                    <span className="font-bold text-sm text-white">{t.name}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {t.matches_won} wins in {t.matches_played} matches
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 font-bold text-amber-400 text-xs justify-end">
                    <Medal className="w-3.5 h-3.5" />
                    <span>{t.titles} Titles</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    {t.win_percentage}% Win Rate
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orange Cap & Purple Cap Leaders */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Orange Cap */}
          <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                All-Time Run Leaders (Orange Cap Legend)
              </span>
              <button
                onClick={() => setActiveTab('players')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                View 560+ <ArrowRight className="w-3 h-3 inline" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
              {summary?.top_run_scorers?.slice(0, 3).map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="font-sans font-bold text-white block truncate">{p.name}</span>
                  <span className="text-amber-400 font-bold text-sm block mt-0.5">{p.total_runs} Runs</span>
                  <span className="text-[10px] text-slate-400">SR: {p.strike_rate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Purple Cap */}
          <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-slate-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                All-Time Wicket Takers (Purple Cap Legend)
              </span>
              <button
                onClick={() => setActiveTab('players')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                View 560+ <ArrowRight className="w-3 h-3 inline" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
              {summary?.top_wicket_takers?.slice(0, 3).map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="font-sans font-bold text-white block truncate">{p.name}</span>
                  <span className="text-purple-400 font-bold text-sm block mt-0.5">{p.wickets} Wkts</span>
                  <span className="text-[10px] text-slate-400">Econ: {p.economy}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
