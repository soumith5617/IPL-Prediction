import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Activity,
  Award,
  Globe
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { fetchPlayers, fetchPlayerDetail } from '../services/api';

export default function PlayerExplorer() {
  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [battingHand, setBattingHand] = useState('All');
  const [sortBy, setSortBy] = useState('runs');
  const [loading, setLoading] = useState(false);

  // Modal detail
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [page, country, battingHand, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadPlayers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetchPlayers({
        search,
        country,
        battingHand,
        sortBy,
        page,
        limit: 20
      });
      setPlayers(res.players);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPlayerModal = async (id) => {
    setSelectedPlayerId(id);
    setDetailLoading(true);
    try {
      const res = await fetchPlayerDetail(id);
      setPlayerDetail(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Users className="w-4 h-4" /> Comprehensive Player Scouting & Analytics
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Player Database & Performance Radar</h1>
        <p className="text-sm text-slate-400 mt-1">
          Scout over 560+ verified cricketers from Players.xlsx with real career strike rates, averages, wickets, and 6-axis performance radars.
        </p>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search player name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Country */}
          <div>
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Nationalities</option>
              <option value="India">India</option>
              <option value="Australia">Australia</option>
              <option value="South Africa">South Africa</option>
              <option value="West Indies">West Indies</option>
              <option value="England">England</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="Pakistan">Pakistan</option>
            </select>
          </div>

          {/* Batting Hand */}
          <div>
            <select
              value={battingHand}
              onChange={(e) => { setBattingHand(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Batting Hands</option>
              <option value="Right_Hand">Right Hand</option>
              <option value="Left_Hand">Left Hand</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-400 font-semibold focus:outline-none focus:border-cyan-500"
            >
              <option value="runs">Top Run Scorers (Orange Cap)</option>
              <option value="wickets">Top Wicket Takers (Purple Cap)</option>
              <option value="strike_rate">Highest Strike Rate (SR)</option>
              <option value="average">Highest Batting Average</option>
              <option value="economy">Best Bowling Economy</option>
              <option value="matches">Most Matches Played</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Country & Style</th>
                <th className="py-3.5 px-4 text-right">Matches</th>
                <th className="py-3.5 px-4 text-right">Runs</th>
                <th className="py-3.5 px-4 text-right">HS</th>
                <th className="py-3.5 px-4 text-right">Avg</th>
                <th className="py-3.5 px-4 text-right">SR</th>
                <th className="py-3.5 px-4 text-right">Wickets</th>
                <th className="py-3.5 px-4 text-right">Economy</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500 font-sans">
                    Loading cricketers...
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500 font-sans">
                    No players matching the filters found.
                  </td>
                </tr>
              ) : (
                players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-sans font-bold text-white text-sm">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-300">
                      <span className="text-slate-200">{p.country || 'Unknown'}</span>
                      <span className="text-slate-500 text-[11px] block">{p.batting_hand || ''} • {p.bowling_skill || ''}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{p.matches}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400">{p.total_runs}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{p.highest_score}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{p.batting_average}</td>
                    <td className="py-3.5 px-4 text-right text-cyan-400">{p.strike_rate}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-purple-400">{p.wickets}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{p.economy > 0 ? p.economy : '-'}</td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <button
                        onClick={() => openPlayerModal(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold transition"
                      >
                        Radar Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {players.length} of {total} players</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white">Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Player Radar Modal */}
      {selectedPlayerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl border border-slate-700 p-6 max-w-2xl w-full relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => { setSelectedPlayerId(null); setPlayerDetail(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !playerDetail ? (
              <div className="py-20 text-center text-slate-400 font-sans">
                Loading player radar analytics...
              </div>
            ) : (
              <div className="space-y-5">
                {/* Modal Header */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] uppercase font-bold tracking-wider">
                      {playerDetail.player.country}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">DOB: {playerDetail.player.dob || 'N/A'}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">
                    {playerDetail.player.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {playerDetail.player.batting_hand} • {playerDetail.player.bowling_skill}
                  </p>
                </div>

                {/* Radar Chart & Key Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={playerDetail.radar_chart}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="metric" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={false} />
                        <Radar 
                          name={playerDetail.player.name} 
                          dataKey="value" 
                          stroke="#00F0FF" 
                          fill="#00F0FF" 
                          fillOpacity={0.4} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Total Career Runs:</span>
                      <strong className="text-amber-400 font-mono">{playerDetail.player.total_runs}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Batting Average / SR:</span>
                      <strong className="text-cyan-400 font-mono">{playerDetail.player.batting_average} / {playerDetail.player.strike_rate}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Boundaries (4s / 6s):</span>
                      <strong className="text-white font-mono">{playerDetail.player.fours} / {playerDetail.player.sixes}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Wickets / Economy:</span>
                      <strong className="text-purple-400 font-mono">{playerDetail.player.wickets} / {playerDetail.player.economy}</strong>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {playerDetail.career_summary}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
