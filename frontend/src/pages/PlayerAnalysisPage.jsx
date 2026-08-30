import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Globe, 
  LayoutGrid, 
  ListFilter, 
  Calendar, 
  Award, 
  Shield, 
  Sparkles,
  Info,
  RotateCcw,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import PlayerCard from '../components/PlayerCard';
import { SkeletonCard, SkeletonTable, LoadingSpinner, EmptyState, ErrorState } from '../components/LoadingState';
import { fetchPlayers, fetchPlayerDetail } from '../services/api';
import { calculateDerivedAge } from '../utils/dateUtils';

export default function PlayerAnalysisPage() {
  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [battingHand, setBattingHand] = useState('All');
  const [bowlingSkill, setBowlingSkill] = useState('All');
  const [sortBy, setSortBy] = useState('runs');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal detail state
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlayers({
        search,
        country,
        battingHand,
        bowlingSkill,
        sortBy,
        page,
        limit: 18
      });
      setPlayers(res.players || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Player load error:", err);
      setError(err.message || "Failed to load players from database.");
    } finally {
      setLoading(false);
    }
  }, [search, country, battingHand, bowlingSkill, sortBy, page]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openPlayerModal = async (playerOrId) => {
    const id = typeof playerOrId === 'object' ? playerOrId.id : playerOrId;
    setSelectedPlayerId(id);
    setDetailLoading(true);
    try {
      const res = await fetchPlayerDetail(id);
      setPlayerDetail(res);
    } catch (err) {
      console.error("Player detail fetch error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedPlayerId(null);
    setPlayerDetail(null);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCountry('All');
    setBattingHand('All');
    setBowlingSkill('All');
    setSortBy('runs');
    setPage(1);
  };

  const totalPages = Math.ceil(total / 18);

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* HEADER SECTION                                                           */}
      {/* ========================================================================= */}
      <header className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0B132B] to-[#141E30] space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Users className="w-4 h-4" /> Comprehensive Player Analysis & Scouting
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          Player Database & Profile Explorer
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl">
          Search and analyze verified cricketers directly from the authentic Players dataset with real career statistics, batting hands, bowling skills, date of birth, and derived age.
        </p>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          
          {/* 1. Search Bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player name (e.g. Kohli, Dhoni, Rohit)..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500 shadow-inner"
            />
          </div>

          {/* 2. Country Filter */}
          <div>
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              <option value="All">All Countries</option>
              <option value="India">India</option>
              <option value="Australia">Australia</option>
              <option value="South Africa">South Africa</option>
              <option value="West Indies">West Indies</option>
              <option value="England">England</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="Afghanistan">Afghanistan</option>
              <option value="Zimbabwe">Zimbabwe</option>
              <option value="Netherlands">Netherlands</option>
            </select>
          </div>

          {/* 3. Batting Hand Filter */}
          <div>
            <select
              value={battingHand}
              onChange={(e) => { setBattingHand(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              <option value="All">All Batting Hands</option>
              <option value="Right_Hand">Right Hand</option>
              <option value="Left_Hand">Left Hand</option>
            </select>
          </div>

          {/* 4. Bowling Skill Filter */}
          <div>
            <select
              value={bowlingSkill}
              onChange={(e) => { setBowlingSkill(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              <option value="All">All Bowling Skills</option>
              <option value="Right-arm medium">Right-arm Medium</option>
              <option value="Right-arm fast">Right-arm Fast</option>
              <option value="Right-arm fast-medium">Right-arm Fast-Medium</option>
              <option value="Right-arm offbreak">Right-arm Offbreak</option>
              <option value="Legbreak">Legbreak Spin</option>
              <option value="Left-arm fast">Left-arm Fast</option>
              <option value="Slow left-arm orthodox">Left-arm Orthodox</option>
              <option value="Slow left-arm chinaman">Left-arm Chinaman</option>
            </select>
          </div>

        </div>

        {/* Secondary Sorting & View Mode Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Found <strong className="text-white font-mono">{total}</strong> verified cricketers</span>
            {(search || country !== 'All' || battingHand !== 'All' || bowlingSkill !== 'All') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline ml-2"
              >
                <RotateCcw className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase font-bold text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-cyan-400 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="runs">Total Runs (Orange Cap)</option>
                <option value="wickets">Wickets (Purple Cap)</option>
                <option value="strike_rate">Highest Strike Rate</option>
                <option value="average">Batting Average</option>
                <option value="economy">Best Bowling Economy</option>
                <option value="matches">Most Matches</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid or Table */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border transition ${viewMode === 'grid' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg border transition ${viewMode === 'table' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                title="Table View"
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Error Banner with Retry */}
      {error && (
        <ErrorState
          title="Player Database Telemetry Error"
          message={error}
          onRetry={loadPlayers}
        />
      )}

      {/* ========================================================================= */}
      {/* MAIN PLAYERS CONTENT: GRID OR TABLE                                       */}
      {/* ========================================================================= */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} rows={4} />
            ))}
          </div>
        ) : (
          <SkeletonTable rows={10} cols={6} />
        )
      ) : players.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No cricketers found"
          description="No players matching your search keywords or filter criteria. Try resetting your filters."
          action={
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Reset All Filters
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onSelect={openPlayerModal}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Player Name</th>
                  <th className="py-3.5 px-4">Country</th>
                  <th className="py-3.5 px-4">Date of Birth</th>
                  <th className="py-3.5 px-4">Age</th>
                  <th className="py-3.5 px-4">Batting Hand</th>
                  <th className="py-3.5 px-4">Bowling Skill</th>
                  <th className="py-3.5 px-4 text-right">Matches</th>
                  <th className="py-3.5 px-4 text-right">Runs</th>
                  <th className="py-3.5 px-4 text-right">Wickets</th>
                  <th className="py-3.5 px-4 text-center">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {players.map((p) => {
                  const derivedAge = calculateDerivedAge(p.dob);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-sans font-bold text-white text-sm">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        {p.country || 'International'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {p.dob || '--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {derivedAge || '--'}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        {p.batting_hand || '--'}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300 truncate max-w-[140px]">
                        {p.bowling_skill || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        {p.matches > 0 ? p.matches : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                        {p.total_runs > 0 ? p.total_runs : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-purple-400">
                        {p.wickets > 0 ? p.wickets : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-sans">
                        <button
                          onClick={() => openPlayerModal(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGINATION TOOLBAR                                                        */}
      {/* ========================================================================= */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          Showing <strong className="text-white font-mono">{players.length}</strong> of <strong className="text-white font-mono">{total}</strong> players
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-mono text-white px-2">
            Page {page} of {totalPages || 1}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PLAYER DETAILS MODAL                                                      */}
      {/* ========================================================================= */}
      {selectedPlayerId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl border border-slate-700 bg-[#0E1424] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {detailLoading || !playerDetail ? (
              <div className="py-16 text-center">
                <LoadingSpinner text="Loading player dossier..." />
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Modal Dossier Header */}
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Award className="w-4 h-4" /> Verified Player Dossier
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {playerDetail.player.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold">
                      {playerDetail.player.country || 'International'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-semibold">
                      {playerDetail.player.batting_hand || 'Right_Hand'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-semibold">
                      {playerDetail.player.bowling_skill || 'None / Part-time'}
                    </span>
                  </div>
                </div>

                {/* Core Attributes Panel: DOB, Derived Age */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Date of Birth</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {playerDetail.player.dob || 'Not recorded'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Derived Age</span>
                    <span className="font-mono text-sm font-bold text-cyan-400">
                      {calculateDerivedAge(playerDetail.player.dob) || 'Not derived'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Country / Nationality</span>
                    <span className="text-sm font-bold text-white">
                      {playerDetail.player.country || 'International'}
                    </span>
                  </div>
                </div>

                {/* Performance Statistics Evaluation */}
                {(() => {
                  const p = playerDetail.player;
                  const hasPerformanceStats = (p.matches > 0 || p.total_runs > 0 || p.wickets > 0 || p.strike_rate > 0);

                  if (!hasPerformanceStats) {
                    return (
                      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                        <Info className="w-6 h-6 text-slate-500 mx-auto" />
                        <p className="text-sm font-semibold text-slate-300">
                          Performance statistics are not available in the current dataset.
                        </p>
                        <p className="text-xs text-slate-500">
                          This cricketer record does not contain authenticated ball-by-ball tournament match logs.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* 6-Axis Skill Radar */}
                      {playerDetail.radar_chart && playerDetail.radar_chart.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block text-center">
                            6-Axis Multi-Dimensional Performance Radar
                          </span>
                          <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={playerDetail.radar_chart}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="metric" stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                                <Radar name="Performance" dataKey="value" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.35} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Verified Numerical Performance Statistics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center text-xs">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Total Runs</span>
                          <span className="text-lg font-black text-amber-400">{p.total_runs}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Strike Rate</span>
                          <span className="text-lg font-black text-cyan-400">{p.strike_rate}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Batting Average</span>
                          <span className="text-lg font-black text-white">{p.batting_average > 0 ? p.batting_average : '--'}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Wickets</span>
                          <span className="text-lg font-black text-purple-400">{p.wickets}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Bowling Economy</span>
                          <span className="text-lg font-black text-emerald-400">{p.economy > 0 ? p.economy : '--'}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Matches</span>
                          <span className="text-lg font-black text-white">{p.matches}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Fifties / 100s</span>
                          <span className="text-lg font-black text-amber-300">{p.fifties} / {p.hundreds}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">4s / 6s</span>
                          <span className="text-lg font-black text-cyan-300">{p.fours} / {p.sixes}</span>
                        </div>
                      </div>

                      {/* Career Assessment Summary */}
                      {playerDetail.career_summary && (
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                          <strong className="text-white block mb-1 font-bold">Career Assessment:</strong>
                          {playerDetail.career_summary}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
