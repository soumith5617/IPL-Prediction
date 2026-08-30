import React from 'react';
import { Target, TrendingUp, Percent, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function PredictionCard({
  type = "score", // "score" or "win"
  prediction,
  battingTeam,
  bowlingTeam,
  battingColor = "#00F0FF",
  bowlingColor = "#3B82F6",
  className = ""
}) {
  if (!prediction) return null;

  if (type === "score") {
    const predictedScore = prediction.predicted_final_score || 0;
    const minScore = prediction.score_range_min || (predictedScore - 7);
    const maxScore = prediction.score_range_max || (predictedScore + 7);
    const modelUsed = prediction.model_used || "Random Forest Regressor";
    const crr = prediction.current_run_rate || "0.00";
    const prr = prediction.projected_run_rate || "0.00";

    return (
      <div className={`glass-panel rounded-3xl p-6 border border-slate-800 bg-gradient-to-br from-blue-950/30 via-slate-900 to-cyan-950/20 space-y-6 shadow-2xl relative overflow-hidden ${className}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Score Prediction Result
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
            {modelUsed}
          </span>
        </div>

        {/* Primary Predicted Score Highlight */}
        <div className="text-center py-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
            Predicted 1st Innings Total
          </span>
          <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 glow-cyan">
            {predictedScore}
          </div>
          <span className="text-xs text-slate-400 mt-2 block font-medium">
            Runs across 20.0 Overs
          </span>
        </div>

        {/* Score Range & Confidence Interval */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">90% Confidence Score Range</span>
            <span className="font-mono text-cyan-400 font-bold">{minScore} — {maxScore} Runs</span>
          </div>

          {/* Visual Range Indicator Bar */}
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative flex items-center p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(10, ((predictedScore - 100) / 150) * 100))}%` }} 
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Low (100)</span>
            <span>Target: {predictedScore}</span>
            <span>High (250+)</span>
          </div>
        </div>

        {/* Run Rate Comparators */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Run Rate</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5">{crr} RPO</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Projected Finish RR</span>
            <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{prr} RPO</span>
          </div>
        </div>
      </div>
    );
  }

  // Win Probability Card
  const winProbBatting = prediction.win_probability_batting || 50;
  const winProbBowling = prediction.win_probability_bowling || 50;

  return (
    <div className={`glass-panel rounded-3xl p-6 border border-slate-800 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-teal-950/20 space-y-6 shadow-2xl relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Win Probability Result
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
          {prediction.model_used || "Gradient Boosting Classifier"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center py-2">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-bold text-slate-300 block truncate">{battingTeam || "Chasing"}</span>
          <div className="text-4xl sm:text-5xl font-black font-mono text-cyan-400 my-1">
            {winProbBatting.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Win Probability</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-bold text-slate-300 block truncate">{bowlingTeam || "Defending"}</span>
          <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 my-1">
            {winProbBowling.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Win Probability</span>
        </div>
      </div>
    </div>
  );
}
