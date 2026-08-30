import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  History, 
  Trash2, 
  Filter, 
  TrendingUp, 
  Percent, 
  Calendar, 
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileDown,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  ListFilter,
  Activity,
  Code
} from 'lucide-react';
import { LoadingSpinner, SkeletonTable, SkeletonCard, EmptyState, ErrorState } from '../components/LoadingState';
import { fetchPredictions, clearHistory } from '../services/api';
import { formatRelativeTime } from '../utils/dateUtils';

export default function PredictionHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [predictionType, setPredictionType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest) or 'asc' (oldest)
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Clear Confirmation Modal State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Fetch prediction logs from GET /api/predictions
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPredictions({
        predictionType: predictionType !== 'all' ? predictionType : undefined,
        limit: 100,
        skip: 0
      });
      const records = Array.isArray(res) ? res : (res?.predictions || []);
      setLogs(records);
    } catch (err) {
      console.error("Prediction history fetch error:", err);
      setError(err.message || "Failed to load prediction logs from database.");
    } finally {
      setLoading(false);
    }
  }, [predictionType]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle Safe Clear History with Confirmation
  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      await clearHistory();
      setLogs([]);
      setShowClearConfirm(false);
      setSelectedRecord(null);
    } catch (err) {
      console.error("Failed to clear history:", err);
      setError("Failed to clear prediction history.");
    } finally {
      setClearing(false);
    }
  };

  // Filtered & Sorted Records
  const processedLogs = useMemo(() => {
    let list = [...logs];

    // 1. Search Filter (Batting, Bowling, Venue, Model)
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        (item.batting_team && item.batting_team.toLowerCase().includes(q)) ||
        (item.bowling_team && item.bowling_team.toLowerCase().includes(q)) ||
        (item.venue && item.venue.toLowerCase().includes(q)) ||
        (item.prediction_type && item.prediction_type.toLowerCase().includes(q)) ||
        (item.prediction_output?.model_used && item.prediction_output.model_used.toLowerCase().includes(q))
      );
    }

    // 2. Team Filter
    if (teamFilter !== 'All') {
      list = list.filter(item => 
        item.batting_team === teamFilter || item.bowling_team === teamFilter
      );
    }

    // 3. Date Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
      const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [logs, search, teamFilter, sortOrder]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(processedLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedLogs.slice(start, start + itemsPerPage);
  }, [processedLogs, currentPage]);

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ipl_prediction_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* HEADER BANNER                                                             */}
      {/* ========================================================================= */}
      <header className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0B132B] to-[#141E30] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <History className="w-4 h-4" /> Prediction Audit Log & Persistence Records
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Prediction Run History
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Complete audit trail of all score predictions and live win probabilities generated by the ML pipeline and logged to the SQLite database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export JSON */}
            {logs.length > 0 && (
              <button
                onClick={exportToJson}
                className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm"
                title="Export prediction logs as JSON"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                Export Audit JSON
              </button>
            )}

            {/* Clear History Button (with Confirmation Modal) */}
            {logs.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                title="Clear prediction history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear History
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80">
          
          {/* 1. Search Bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by team, venue, or model..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500 shadow-inner"
            />
          </div>

          {/* 2. Team Filter */}
          <div>
            <select
              value={teamFilter}
              onChange={(e) => { setTeamFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              <option value="All">All Franchises</option>
              <option value="Chennai Super Kings">Chennai Super Kings</option>
              <option value="Mumbai Indians">Mumbai Indians</option>
              <option value="Royal Challengers Bengaluru">RCB</option>
              <option value="Kolkata Knight Riders">KKR</option>
              <option value="Delhi Capitals">Delhi Capitals</option>
              <option value="Rajasthan Royals">Rajasthan Royals</option>
              <option value="Sunrisers Hyderabad">SRH</option>
              <option value="Punjab Kings">Punjab Kings</option>
              <option value="Gujarat Titans">Gujarat Titans</option>
              <option value="Lucknow Super Giants">LSG</option>
            </select>
          </div>

          {/* 3. Prediction Type Filter */}
          <div>
            <select
              value={predictionType}
              onChange={(e) => { setPredictionType(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              <option value="all">All Types</option>
              <option value="score">1st Innings Score</option>
              <option value="win">Live Win Probability</option>
              <option value="match">Full Match Forecast</option>
            </select>
          </div>

          {/* 4. Date Sorting */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-cyan-400 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              <option value="desc">Date: Newest First</option>
              <option value="asc">Date: Oldest First</option>
            </select>
          </div>

        </div>

        {/* View Mode & Count Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>Found <strong className="text-white font-mono">{processedLogs.length}</strong> logged predictions</span>
          
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg border transition ${viewMode === 'table' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg border transition ${viewMode === 'grid' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Error Banner */}
      {error && (
        <ErrorState
          title="Prediction History Error"
          message={error}
          onRetry={loadHistory}
        />
      )}

      {/* ========================================================================= */}
      {/* MAIN LOGS DISPLAY: TABLE OR GRID                                          */}
      {/* ========================================================================= */}
      {loading ? (
        viewMode === 'table' ? (
          <SkeletonTable rows={8} cols={8} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} rows={3} />
            ))}
          </div>
        )
      ) : processedLogs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Prediction Records Found"
          description={
            logs.length === 0 
              ? "No predictions have been logged in the system yet. Run a match forecast to generate inference audit logs."
              : "No records matching your search and filter criteria."
          }
          action={
            logs.length === 0 ? (
              <a
                href="#/match-prediction"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Run Match Prediction
              </a>
            ) : (
              <button
                onClick={() => { setSearch(''); setTeamFilter('All'); setPredictionType('all'); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Reset Filters
              </button>
            )
          }
        />
      ) : viewMode === 'table' ? (
        /* Professional Table View */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date/Time</th>
                  <th className="py-3.5 px-4">Batting Team</th>
                  <th className="py-3.5 px-4">Bowling Team</th>
                  <th className="py-3.5 px-4 text-center">Current Score</th>
                  <th className="py-3.5 px-4 text-center">Overs</th>
                  <th className="py-3.5 px-4 text-center">Wickets</th>
                  <th className="py-3.5 px-4 text-right">Predicted Score</th>
                  <th className="py-3.5 px-4">Model</th>
                  <th className="py-3.5 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedLogs.map((log) => {
                  const isScore = log.prediction_type === 'score' || log.prediction_type === 'first_innings_score';
                  const isWin = log.prediction_type === 'win' || log.prediction_type === 'win_probability';
                  const isMatch = log.prediction_type === 'match';

                  const inputState = log.input_state || {};
                  const predOut = log.prediction_output || {};

                  const currentScoreVal = inputState.current_score ?? inputState.runs ?? '--';
                  const oversVal = inputState.overs_completed ?? inputState.overs ?? '--';
                  const wicketsVal = inputState.wickets_lost ?? inputState.wickets ?? '--';

                  const predictedScoreVal = predOut.prediction?.predicted_score 
                    ?? predOut.predicted_score 
                    ?? (isWin ? `${Math.round((predOut.prediction?.team_a_probability ?? 0.5) * 100)}% Win` : '--');

                  const modelUsed = predOut.model_used || (isScore ? 'MLP Neural Net' : isWin ? 'Gradient Boosting' : 'Ensemble');

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 text-slate-300 font-sans">
                        <div className="font-bold text-white text-xs">
                          {formatRelativeTime(log.created_at)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '--'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-sans font-bold text-white">
                        {log.batting_team || inputState.batting_team || 'Team A'}
                      </td>

                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        {log.bowling_team || inputState.bowling_team || 'Team B'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-white">
                        {currentScoreVal}
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-300">
                        {typeof oversVal === 'number' ? oversVal.toFixed(1) : oversVal}
                      </td>

                      <td className="py-3.5 px-4 text-center text-rose-400 font-bold">
                        {wicketsVal}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-black text-sm ${isScore ? 'text-cyan-400' : isWin ? 'text-emerald-400' : 'text-purple-400'}`}>
                          {predictedScoreVal}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                          {modelUsed}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-sans">
                        <button
                          onClick={() => setSelectedRecord(log)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedLogs.map((log) => {
            const isScore = log.prediction_type === 'score' || log.prediction_type === 'first_innings_score';
            const isWin = log.prediction_type === 'win' || log.prediction_type === 'win_probability';
            const inputState = log.input_state || {};
            const predOut = log.prediction_output || {};

            const predictedScoreVal = predOut.prediction?.predicted_score ?? predOut.predicted_score;

            return (
              <div
                key={log.id}
                onClick={() => setSelectedRecord(log)}
                className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-cyan-500/40 transition cursor-pointer space-y-4 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md font-mono ${
                      isScore ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isScore ? 'SCORE FORECAST' : isWin ? 'WIN PROBABILITY' : 'MATCH'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">
                      {log.batting_team} <span className="text-slate-500 font-normal">vs</span> {log.bowling_team}
                    </h3>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1 border-t border-slate-800">
                  <div className="p-2 rounded-xl bg-slate-950/60">
                    <span className="text-[9px] uppercase text-slate-500 block font-sans">Score</span>
                    <span className="font-bold text-white">{inputState.runs ?? inputState.current_score ?? '--'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60">
                    <span className="text-[9px] uppercase text-slate-500 block font-sans">Overs</span>
                    <span className="font-bold text-white">{inputState.overs ?? inputState.overs_completed ?? '--'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60">
                    <span className="text-[9px] uppercase text-slate-500 block font-sans">Output</span>
                    <span className="font-bold text-cyan-400">{predictedScoreVal || 'Logged'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGINATION BAR                                                            */}
      {/* ========================================================================= */}
      {processedLogs.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white font-mono">{paginatedLogs.length}</strong> of <strong className="text-white font-mono">{processedLogs.length}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-white px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREDICTION DETAILS INSPECTOR MODAL                                         */}
      {/* ========================================================================= */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl border border-slate-700 bg-[#0E1424] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Activity className="w-4 h-4" /> Inference Telemetry Audit (ID #{selectedRecord.id})
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {selectedRecord.batting_team} <span className="text-slate-500 font-normal">vs</span> {selectedRecord.bowling_team}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                  <span>Type: <strong className="text-white">{selectedRecord.prediction_type}</strong></span>
                  <span>•</span>
                  <span>Venue: <strong className="text-white">{selectedRecord.venue || 'Neutral'}</strong></span>
                  <span>•</span>
                  <span>Logged: {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : '--'}</span>
                </div>
              </div>

              {/* Complete Input State */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-cyan-400" /> Complete Model Input Payload
                </span>
                <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-800/80">
                  {JSON.stringify(selectedRecord.input_state, null, 2)}
                </pre>
              </div>

              {/* Complete Output State */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Complete ML Prediction Output
                </span>
                <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800/80">
                  {JSON.stringify(selectedRecord.prediction_output, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAFE CLEAR HISTORY CONFIRMATION DIALOG                                    */}
      {/* ========================================================================= */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl border border-rose-500/30 bg-[#0E1424] max-w-md w-full p-6 space-y-5 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Permanently Clear Prediction Logs?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action will delete all stored prediction records from the database. This operation cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={clearing}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Yes, Clear History"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
