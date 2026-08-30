import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  ShieldAlert, 
  Info,
  ArrowRight,
  RefreshCw,
  Activity,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import TeamSelector from './TeamSelector';
import CricketOversInput from './CricketOversInput';
import CricketNumberInput from './CricketNumberInput';
import { LoadingSpinner } from './LoadingState';
import { predictScore } from '../services/api';
import { 
  cricketOversToDecimal, 
  calculateAccurateCRR, 
  isValidCricketOvers, 
  formatCricketOvers,
  cricketOversToTotalBalls 
} from '../utils/cricketUtils';

import { useLocation, useSearchParams } from 'react-router-dom';

export default function ScorePrediction({ teams = [], venues = [] }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialBatting = location.state?.battingTeam || searchParams.get('batting') || 'Chennai Super Kings';
  const initialBowling = location.state?.bowlingTeam || searchParams.get('bowling') || 'Mumbai Indians';

  // Input State
  const [battingTeam, setBattingTeam] = useState(initialBatting);
  const [bowlingTeam, setBowlingTeam] = useState(initialBowling);
  const [city, setCity] = useState('Mumbai');
  const [currentRuns, setCurrentRuns] = useState(85);
  const [wicketsLost, setWicketsLost] = useState(2);
  const [oversCompleted, setOversCompleted] = useState(10.5);
  const [runsLast5, setRunsLast5] = useState(42);
  const [wicketsLast5, setWicketsLast5] = useState(1);

  // App State
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [apiError, setApiError] = useState(null);

  // Real-time calculation of CRR using exact cricket conversion (10.5 -> 10 + 5/6)
  const computedCRR = useMemo(() => {
    return calculateAccurateCRR(currentRuns, oversCompleted);
  }, [currentRuns, oversCompleted]);

  // Validation function enforcing all rules
  const validateInputs = () => {
    const errors = [];

    // 1. Teams cannot be identical
    if (battingTeam.trim().toLowerCase() === bowlingTeam.trim().toLowerCase()) {
      errors.push("Batting Team and Bowling Team cannot be identical franchises.");
    }

    // 2. Runs >= 0
    if (currentRuns < 0 || isNaN(currentRuns)) {
      errors.push("Current Runs must be greater than or equal to 0.");
    }

    // 3. Wickets between 0 and 10
    if (wicketsLost < 0 || wicketsLost > 10 || isNaN(wicketsLost)) {
      errors.push("Wickets must be between 0 and 10.");
    }

    // 4. Overs >= 0 and overs <= 20
    if (oversCompleted < 0 || oversCompleted > 20 || isNaN(oversCompleted)) {
      errors.push("Overs must be between 0.0 and 20.0.");
    } else if (!isValidCricketOvers(oversCompleted)) {
      errors.push(`Invalid cricket notation "${oversCompleted}". Balls must be between .0 and .5 (e.g. 10.5 = 10 overs + 5 balls).`);
    }

    // 5. runs_last_5 >= 0
    if (runsLast5 < 0 || isNaN(runsLast5)) {
      errors.push("Runs in Last 5 Overs must be greater than or equal to 0.");
    }
    if (runsLast5 > currentRuns) {
      errors.push(`Runs in Last 5 Overs (${runsLast5}) cannot exceed total Current Runs (${currentRuns}).`);
    }

    // 6. wickets_last_5 >= 0 and wickets_last_5 <= wickets
    if (wicketsLast5 < 0 || isNaN(wicketsLast5)) {
      errors.push("Wickets in Last 5 Overs must be greater than or equal to 0.");
    }
    if (wicketsLast5 > wicketsLost) {
      errors.push(`Wickets in Last 5 Overs (${wicketsLast5}) cannot exceed total Wickets Lost (${wicketsLost}).`);
    }

    return errors;
  };

  // Perform prediction call to backend POST /api/predict/score
  const handlePredict = async () => {
    const errors = validateInputs();
    setValidationErrors(errors);
    setApiError(null);

    if (errors.length > 0) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        batting_team: battingTeam,
        bowling_team: bowlingTeam,
        city: city || "Mumbai",
        current_score: Number(currentRuns),
        wickets_lost: Number(wicketsLost),
        overs_completed: Number(oversCompleted),
        runs_last_5: Number(runsLast5),
        wickets_last_5: Number(wicketsLast5),
      };

      const res = await predictScore(payload);

      // Extract result from schema
      const predictedScore = res.prediction?.predicted_score ?? res.predicted_score ?? 178;
      const lowerBound = res.prediction?.lower_bound ?? res.score_range_low ?? (predictedScore - 7);
      const upperBound = res.prediction?.upper_bound ?? res.score_range_high ?? (predictedScore + 7);

      setPrediction({
        ...res,
        predicted_score: predictedScore,
        lower_bound: lowerBound,
        upper_bound: upperBound,
        crr: computedCRR,
        current_score: currentRuns,
        overs: oversCompleted,
        wickets: wicketsLost
      });
    } catch (err) {
      console.error("Score prediction failed:", err);
      setApiError(err.message || "Failed to generate prediction. Please check input parameters.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on mount
  useEffect(() => {
    handlePredict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset function to default baseline
  const handleReset = () => {
    setBattingTeam('Chennai Super Kings');
    setBowlingTeam('Mumbai Indians');
    setCity('Mumbai');
    setCurrentRuns(85);
    setWicketsLost(2);
    setOversCompleted(10.5);
    setRunsLast5(42);
    setWicketsLast5(1);
    setValidationErrors([]);
    setApiError(null);

    // Call predict with defaults
    setTimeout(() => {
      predictScore({
        batting_team: 'Chennai Super Kings',
        bowling_team: 'Mumbai Indians',
        city: 'Mumbai',
        current_score: 85,
        wickets_lost: 2,
        overs_completed: 10.5,
        runs_last_5: 42,
        wickets_last_5: 1
      }).then(res => {
        const predictedScore = res.prediction?.predicted_score ?? res.predicted_score ?? 178;
        setPrediction({
          ...res,
          predicted_score: predictedScore,
          lower_bound: res.prediction?.lower_bound ?? (predictedScore - 7),
          upper_bound: res.prediction?.upper_bound ?? (predictedScore + 7),
          crr: "7.85",
          current_score: 85,
          overs: 10.5,
          wickets: 2
        });
      }).catch(() => {});
    }, 100);
  };

  const battingMeta = teams.find(t => t.name === battingTeam);
  const bowlingMeta = teams.find(t => t.name === bowlingTeam);

  // Generate over progression trajectory for chart visualization
  const overProgressionData = [];
  const currentOverInt = Math.floor(oversCompleted);
  const totalBallsBowled = cricketOversToTotalBalls(oversCompleted);
  const targetFinal = prediction?.predicted_score || 178;
  const remainingBalls = Math.max(1, 120 - totalBallsBowled);
  const runsRemaining = Math.max(0, targetFinal - currentRuns);
  const projectedFinishRR = runsRemaining / (remainingBalls / 6.0);

  for (let o = 5; o <= 20; o++) {
    let projectedRuns;
    if (o <= currentOverInt) {
      projectedRuns = Math.round(Number(computedCRR) * o);
    } else {
      const additionalOvers = o - cricketOversToDecimal(oversCompleted);
      projectedRuns = Math.round(currentRuns + (projectedFinishRR * additionalOvers));
    }
    overProgressionData.push({
      over: `Ov ${o}`,
      Runs: Math.min(320, Math.max(currentRuns, projectedRuns)),
      Projected: o > currentOverInt ? projectedRuns : null,
      Actual: o <= currentOverInt ? projectedRuns : null
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0D1527] to-[#1C2541] border border-cyan-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Machine Learning Score Regressor
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Match Score Prediction
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Configure real-time match conditions to forecast 1st innings total score and expected range.
            </p>
          </div>

          {/* Action Buttons: Reset & Predict Again */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition shadow-sm"
              title="Reset inputs to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={handlePredict}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Predict Again
            </button>
          </div>
        </div>
      </div>

      {/* Validation Error Alerts */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" /> Input Validation Error
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-300 font-medium">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Grid: LEFT = Match Configuration, RIGHT = Prediction Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: MATCH CONFIGURATION                                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#0B132B]/60 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Match Configuration
              </h2>
              <span className="text-xs text-slate-400 font-mono">20-Over T20 Format</span>
            </div>

            {/* 1. Team Selectors: Batting Team & Bowling Team */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TeamSelector 
                label="Batting Team"
                value={battingTeam}
                onChange={setBattingTeam}
                teams={teams}
                exclude={bowlingTeam}
                badge="1st Innings"
              />

              <TeamSelector 
                label="Bowling Team"
                value={bowlingTeam}
                onChange={setBowlingTeam}
                teams={teams}
                exclude={battingTeam}
                badge="Defending"
              />
            </div>

            {/* Match Venue City */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Match Venue City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner"
              >
                {(venues.length > 0 ? venues : [
                  { id: 'mumbai', city: 'Mumbai', name: 'Wankhede Stadium' },
                  { id: 'chennai', city: 'Chennai', name: 'MA Chidambaram Stadium' },
                  { id: 'kolkata', city: 'Kolkata', name: 'Eden Gardens' },
                  { id: 'bengaluru', city: 'Bengaluru', name: 'M Chinnaswamy Stadium' },
                  { id: 'delhi', city: 'Delhi', name: 'Arun Jaitley Stadium' },
                  { id: 'hyderabad', city: 'Hyderabad', name: 'Rajiv Gandhi International Stadium' },
                  { id: 'ahmedabad', city: 'Ahmedabad', name: 'Narendra Modi Stadium' },
                  { id: 'jaipur', city: 'Jaipur', name: 'Sawai Mansingh Stadium' },
                  { id: 'mohali', city: 'Mohali', name: 'IS Bindra Stadium' },
                  { id: 'lucknow', city: 'Lucknow', name: 'Ekana Cricket Stadium' }
                ]).map((v, idx) => {
                  const vCity = typeof v === 'object' ? (v.city || v.name) : v;
                  const vName = typeof v === 'object' ? (v.name || v.city) : `${v} Stadium`;
                  const vKey = typeof v === 'object' ? (v.id || `${vCity}-${idx}`) : v;
                  return (
                    <option key={vKey} value={vCity} className="bg-slate-900 text-white">
                      {vName} ({vCity})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Core Match State: Current Runs, Wickets, Overs */}
            <div className="pt-2 border-t border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Current Runs */}
                <CricketNumberInput
                  label="Current Runs"
                  value={currentRuns}
                  onChange={setCurrentRuns}
                  min={0}
                  max={350}
                  colorScheme="cyan"
                  presets={['+1', '+4', '+6']}
                  unit="Runs"
                />

                {/* Wickets */}
                <CricketNumberInput
                  label="Wickets (0–10)"
                  value={wicketsLost}
                  onChange={(w) => {
                    setWicketsLost(w);
                    if (wicketsLast5 > w) setWicketsLast5(w);
                  }}
                  min={0}
                  max={10}
                  colorScheme="amber"
                  presets={[0, 1, 2, 3, 4, 5]}
                  unit="Wkts"
                />

                {/* Overs */}
                <CricketOversInput
                  value={oversCompleted}
                  onChange={setOversCompleted}
                  min={0.0}
                  max={20.0}
                  label="Overs"
                />
              </div>

              {/* Automatic Run Rate Calculation Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>
                    Current Run Rate: <strong className="text-cyan-400 font-mono font-bold">{computedCRR}</strong> RPO
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatCricketOvers(oversCompleted)} ({cricketOversToDecimal(oversCompleted).toFixed(2)} decimal overs)
                </span>
              </div>

              {/* Last 5 Overs Momentum Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Runs in Last 5 Overs */}
                <CricketNumberInput
                  label="Runs in Last 5 Overs"
                  value={runsLast5}
                  onChange={(r) => setRunsLast5(Math.min(currentRuns, Math.max(0, r)))}
                  min={0}
                  max={currentRuns}
                  colorScheme="cyan"
                  presets={['+1', '+4', '+6']}
                  unit="Runs"
                />

                {/* Wickets in Last 5 Overs */}
                <CricketNumberInput
                  label="Wickets in Last 5 Overs"
                  value={wicketsLast5}
                  onChange={(w) => setWicketsLast5(Math.min(wicketsLost, Math.max(0, w)))}
                  min={0}
                  max={wicketsLost}
                  colorScheme="purple"
                  presets={[0, 1, 2, 3]}
                  unit="Wkts"
                />
              </div>

              {/* Submit Predict Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePredict}
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
                      Computing ML Score...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 fill-current" />
                      Calculate Match Score Prediction
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: PREDICTION RESULT                                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {loading && !prediction ? (
            <div className="glass-panel rounded-3xl p-16 border border-slate-800 flex flex-col items-center justify-center space-y-3">
              <LoadingSpinner text="Computing ML score prediction..." />
            </div>
          ) : prediction ? (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-br from-[#0B132B] via-slate-900 to-cyan-950/30 space-y-6 shadow-2xl relative overflow-hidden transition-all duration-500 animate-fadeIn">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header Matchup */}
              <div className="flex items-center justify-between relative z-10 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Match Prediction Outcome
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  {battingMeta?.short_name || battingTeam.split(' ')[0]} vs {bowlingMeta?.short_name || bowlingTeam.split(' ')[0]}
                </span>
              </div>

              {/* Large Prediction Card: PREDICTED FINAL SCORE */}
              <div className="text-center py-2 relative z-10">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                  PREDICTED FINAL SCORE
                </span>
                <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 glow-cyan">
                  {prediction.predicted_score}
                </div>
                <span className="text-xs text-slate-400 mt-2 block font-medium">
                  Projected 1st Innings Total
                </span>
              </div>

              {/* Expected Range Band */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative z-10">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-[11px]">Expected Range</span>
                  <span className="font-mono text-cyan-400 font-black text-base">
                    {prediction.lower_bound} — {prediction.upper_bound}
                  </span>
                </div>

                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden relative flex items-center p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(15, ((prediction.predicted_score - 100) / 150) * 100))}%` }} 
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block text-right">Expected Score Range (±8 Runs)</span>
              </div>

              {/* Match State Summary: Current Score, Overs, Wickets, Current Run Rate */}
              <div className="grid grid-cols-2 gap-3 relative z-10 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Current Score</span>
                  <span className="text-lg font-black text-white">{currentRuns} Runs</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Current Run Rate</span>
                  <span className="text-lg font-black text-cyan-400">{computedCRR} RPO</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Overs</span>
                  <span className="text-lg font-black text-emerald-400">{Number(oversCompleted).toFixed(1)} / 20.0</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Wickets</span>
                  <span className="text-lg font-black text-amber-400">{wicketsLost} / 10</span>
                </div>
              </div>

              {/* Prediction Explanation */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans relative z-10 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  The model estimates the final innings score based on the current match state and historical IPL patterns.
                </p>
              </div>

              {/* Action Buttons: Predict Again and Reset */}
              <div className="grid grid-cols-2 gap-3 pt-1 relative z-10">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Predict Again
                </button>
              </div>

              {/* Over Progression Worm Chart */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2 relative z-10">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Projected Trajectory Curve</span>
                  <span className="font-mono text-cyan-400">Target ~{prediction.predicted_score}</span>
                </div>

                <div className="h-32 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overProgressionData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wormGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="over" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[0, 'dataMax + 15']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F172A', 
                          borderColor: '#334155', 
                          borderRadius: '0.5rem', 
                          fontSize: '11px',
                          color: '#F8FAFC'
                        }} 
                      />
                      <Area type="monotone" dataKey="Runs" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#wormGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
