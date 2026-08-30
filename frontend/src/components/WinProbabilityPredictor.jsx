import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Flame, 
  MapPin, 
  ShieldAlert, 
  Sparkles, 
  Sliders, 
  RotateCcw,
  Zap,
  CheckCircle,
  Info,
  Clock,
  Crosshair
} from 'lucide-react';
import { predictWinProbability } from '../services/api';
import CricketOversInput from './CricketOversInput';
import CricketNumberInput from './CricketNumberInput';

export default function WinProbabilityPredictor({ teams }) {
  const [battingTeam, setBattingTeam] = useState('Royal Challengers Bengaluru');
  const [bowlingTeam, setBowlingTeam] = useState('Kolkata Knight Riders');
  const [city, setCity] = useState('Kolkata');
  const [targetScore, setTargetScore] = useState(185);
  const [currentScore, setCurrentScore] = useState(110);
  const [wicketsLost, setWicketsLost] = useState(3);
  const [oversCompleted, setOversCompleted] = useState(12.0);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    handlePredict();
  }, [battingTeam, bowlingTeam, city, targetScore, currentScore, wicketsLost, oversCompleted]);

  const handlePredict = async () => {
    if (battingTeam === bowlingTeam) {
      setError("Chasing team and Defending team cannot be the same franchise.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await predictWinProbability({
        batting_team: battingTeam,
        bowling_team: bowlingTeam,
        city: city,
        target_score: Number(targetScore),
        current_score: Number(currentScore),
        wickets_lost: Number(wicketsLost),
        overs_completed: Number(oversCompleted),
      });
      setPrediction(res);
    } catch (err) {
      setError(err.message || "Failed to calculate win probability");
    } finally {
      setLoading(false);
    }
  };

  const battingMeta = teams.find(t => t.name === battingTeam);
  const bowlingMeta = teams.find(t => t.name === bowlingTeam);

  const ballsRemaining = Math.max(0, 120 - Math.round(oversCompleted * 6));
  const runsNeeded = Math.max(0, targetScore - currentScore);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/50 via-teal-950/60 to-cyan-950/50 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Real-time Chase Probability Engine (Gradient Boosting Classifier)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              IPL Match Win Probability Predictor
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Live second-innings win probability calculation factoring target pressure, remaining balls, wicket preservation, and required run rates.
            </p>
          </div>

          <button
            onClick={() => {
              setTargetScore(185);
              setCurrentScore(110);
              setWicketsLost(3);
              setOversCompleted(12.0);
            }}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Match Setup */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              2nd Innings Chase Teams
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Chasing Team (Batting)
                </label>
                <select
                  value={battingTeam}
                  onChange={(e) => setBattingTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>{t.name} ({t.short_name})</option>
                  ))}
                </select>
                {battingMeta && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: battingMeta.primary_color }} />
                    <span>Win %: <strong className="text-emerald-400">{battingMeta.win_percentage}%</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Defending Team (Bowling)
                </label>
                <select
                  value={bowlingTeam}
                  onChange={(e) => setBowlingTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>{t.name} ({t.short_name})</option>
                  ))}
                </select>
                {bowlingMeta && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bowlingMeta.primary_color }} />
                    <span>Win %: <strong className="text-cyan-400">{bowlingMeta.win_percentage}%</strong></span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Host City / Venue
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {["Mumbai", "Kolkata", "Chennai", "Bengaluru", "Delhi", "Jaipur", "Hyderabad", "Chandigarh", "Ahmedabad", "Lucknow", "Pune", "Neutral"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chase Game State */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Chase Equation</span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                Need {runsNeeded} off {ballsRemaining} balls
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Score */}
              <CricketNumberInput
                label="Target Score (1st Inn + 1)"
                value={targetScore}
                onChange={setTargetScore}
                min={50}
                max={300}
                colorScheme="amber"
                presets={[160, 180, 200, 220]}
                unit="Runs"
              />

              {/* Current Score */}
              <CricketNumberInput
                label="Current Runs"
                value={currentScore}
                onChange={setCurrentScore}
                min={0}
                max={targetScore + 10}
                colorScheme="emerald"
                presets={['+1', '+4', '+6']}
                unit="Runs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Wickets Lost */}
              <CricketNumberInput
                label="Wickets Fallen"
                value={wicketsLost}
                onChange={setWicketsLost}
                min={0}
                max={10}
                colorScheme="rose"
                presets={[0, 1, 2, 3, 4, 5]}
                unit="Wkts"
              />

              {/* Overs Completed */}
              <CricketOversInput
                value={oversCompleted}
                onChange={setOversCompleted}
                min={0.0}
                max={20.0}
                label="Overs"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Win Probability Meter & Factors */}
        <div className="lg:col-span-7 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {prediction && (
            <>
              {/* Main Probability Meter Card */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
                  <span>Match Win Probability</span>
                  <span className="text-emerald-400 font-mono text-[11px]">{prediction.model_version}</span>
                </h3>

                {/* Probability Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-bold text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-white">{prediction.chasing_team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{prediction.defending_team}</span>
                      <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    </div>
                  </div>

                  {/* Dual Animated Bar */}
                  <div className="h-6 w-full rounded-full bg-slate-950 p-1 flex overflow-hidden border border-slate-800">
                    <div 
                      className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 flex items-center justify-center text-[11px] font-black text-black font-mono shadow-sm"
                      style={{ width: `${Math.max(12, Math.min(88, prediction.chasing_team_win_prob))}%` }}
                    >
                      {prediction.chasing_team_win_prob}%
                    </div>
                    <div 
                      className="h-full rounded-r-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 flex items-center justify-center text-[11px] font-black text-black font-mono shadow-sm"
                      style={{ width: `${Math.max(12, Math.min(88, prediction.defending_team_win_prob))}%` }}
                    >
                      {prediction.defending_team_win_prob}%
                    </div>
                  </div>
                </div>

                {/* Match Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-400" /> Runs Needed
                    </span>
                    <span className="text-lg font-bold text-amber-400 font-mono mt-0.5 block">
                      {prediction.runs_needed}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> Balls Left
                    </span>
                    <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5 block">
                      {prediction.balls_remaining}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Current RR</span>
                    <span className="text-lg font-bold text-slate-200 font-mono mt-0.5 block">
                      {prediction.current_run_rate}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Required RR</span>
                    <span className={`text-lg font-bold font-mono mt-0.5 block ${
                      prediction.required_run_rate > 11 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {prediction.required_run_rate}
                    </span>
                  </div>
                </div>

                {/* Match Situation Box */}
                <div className="mt-5 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
                  <div className="flex items-start gap-2.5">
                    <Flame className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Live Match Dynamics
                      </h4>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        {prediction.match_situation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Factors List */}
                {prediction.key_factors && prediction.key_factors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <span className="text-xs font-semibold text-slate-400">Key AI Influence Drivers:</span>
                    <div className="flex flex-wrap gap-2">
                      {prediction.key_factors.map((f, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </>
          )}

          {/* Disclaimer */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Win probabilities represent model-inferred likelihoods and adjust dynamically with every delivery.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
