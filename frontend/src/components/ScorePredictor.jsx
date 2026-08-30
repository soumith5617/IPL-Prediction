import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  MapPin, 
  ShieldAlert, 
  Sparkles, 
  Sliders, 
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { predictScore } from '../services/api';
import CricketOversInput from './CricketOversInput';
import CricketNumberInput from './CricketNumberInput';

export default function ScorePredictor({ teams, venues }) {
  const [battingTeam, setBattingTeam] = useState('Chennai Super Kings');
  const [bowlingTeam, setBowlingTeam] = useState('Mumbai Indians');
  const [city, setCity] = useState('Mumbai');
  const [currentScore, setCurrentScore] = useState(85);
  const [wicketsLost, setWicketsLost] = useState(2);
  const [oversCompleted, setOversCompleted] = useState(10.0);
  const [runsLast5, setRunsLast5] = useState(42);
  const [wicketsLast5, setWicketsLast5] = useState(1);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // Auto-trigger prediction on load & change
  useEffect(() => {
    handlePredict();
  }, [battingTeam, bowlingTeam, city, currentScore, wicketsLost, oversCompleted, runsLast5, wicketsLast5]);

  const handlePredict = async () => {
    if (battingTeam === bowlingTeam) {
      setError("Batting team and Bowling team cannot be the same franchise.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await predictScore({
        batting_team: battingTeam,
        bowling_team: bowlingTeam,
        city: city,
        current_score: Number(currentScore),
        wickets_lost: Number(wicketsLost),
        overs_completed: Number(oversCompleted),
        runs_last_5: Number(runsLast5),
        wickets_last_5: Number(wicketsLast5),
      });
      setPrediction(res);
    } catch (err) {
      setError(err.message || "Failed to generate prediction");
    } finally {
      setLoading(false);
    }
  };

  const battingMeta = teams.find(t => t.name === battingTeam);
  const bowlingMeta = teams.find(t => t.name === bowlingTeam);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-950/60 to-purple-900/40 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Machine Learning Regressor (Scikit-Learn Neural Net Pipeline)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              1st Innings Final Score Predictor
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Forecasts projected total scores dynamically based on franchise strength, match tempo, wicket degradation, and historical venue scoring trends.
            </p>
          </div>
          
          <button
            onClick={() => {
              setCurrentScore(85);
              setWicketsLost(2);
              setOversCompleted(10.0);
              setRunsLast5(42);
              setWicketsLast5(1);
            }}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Match State
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Match Setup & Sliders */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Team Selection Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Franchise & Venue Matchup
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Batting Team */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Batting Team (1st Innings)
                </label>
                <select
                  value={battingTeam}
                  onChange={(e) => setBattingTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.short_name})
                    </option>
                  ))}
                </select>
                {battingMeta && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block" 
                      style={{ backgroundColor: battingMeta.primary_color }} 
                    />
                    <span>Avg Score: <strong className="text-white">{battingMeta.avg_score}</strong></span>
                    <span>• Titles: <strong className="text-amber-400">{battingMeta.titles}</strong></span>
                  </div>
                )}
              </div>

              {/* Bowling Team */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bowling Team
                </label>
                <select
                  value={bowlingTeam}
                  onChange={(e) => setBowlingTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.short_name})
                    </option>
                  ))}
                </select>
                {bowlingMeta && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block" 
                      style={{ backgroundColor: bowlingMeta.primary_color }} 
                    />
                    <span>Win Rate: <strong className="text-emerald-400">{bowlingMeta.win_percentage}%</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Venue City */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Host City / Venue
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {["Mumbai", "Kolkata", "Chennai", "Bengaluru", "Delhi", "Jaipur", "Hyderabad", "Chandigarh", "Ahmedabad", "Lucknow", "Pune", "Neutral"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live In-Game State Inputs */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Live In-Game Conditions</span>
              <span className="text-xs text-cyan-400 font-mono font-bold">
                CRR: {(currentScore / (oversCompleted || 1)).toFixed(2)} RPO
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Current Runs */}
              <CricketNumberInput
                label="Current Runs"
                value={currentScore}
                onChange={setCurrentScore}
                min={0}
                max={300}
                colorScheme="cyan"
                presets={['+1', '+4', '+6']}
                unit="Runs"
              />

              {/* Wickets Lost */}
              <CricketNumberInput
                label="Wickets Lost"
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
            </div>

            {/* Overs Completed */}
            <div>
              <CricketOversInput
                value={oversCompleted}
                onChange={setOversCompleted}
                min={0.0}
                max={20.0}
                label="Overs Completed"
              />
            </div>

            {/* Last 5 Overs Momentum */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CricketNumberInput
                label="Runs in Last 5 Overs"
                value={runsLast5}
                onChange={(r) => setRunsLast5(Math.min(currentScore, Math.max(0, r)))}
                min={0}
                max={currentScore}
                colorScheme="cyan"
                presets={['+1', '+4', '+6']}
                unit="Runs"
              />

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
          </div>

        </div>

        {/* Right Column: Prediction Results & Trajectory */}
        <div className="lg:col-span-7 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {prediction && (
            <>
              {/* Primary Score Forecast Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#131B2E] via-slate-900 to-[#1A233A] border border-cyan-500/30 p-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                      Machine Learning Forecast
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                      Expected Range: ±8 Runs (RMSE 8.23)
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl sm:text-6xl font-black text-white tracking-tight font-sans">
                        {prediction.predicted_score}
                      </span>
                      <span className="text-lg font-bold text-slate-400">Runs</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 inline-flex items-center gap-2">
                      <span className="text-xs text-slate-400">Projected Range:</span>
                      <span className="text-sm font-bold text-cyan-300 font-mono">
                        {prediction.score_range_low} – {prediction.score_range_high}
                      </span>
                    </div>
                  </div>

                  {/* Run Rate Breakdown */}
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Current Run Rate</span>
                      <span className="text-base font-bold text-slate-200 font-mono mt-0.5 block">
                        {prediction.current_run_rate} RPO
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Required Death RR</span>
                      <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">
                        {prediction.projected_run_rate} RPO
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Wickets Left</span>
                      <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
                        {prediction.wickets_remaining} In Hand
                      </span>
                    </div>
                  </div>

                  {/* AI Commentary */}
                  <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-900/40 text-xs text-cyan-200/90 leading-relaxed flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{prediction.commentary}</span>
                  </div>
                </div>
              </div>

              {/* Trajectory Worm Chart */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Innings Progression & Projected Worm
                    </h3>
                    <p className="text-[11px] text-slate-400">Score curve projection vs historical IPL average</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prediction.trajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="avgColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="over" stroke="#64748B" tick={{ fontSize: 11 }} unit=" ov" />
                      <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                        itemStyle={{ color: '#E2E8F0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area 
                        type="monotone" 
                        dataKey="projected_score" 
                        name="Projected Trajectory" 
                        stroke="#00F0FF" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#scoreColor)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="historical_avg_score" 
                        name="Venue Average Par" 
                        stroke="#94A3B8" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.5} 
                        fillOpacity={1} 
                        fill="url(#avgColor)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Disclaimer Banner */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Predictions are statistical machine-learning estimates based on historical IPL match models. Unpredictable match variables (drop catches, weather, pitch wear) may alter final outcomes.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
