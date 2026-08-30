import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Swords, 
  Trophy, 
  ShieldCheck, 
  MapPin, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Medal,
  Activity,
  Sparkles,
  ArrowRight,
  Zap,
  Info,
  Layers,
  PieChart as PieIcon,
  BarChart3
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
import TeamSelector from '../components/TeamSelector';
import { SkeletonCard, LoadingSpinner, EmptyState, ErrorState } from '../components/LoadingState';
import { compareTeamsH2H, predictMatch } from '../services/api';

export default function TeamComparisonPage({ teams = [] }) {
  const navigate = useNavigate();

  // Selected franchises
  const [team1, setTeam1] = useState('Chennai Super Kings');
  const [team2, setTeam2] = useState('Mumbai Indians');

  // Comparison & ML Match Projection States
  const [h2hData, setH2hData] = useState(null);
  const [matchProjection, setMatchProjection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComparison = useCallback(async () => {
    if (!team1 || !team2 || team1 === team2) return;

    setLoading(true);
    setError(null);

    try {
      const [h2hRes, projRes] = await Promise.allSettled([
        compareTeamsH2H(team1, team2),
        predictMatch({ team1, team2, city: 'Mumbai', venue: 'Wankhede Stadium' })
      ]);

      if (h2hRes.status === 'fulfilled') {
        setH2hData(h2hRes.value);
      } else {
        setH2hData(null);
      }

      if (projRes.status === 'fulfilled') {
        setMatchProjection(projRes.value);
      } else {
        setMatchProjection(null);
      }
    } catch (err) {
      console.error("Team comparison error:", err);
      setError(err.message || 'Failed to compare franchises.');
    } finally {
      setLoading(false);
    }
  }, [team1, team2]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  const handlePredictMatchClick = () => {
    navigate('/match-prediction', {
      state: {
        battingTeam: team1,
        bowlingTeam: team2
      }
    });
  };

  const t1Obj = teams.find(t => t.name === team1) || h2hData?.team1;
  const t2Obj = teams.find(t => t.name === team2) || h2hData?.team2;

  const t1Color = t1Obj?.primary_color || '#FFFF3C';
  const t2Color = t2Obj?.primary_color || '#004BA0';

  const totalMatches = h2hData?.total_head_to_head_matches ?? h2hData?.total_matches ?? 0;
  const t1Wins = h2hData?.team1_wins ?? 0;
  const t2Wins = h2hData?.team2_wins ?? 0;

  const pieData = totalMatches > 0 ? [
    { name: t1Obj?.short_name || 'Team A', value: t1Wins, color: t1Color },
    { name: t2Obj?.short_name || 'Team B', value: t2Wins, color: t2Color },
  ] : [];

  const comparisonStats = t1Obj && t2Obj ? [
    { 
      metric: 'IPL Titles', 
      team1: t1Obj.titles || 0, 
      team2: t2Obj.titles || 0 
    },
    { 
      metric: 'Win Rate (%)', 
      team1: typeof t1Obj.win_percentage === 'number' ? Math.round(t1Obj.win_percentage) : 50, 
      team2: typeof t2Obj.win_percentage === 'number' ? Math.round(t2Obj.win_percentage) : 50 
    },
    { 
      metric: 'Matches Won', 
      team1: t1Obj.matches_won || 0, 
      team2: t2Obj.matches_won || 0 
    },
    { 
      metric: 'Matches Played', 
      team1: t1Obj.matches_played || 0, 
      team2: t2Obj.matches_played || 0 
    }
  ] : [];

  // ML Win Probabilities from Match Projection
  const winProbT1 = matchProjection?.projected_win_probabilities?.[team1] ?? 50.0;
  const winProbT2 = matchProjection?.projected_win_probabilities?.[team2] ?? 50.0;

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* HEADER SECTION                                                           */}
      {/* ========================================================================= */}
      <header className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0B132B] to-[#141E30] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Swords className="w-4 h-4" /> Head-to-Head Franchise Intelligence
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Team Comparison & Rivalry Matrix
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Compare franchise career accolades, historical head-to-head records, all-time win ratios, and live machine learning match score projections.
            </p>
          </div>

          {/* Predict Match Action Button */}
          <button
            onClick={handlePredictMatchClick}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            Predict Match
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Team Selectors: Team A & Team B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
          <TeamSelector
            label="Select Team A"
            value={team1}
            onChange={setTeam1}
            teams={teams}
            exclude={team2}
            badge="Franchise A"
          />

          <TeamSelector
            label="Select Team B"
            value={team2}
            onChange={setTeam2}
            teams={teams}
            exclude={team1}
            badge="Franchise B"
          />
        </div>
      </header>

      {/* Global Error Banner */}
      {error && (
        <ErrorState
          title="Comparison Data Unavailable"
          message={error}
          onRetry={loadComparison}
        />
      )}

      {loading ? (
        <div className="py-20 text-center">
          <LoadingSpinner text="Computing franchise comparison & historical encounter metrics..." />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ========================================================================= */}
          {/* SECTION 1: TEAM A VS TEAM B COMPARISON CARDS                              */}
          {/* ========================================================================= */}
          <section aria-labelledby="h2h-cards-heading" className="space-y-3">
            <h2 id="h2h-cards-heading" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              1. Franchise Accolades & Career Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Team A Card */}
              <div 
                className="glass-panel rounded-3xl p-6 border bg-slate-900/60 relative overflow-hidden space-y-4 shadow-xl transition-all"
                style={{ borderColor: `${t1Color}40` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shadow" style={{ backgroundColor: t1Color }} />
                      <h3 className="text-xl font-black text-white">{team1}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                      Canonical Franchise Profile
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    <Medal className="w-3.5 h-3.5" />
                    <span>{t1Obj?.titles || 0} Titles</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-2">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Played</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{t1Obj?.matches_played || '--'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Won</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">{t1Obj?.matches_won || '--'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Win Rate</span>
                    <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                      {typeof t1Obj?.win_percentage === 'number' ? `${t1Obj.win_percentage}%` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team B Card */}
              <div 
                className="glass-panel rounded-3xl p-6 border bg-slate-900/60 relative overflow-hidden space-y-4 shadow-xl transition-all"
                style={{ borderColor: `${t2Color}40` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shadow" style={{ backgroundColor: t2Color }} />
                      <h3 className="text-xl font-black text-white">{team2}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                      Canonical Franchise Profile
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    <Medal className="w-3.5 h-3.5" />
                    <span>{t2Obj?.titles || 0} Titles</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-2">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Played</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{t2Obj?.matches_played || '--'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Won</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">{t2Obj?.matches_won || '--'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Win Rate</span>
                    <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                      {typeof t2Obj?.win_percentage === 'number' ? `${t2Obj.win_percentage}%` : '--'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 2: PREDICTION COMPARISON & SCORE CONTEXT                          */}
          {/* ========================================================================= */}
          {matchProjection && (
            <section aria-labelledby="prediction-comparison-heading" className="glass-panel rounded-3xl p-6 sm:p-7 border border-cyan-500/30 bg-gradient-to-br from-[#0B132B] via-slate-900 to-cyan-950/30 space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 relative z-10">
                <div>
                  <h2 id="prediction-comparison-heading" className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    2. Pre-Match Machine Learning Forecast
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live ensemble projection combining score regressor and win classifier.
                  </p>
                </div>

                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {matchProjection.model_used || 'Ensemble Pipeline'}
                </span>
              </div>

              {/* Forecast Grid: Projected 1st Innings & Win Probabilities */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                
                {/* Score Projection Context */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">
                    Projected 1st Innings Total ({team1})
                  </span>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400 font-mono">
                      {matchProjection.projected_first_innings_score?.projected_score || 176}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Runs</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                    <span>Expected Range:</span>
                    <strong className="text-cyan-400">{matchProjection.projected_first_innings_score?.range || '168 - 184'}</strong>
                  </div>
                </div>

                {/* Win Probabilities Bar */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t1Color }} />
                      <span className="font-bold text-white">{team1}: {winProbT1}%</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{team2}: {winProbT2}%</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t2Color }} />
                    </div>
                  </div>

                  <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 flex items-center border border-slate-800 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out shadow"
                      style={{ width: `${winProbT1}%`, backgroundColor: t1Color }}
                    />
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out shadow"
                      style={{ width: `${winProbT2}%`, backgroundColor: t2Color }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Statistical Pre-Match Win Probability</span>
                    <button
                      onClick={handlePredictMatchClick}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                    >
                      Launch Match Forecaster →
                    </button>
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: HISTORICAL INFORMATION (IF ACTUALLY AVAILABLE)                 */}
          {/* ========================================================================= */}
          <section aria-labelledby="historical-info-heading" className="space-y-4">
            <h2 id="historical-info-heading" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              3. Historical Head-to-Head Intelligence
            </h2>

            {totalMatches === 0 ? (
              <div className="glass-panel rounded-3xl p-10 border border-slate-800 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-200">
                  Historical head-to-head statistics are not available in the current dataset.
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No historical tournament encounter records found between {team1} and {team2} in the ball-by-ball match logs.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Encounters Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-center space-y-1">
                    <span className="text-xs uppercase font-bold text-slate-400">Total Encounters</span>
                    <div className="text-3xl font-black text-white font-mono">{totalMatches}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Head-to-Head</span>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-center space-y-1">
                    <span className="text-xs uppercase font-bold text-slate-400 truncate block">{t1Obj?.short_name || 'Team A'} Wins</span>
                    <div className="text-3xl font-black font-mono" style={{ color: t1Color }}>
                      {t1Wins}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {totalMatches > 0 ? ((t1Wins / totalMatches) * 100).toFixed(1) : 0}% win share
                    </span>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-center space-y-1">
                    <span className="text-xs uppercase font-bold text-slate-400 truncate block">{t2Obj?.short_name || 'Team B'} Wins</span>
                    <div className="text-3xl font-black font-mono" style={{ color: t2Color }}>
                      {t2Wins}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {totalMatches > 0 ? ((t2Wins / totalMatches) * 100).toFixed(1) : 0}% win share
                    </span>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-center space-y-1">
                    <span className="text-xs uppercase font-bold text-slate-400">Rivalry Margin</span>
                    <div className="text-xl font-bold text-emerald-400 font-mono mt-1 truncate">
                      {t1Wins > t2Wins 
                        ? `${t1Obj?.short_name || 'Team A'} +${t1Wins - t2Wins}` 
                        : t2Wins > t1Wins 
                          ? `${t2Obj?.short_name || 'Team B'} +${t2Wins - t1Wins}` 
                          : 'Level (0)'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Historical Advantage</span>
                  </div>
                </div>

                {/* Charts Grid: Pie Distribution & Comparative Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Pie Chart: Head-to-Head Win Distribution */}
                  <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-cyan-400" /> Encounter Win Distribution
                      </h3>
                    </div>

                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={45}
                            paddingAngle={5}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0F172A', 
                              borderColor: '#334155', 
                              borderRadius: '0.75rem', 
                              color: '#F8FAFC',
                              fontSize: '12px' 
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-center gap-6 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t1Color }} />
                        <span className="text-white font-bold">{t1Obj?.short_name || team1} ({t1Wins})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t2Color }} />
                        <span className="text-white font-bold">{t2Obj?.short_name || team2} ({t2Wins})</span>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart: Overall Franchise Benchmark */}
                  <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" /> Overall Franchise Benchmark
                      </h3>
                    </div>

                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis dataKey="metric" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                          <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0F172A', 
                              borderColor: '#334155', 
                              borderRadius: '0.75rem', 
                              color: '#F8FAFC',
                              fontSize: '12px' 
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="team1" name={t1Obj?.short_name || team1} fill={t1Color} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="team2" name={t2Obj?.short_name || team2} fill={t2Color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Recent Encounter Table */}
                {h2hData.recent_matches && h2hData.recent_matches.length > 0 && (
                  <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      Recent Historical Match Encounters
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Season</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Venue</th>
                            <th className="py-3 px-4">Match Winner</th>
                            <th className="py-3 px-4">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {h2hData.recent_matches.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-4 text-slate-300 font-bold">{m.season || 'IPL'}</td>
                              <td className="py-3 px-4 text-slate-400">{m.date || '--'}</td>
                              <td className="py-3 px-4 font-sans text-slate-300">{m.venue || 'Neutral Stadium'}</td>
                              <td className="py-3 px-4 font-sans font-bold text-emerald-400">{m.winner}</td>
                              <td className="py-3 px-4 text-slate-300">{m.win_margin || '--'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}
          </section>

        </div>
      )}

    </div>
  );
}
