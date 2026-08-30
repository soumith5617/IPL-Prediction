import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  Trophy, 
  ShieldCheck, 
  MapPin, 
  TrendingUp, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { compareTeamsH2H } from '../services/api';

export default function TeamComparison({ teams }) {
  const [team1, setTeam1] = useState('Chennai Super Kings');
  const [team2, setTeam2] = useState('Mumbai Indians');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (team1 && team2 && team1 !== team2) {
      loadComparison();
    }
  }, [team1, team2]);

  const loadComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await compareTeamsH2H(team1, team2);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to compare teams');
    } finally {
      setLoading(false);
    }
  };

  const t1 = teams.find(t => t.name === team1);
  const t2 = teams.find(t => t.name === team2);

  const pieData = data ? [
    { name: data.team1.short_name, value: data.team1_wins, color: data.team1.primary_color || '#FFFF3C' },
    { name: data.team2.short_name, value: data.team2_wins, color: data.team2.primary_color || '#004BA0' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Swords className="w-4 h-4" /> Head-to-Head Franchise Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Franchise Rivalry & Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical head-to-head match records, victory margins, titles comparison, and home/away stadium dominance.
        </p>

        {/* Team Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 mb-2">Franchise 1</label>
            <select
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-cyan-500"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.name} disabled={t.name === team2}>
                  {t.name} ({t.short_name})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 mb-2">Franchise 2</label>
            <select
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-cyan-500"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.name} disabled={t.name === team1}>
                  {t.name} ({t.short_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Top Comparison Duel Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Team 1 Card */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
              <div 
                className="absolute top-0 left-0 h-1.5 w-full"
                style={{ backgroundColor: data.team1.primary_color }} 
              />
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-white">{data.team1.short_name}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Trophy className="w-3.5 h-3.5" /> {data.team1.titles} Titles
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mt-1">{data.team1.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{data.team1.home_ground}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total IPL Matches:</span>
                  <strong className="text-white font-mono">{data.team1.matches_played}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Overall Win Rate:</span>
                  <strong className="text-emerald-400 font-mono">{data.team1.win_percentage}%</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Average 1st Inn Score:</span>
                  <strong className="text-cyan-400 font-mono">{data.team1.avg_score}</strong>
                </div>
              </div>
            </div>

            {/* Duel Score Card */}
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Head to Head Battles
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono my-3">
                <span style={{ color: data.team1.primary_color }}>{data.team1_wins}</span>
                <span className="text-slate-500 mx-2">:</span>
                <span style={{ color: data.team2.primary_color }}>{data.team2_wins}</span>
              </div>
              <span className="text-xs text-slate-400">
                Across <strong>{data.total_head_to_head_matches}</strong> Total Encounters
              </span>

              <div className="w-full h-32 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team 2 Card */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
              <div 
                className="absolute top-0 left-0 h-1.5 w-full"
                style={{ backgroundColor: data.team2.primary_color }} 
              />
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-white">{data.team2.short_name}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Trophy className="w-3.5 h-3.5" /> {data.team2.titles} Titles
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mt-1">{data.team2.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{data.team2.home_ground}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total IPL Matches:</span>
                  <strong className="text-white font-mono">{data.team2.matches_played}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Overall Win Rate:</span>
                  <strong className="text-emerald-400 font-mono">{data.team2.win_percentage}%</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Average 1st Inn Score:</span>
                  <strong className="text-cyan-400 font-mono">{data.team2.avg_score}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Encounters List */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Recent Head-to-Head Match Log
            </h3>

            <div className="divide-y divide-slate-800/80 overflow-hidden">
              {data.recent_matches && data.recent_matches.map((m, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold text-[11px]">
                      IPL {m.season}
                    </span>
                    <span className="text-slate-400">{m.date || 'Regular Season'}</span>
                    <span className="text-slate-400 hidden md:inline">• {m.venue}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Winner:</span>
                    <span className="font-bold text-emerald-400">{m.winner}</span>
                    <span className="text-slate-500">({m.win_margin})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
