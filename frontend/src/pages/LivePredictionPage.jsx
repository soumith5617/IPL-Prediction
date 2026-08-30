import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Percent, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  ShieldAlert, 
  MapPin, 
  RefreshCw, 
  TrendingUp, 
  Zap, 
  Info,
  Clock,
  Flame,
  AlertCircle
} from 'lucide-react';
import TeamSelector from '../components/TeamSelector';
import CricketOversInput from '../components/CricketOversInput';
import CricketNumberInput from '../components/CricketNumberInput';
import { LoadingSpinner } from '../components/LoadingState';
import { predictScore, predictWinProbability } from '../services/api';
import { 
  cricketOversToDecimal, 
  calculateAccurateCRR, 
  isValidCricketOvers, 
  formatCricketOvers,
  cricketOversToTotalBalls,
  normalizeCricketOvers
} from '../utils/cricketUtils';

export default function LivePredictionPage({ teams = [], venues = [] }) {
  // --- Match State Inputs ---
  const [battingTeam, setBattingTeam] = useState('Royal Challengers Bengaluru');
  const [bowlingTeam, setBowlingTeam] = useState('Kolkata Knight Riders');
  const [city, setCity] = useState('Kolkata');
  const [targetScore, setTargetScore] = useState(185);
  const [runs, setRuns] = useState(112);
  const [wickets, setWickets] = useState(3);
  const [overs, setOvers] = useState(12.0);
  const [runsLast5, setRunsLast5] = useState(48);
  const [wicketsLast5, setWicketsLast5] = useState(1);

  // --- ML Predictions State ---
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [winResult, setWinResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  // Accurate CRR
  const computedCRR = useMemo(() => {
    return calculateAccurateCRR(runs, overs);
  }, [runs, overs]);

  // Projected Score based purely on Current Run Rate
  const projectedLinearScore = useMemo(() => {
    const crrNum = parseFloat(computedCRR);
    if (isNaN(crrNum) || crrNum <= 0) return runs;
    return Math.round(crrNum * 20);
  }, [computedCRR, runs]);

  // Innings Progress Percentage
  const progressPercent = useMemo(() => {
    const decOvers = cricketOversToDecimal(overs);
    return Math.min(100, Math.max(0, (decOvers / 20.0) * 100));
  }, [overs]);

  // Validation
  const validateInputs = () => {
    if (battingTeam.trim().toLowerCase() === bowlingTeam.trim().toLowerCase()) {
      return "Batting Team and Bowling Team cannot be identical franchises.";
    }
    if (runs < 0 || isNaN(runs)) {
      return "Runs cannot be negative.";
    }
    if (wickets < 0 || wickets > 10 || isNaN(wickets)) {
      return "Wickets must be between 0 and 10.";
    }
    if (overs < 0 || overs > 20 || isNaN(overs)) {
      return "Overs must be between 0.0 and 20.0.";
    }
    if (!isValidCricketOvers(overs)) {
      return `Invalid cricket notation "${overs}". Balls must be between .0 and .5.`;
    }
    if (runsLast5 < 0 || runsLast5 > runs) {
      return "Runs in Last 5 Overs must be between 0 and total current runs.";
    }
    if (wicketsLast5 < 0 || wicketsLast5 > wickets) {
      return "Wickets in Last 5 Overs must be between 0 and total wickets lost.";
    }
    return null;
  };

  // Perform Live ML Prediction Update
  const handleUpdatePrediction = async () => {
    const valErr = validateInputs();
    if (valErr) {
      setError(valErr);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Fetch ML Score Prediction
      const scorePromise = predictScore({
        batting_team: battingTeam,
        bowling_team: bowlingTeam,
        city: city || 'Kolkata',
        current_score: Number(runs),
        wickets_lost: Number(wickets),
        overs_completed: Number(overs),
        runs_last_5: Number(runsLast5),
        wickets_last_5: Number(wicketsLast5)
      });

      // 2. Fetch ML Win Probability
      const winPromise = predictWinProbability({
        batting_team: battingTeam,
        bowling_team: bowlingTeam,
        city: city || 'Kolkata',
        target_score: Number(targetScore),
        current_score: Number(runs),
        wickets_lost: Number(wickets),
        overs_completed: Number(overs)
      });

      const [scoreRes, winRes] = await Promise.all([scorePromise, winPromise]);

      setScoreResult(scoreRes);
      setWinResult(winRes);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Live prediction update error:", err);
      setError(err.message || "Failed to update live prediction. Please verify inputs.");
    } finally {
      setLoading(false);
    }
  };

  // Run on initial mount
  useEffect(() => {
    handleUpdatePrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetMatchState = () => {
    setBattingTeam('Royal Challengers Bengaluru');
    setBowlingTeam('Kolkata Knight Riders');
    setCity('Kolkata');
    setTargetScore(185);
    setRuns(112);
    setWickets(3);
    setOvers(12.0);
    setRunsLast5(48);
    setWicketsLast5(1);
    setError(null);

    // Trigger immediate update
    setTimeout(() => {
      predictScore({
        batting_team: 'Royal Challengers Bengaluru',
        bowling_team: 'Kolkata Knight Riders',
        city: 'Kolkata',
        current_score: 112,
        wickets_lost: 3,
        overs_completed: 12.0,
        runs_last_5: 48,
        wickets_last_5: 1
      }).then(setScoreResult).catch(() => {});

      predictWinProbability({
        batting_team: 'Royal Challengers Bengaluru',
        bowling_team: 'Kolkata Knight Riders',
        city: 'Kolkata',
        target_score: 185,
        current_score: 112,
        wickets_lost: 3,
        overs_completed: 12.0
      }).then(setWinResult).catch(() => {});
      setLastUpdatedTime(new Date().toLocaleTimeString());
    }, 100);
  };

  const battingMeta = teams.find(t => t.name === battingTeam);
  const bowlingMeta = teams.find(t => t.name === bowlingTeam);

  const teamAColor = battingMeta?.primary_color || '#EC1C24';
  const teamBColor = bowlingMeta?.primary_color || '#3A225D';

  // Extract predicted final score & bounds safely
  const predictedFinalScore = scoreResult?.prediction?.predicted_score 
    ?? scoreResult?.predicted_score 
    ?? 182;

  const scoreDifference = predictedFinalScore - runs;

  // Win Probabilities
  const teamAWinProb = winResult?.prediction?.team_a_probability 
    ?? winResult?.chasing_team_win_prob 
    ?? winResult?.win_probability_batting 
    ?? 0.62;
  const teamBWinProb = winResult?.prediction?.team_b_probability 
    ?? winResult?.defending_team_win_prob 
    ?? winResult?.win_probability_bowling 
    ?? 0.38;

  const teamAPct = Math.round(teamAWinProb * (teamAWinProb <= 1 ? 100 : 1));
  const teamBPct = Math.round(teamBWinProb * (teamBWinProb <= 1 ? 100 : 1));

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* HEADER & LIVE TELEMETRY STATUS                                            */}
      {/* ========================================================================= */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-[#141E30] border border-cyan-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Manual Live Match Prediction</span>
              </div>
              {lastUpdatedTime && (
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated: {lastUpdatedTime}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Live Match Intelligence Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Simulate live in-game match dynamics, ball-by-ball momentum shifts, and real-time win probability forecasts.
            </p>
          </div>

          {/* Top Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={resetMatchState}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              title="Reset match situation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset State
            </button>

            <button
              onClick={handleUpdatePrediction}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Update Prediction
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs animate-fadeIn">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INNINGS PROGRESS INDICATOR & WICKETS VISUALIZATION                         */}
      {/* ========================================================================= */}
      <section aria-labelledby="innings-progress-heading" className="glass-panel rounded-3xl p-6 border border-slate-800 bg-[#0B132B]/70 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 id="innings-progress-heading" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Innings Progression Timeline & Wicket Tracker
            </h2>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-400">Position: <strong className="text-white">{formatCricketOvers(overs)}</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Wickets: <strong className="text-rose-400">{wickets}/10 Lost</strong></span>
          </div>
        </div>

        {/* Visual Progress Bar: 0 overs ───────────── 20 overs */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold font-mono text-slate-400">
            <span>0 overs (Start)</span>
            <span className="text-cyan-400 font-black">
              {overs.toFixed(1)} ov ({Math.round(progressPercent)}% completed)
            </span>
            <span>20 overs (Innings Finish)</span>
          </div>

          <div className="relative w-full h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner flex items-center p-0.5">
            {/* Powerplay Marker 0-6 ov */}
            <div className="absolute left-0 top-0 bottom-0 w-[30%] border-r border-slate-700/60 pointer-events-none bg-blue-500/5" title="Powerplay (0-6 ov)" />
            {/* Middle Overs 6-15 ov */}
            <div className="absolute left-[30%] top-0 bottom-0 w-[45%] border-r border-slate-700/60 pointer-events-none bg-indigo-500/5" title="Middle Overs (6-15 ov)" />
            
            {/* Active Progress Fill */}
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-slate-900" />
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
            <span>Powerplay (0–6)</span>
            <span>Middle Phase (6–15)</span>
            <span>Death Overs (15–20)</span>
          </div>
        </div>

        {/* Visual Wickets Display (10 Tokens) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Wickets in Hand:</span>
            <span className="font-mono text-xs text-slate-400">
              <strong className="text-emerald-400">{10 - wickets}</strong> Available • <strong className="text-rose-400">{wickets}</strong> Fallen
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 sm:gap-2.5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isLost = idx < wickets;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isLost 
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-500/10' 
                      : 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold block">W{idx + 1}</span>
                  <span className="text-xs font-black block mt-0.5">
                    {isLost ? '✕' : '✓'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5 KEY BROADCAST METRICS DISPLAY CARDS                                     */}
      {/* ========================================================================= */}
      <section aria-labelledby="live-metrics-heading" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1: CURRENT SCORE */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">CURRENT SCORE</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{runs} / {wickets}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">({overs.toFixed(1)} ov)</span>
        </div>

        {/* Metric 2: RUN RATE (CRR) */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">RUN RATE (CRR)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">{computedCRR}</span>
            <span className="text-xs text-slate-400 font-mono">RPO</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">Current Tempo</span>
        </div>

        {/* Metric 3: PROJECTED SCORE (Linear CRR * 20) */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">PROJECTED SCORE</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">{projectedLinearScore}</span>
            <span className="text-xs text-slate-400 font-mono">Runs</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">CRR @ 20.0 Overs</span>
        </div>

        {/* Metric 4: PREDICTED FINAL SCORE (ML Model) */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-[#0B132B] to-cyan-950/30 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider block">PREDICTED FINAL SCORE</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white font-mono">
              {predictedFinalScore}
            </span>
            <span className="text-xs text-cyan-400 font-mono">Runs</span>
          </div>
          <span className="text-[11px] text-cyan-400/80 font-mono block">ML Regressor Model</span>
        </div>

        {/* Metric 5: SCORE DIFFERENCE */}
        <div className="col-span-2 lg:col-span-1 glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">SCORE DIFFERENCE</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${scoreDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {scoreDifference >= 0 ? `+${scoreDifference}` : scoreDifference}
            </span>
            <span className="text-xs text-slate-400 font-mono">Runs</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">Runs to Add in {(20.0 - cricketOversToDecimal(overs)).toFixed(1)} ov</span>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN SECTION: INPUTS & WIN PROBABILITY / ADVANCED RESULT        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Live Match State Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-800 bg-[#0B132B]/60 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Enter Live Match Parameters
              </h2>
              <span className="text-xs text-slate-400 font-mono">Manual In-Game Updates</span>
            </div>

            {/* Franchise Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TeamSelector 
                label="Batting Team (Chasing)"
                value={battingTeam}
                onChange={setBattingTeam}
                teams={teams}
                exclude={bowlingTeam}
                badge="Batting"
              />

              <TeamSelector 
                label="Bowling Team (Defending)"
                value={bowlingTeam}
                onChange={setBowlingTeam}
                teams={teams}
                exclude={battingTeam}
                badge="Bowling"
              />
            </div>

            {/* Match Venue City */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Match Venue City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner"
              >
                {(venues.length > 0 ? venues : [
                  { id: 'kolkata', city: 'Kolkata', name: 'Eden Gardens' },
                  { id: 'mumbai', city: 'Mumbai', name: 'Wankhede Stadium' },
                  { id: 'chennai', city: 'Chennai', name: 'MA Chidambaram Stadium' },
                  { id: 'bengaluru', city: 'Bengaluru', name: 'M Chinnaswamy Stadium' },
                  { id: 'delhi', city: 'Delhi', name: 'Arun Jaitley Stadium' },
                  { id: 'hyderabad', city: 'Hyderabad', name: 'Rajiv Gandhi International Stadium' },
                  { id: 'ahmedabad', city: 'Ahmedabad', name: 'Narendra Modi Stadium' },
                  { id: 'jaipur', city: 'Jaipur', name: 'Sawai Mansingh Stadium' }
                ]).map((v, idx) => {
                  const vCity = typeof v === 'object' ? (v.city || v.name) : v;
                  const vName = typeof v === 'object' ? (v.name || v.city) : `${v} Stadium`;
                  return (
                    <option key={idx} value={vCity} className="bg-slate-900 text-white">
                      {vName} ({vCity})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Target Score */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">1st Innings Target Score</span>
                <span className="font-mono text-amber-400 font-bold">{targetScore} Runs</span>
              </div>
              <input
                type="range"
                min="80"
                max="280"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Runs, Wickets, Overs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Runs */}
              <CricketNumberInput
                label="Current Runs"
                value={runs}
                onChange={setRuns}
                min={0}
                max={350}
                colorScheme="cyan"
                presets={['+1', '+4', '+6']}
                unit="Runs"
              />

              {/* Wickets */}
              <CricketNumberInput
                label="Wickets (0–10)"
                value={wickets}
                onChange={(w) => {
                  setWickets(w);
                  if (wicketsLast5 > w) setWicketsLast5(w);
                }}
                min={0}
                max={10}
                colorScheme="rose"
                presets={[0, 1, 2, 3, 4, 5]}
                unit="Wkts"
              />

              {/* Overs */}
              <CricketOversInput
                value={overs}
                onChange={setOvers}
                min={0.0}
                max={20.0}
                label="Overs"
              />
            </div>

            {/* Last 5 Overs Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CricketNumberInput
                label="Runs in Last 5 Overs"
                value={runsLast5}
                onChange={(r) => setRunsLast5(Math.min(runs, Math.max(0, r)))}
                min={0}
                max={runs}
                colorScheme="cyan"
                presets={['+1', '+4', '+6']}
                unit="Runs"
              />

              <CricketNumberInput
                label="Wickets in Last 5 Overs"
                value={wicketsLast5}
                onChange={(w) => setWicketsLast5(Math.min(wickets, Math.max(0, w)))}
                min={0}
                max={wickets}
                colorScheme="purple"
                presets={[0, 1, 2, 3]}
                unit="Wkts"
              />
            </div>

            {/* Submit Update Prediction Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUpdatePrediction}
                disabled={loading || battingTeam === bowlingTeam}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all transform ${
                  loading 
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    Updating Live Analytics...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    Update Prediction
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT: Visual Win Probability & Score Projections */}
        <div className="lg:col-span-6 space-y-5">
          {loading && !winResult && !scoreResult ? (
            <div className="glass-panel rounded-3xl p-16 border border-slate-800 flex flex-col items-center justify-center space-y-3">
              <LoadingSpinner text="Computing Live Match Win Probabilities..." />
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-800 bg-[#0B132B]/60 space-y-6 shadow-xl relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Matchup Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    WIN PROBABILITY
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Target: {targetScore} Runs
                </span>
              </div>

              {/* Visual Win Probability Display */}
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  {/* Chasing Team */}
                  <div className="space-y-1 max-w-[45%]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: teamAColor }} />
                      <span className="text-xs font-black text-white truncate block">{battingTeam}</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono" style={{ color: teamAColor }}>
                      {teamAPct}%
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">Chasing ({runs}/{wickets})</span>
                  </div>

                  <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-bold text-slate-400 font-mono">
                    VS
                  </div>

                  {/* Defending Team */}
                  <div className="space-y-1 text-right max-w-[45%]">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs font-black text-white truncate block">{bowlingTeam}</span>
                      <span className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: teamBColor }} />
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono" style={{ color: teamBColor }}>
                      {teamBPct}%
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">Defending ({targetScore})</span>
                  </div>
                </div>

                {/* Probability Meter Bar */}
                <div className="space-y-1.5">
                  <div className="h-5 w-full bg-slate-950 rounded-full overflow-hidden p-1 flex items-center border border-slate-800 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out shadow"
                      style={{
                        width: `${teamAPct}%`,
                        backgroundColor: teamAColor
                      }}
                    />
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out shadow"
                      style={{
                        width: `${teamBPct}%`,
                        backgroundColor: teamBColor
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Chase Math Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-center font-mono relative z-10">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Runs Needed</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">
                    {Math.max(0, targetScore - runs)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Balls Left</span>
                  <span className="text-base font-black text-white mt-0.5 block">
                    {Math.max(0, Math.round((20.0 - cricketOversToDecimal(overs)) * 6))}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Required RR</span>
                  <span className="text-base font-black text-amber-400 mt-0.5 block">
                    {winResult?.required_run_rate ? `${winResult.required_run_rate.toFixed(2)}` : '9.13'}
                  </span>
                </div>
              </div>

              {/* Model Confidence & Forecast Note */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans relative z-10 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  Calculated using historical IPL chase records, required run rate pressure, and wicket preservation models.
                </p>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
