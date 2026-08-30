import React from 'react';
import { 
  Percent, 
  TrendingUp, 
  Flame, 
  Target, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Sparkles 
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

export default function ProbabilityChart({
  team1Name = "Team A",
  team2Name = "Team B",
  team1Prob = 50.0,
  team2Prob = 50.0,
  team1Color = "#00F0FF",
  team2Color = "#3B82F6",
  targetScore,
  currentScore,
  oversCompleted,
  wicketsLost,
  className = ""
}) {
  const prob1 = Math.max(0, Math.min(100, Number(team1Prob) || 50));
  const prob2 = Math.max(0, Math.min(100, Number(team2Prob) || (100 - prob1)));

  // Generate simulated momentum curve from current over to over 20 based on current probability
  const momentumData = [];
  const currentOverNum = Math.floor(oversCompleted || 10);
  for (let o = Math.max(1, currentOverNum - 5); o <= 20; o++) {
    let projectedProb1;
    if (o < currentOverNum) {
      projectedProb1 = Math.max(10, Math.min(90, prob1 + (Math.sin(o * 1.5) * 8)));
    } else if (o === currentOverNum) {
      projectedProb1 = prob1;
    } else {
      // Future trend towards 100% or 0% depending on who is leading
      const diff = prob1 - 50;
      const step = (o - currentOverNum) / Math.max(1, (20 - currentOverNum));
      projectedProb1 = Math.max(2, Math.min(98, prob1 + (diff > 0 ? step * (95 - prob1) : step * (5 - prob1))));
    }
    momentumData.push({
      over: `Ov ${o}`,
      [team1Name]: Number(projectedProb1.toFixed(1)),
      [team2Name]: Number((100 - projectedProb1).toFixed(1))
    });
  }

  const ballsRemaining = Math.max(0, 120 - Math.round((oversCompleted || 0) * 6));
  const runsRemaining = targetScore ? Math.max(0, targetScore - (currentScore || 0)) : null;
  const crr = (oversCompleted && oversCompleted > 0) ? ((currentScore || 0) / oversCompleted).toFixed(2) : '0.00';
  const rrr = (ballsRemaining > 0 && runsRemaining !== null) ? ((runsRemaining / ballsRemaining) * 6).toFixed(2) : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Visual Probability Split Gauge Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-cyan-400" />
            Live Win Probability Split
          </span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
            Ensemble Gradient Boosted ML
          </span>
        </div>

        {/* Big Percentage Badges */}
        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Team 1 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: team1Color }} />
              <span className="font-bold text-sm text-white truncate">{team1Name}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight" style={{ color: team1Color }}>
              {prob1.toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400 block">Chasing Franchise</span>
          </div>

          {/* Team 2 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-right space-y-1">
            <div className="flex items-center justify-end gap-2">
              <span className="font-bold text-sm text-white truncate">{team2Name}</span>
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: team2Color }} />
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight" style={{ color: team2Color }}>
              {prob2.toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400 block">Defending Franchise</span>
          </div>
        </div>

        {/* Dual Progress Meter */}
        <div className="space-y-1.5 pt-2">
          <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-700/80 p-0.5 shadow-inner">
            <div 
              className="h-full rounded-l-full transition-all duration-700 ease-out flex items-center justify-start pl-2"
              style={{ 
                width: `${prob1}%`,
                background: `linear-gradient(90deg, ${team1Color}dd, ${team1Color})`,
                boxShadow: prob1 > 50 ? `0 0 16px ${team1Color}66` : 'none'
              }}
            />
            <div 
              className="h-full rounded-r-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
              style={{ 
                width: `${prob2}%`,
                background: `linear-gradient(90deg, ${team2Color}, ${team2Color}dd)`,
                boxShadow: prob2 > 50 ? `0 0 16px ${team2Color}66` : 'none'
              }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>{team1Name}: {prob1.toFixed(1)}%</span>
            <span>{team2Name}: {prob2.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Chase Dynamics Strip */}
      {targetScore && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Runs</span>
            <span className="text-xl font-black font-mono text-amber-400">{runsRemaining} Runs</span>
            <span className="text-[10px] text-slate-500 font-mono">From {ballsRemaining} balls</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Run Rate</span>
            <span className={`text-xl font-black font-mono ${Number(rrr) > 11 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {rrr || '--'} RPO
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Target: {targetScore}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Run Rate</span>
            <span className="text-xl font-black font-mono text-emerald-400">{crr} RPO</span>
            <span className="text-[10px] text-slate-500 font-mono">{currentScore}/{wicketsLost} ({oversCompleted} ov)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Chase Leverage</span>
            <span className="text-xl font-black font-mono text-white">
              {prob1 >= 65 ? 'Dominant' : prob1 >= 45 ? 'Balanced' : 'High Pressure'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{10 - (wicketsLost || 0)} wkts in hand</span>
          </div>
        </div>
      )}

      {/* Probability Momentum Flow Recharts Curve */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Projected Win Momentum Trajectory
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Over-by-Over Simulation</span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={momentumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="probGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={team1Color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={team1Color} stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="probGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={team2Color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={team2Color} stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="over" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#F8FAFC',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey={team1Name} 
                stroke={team1Color} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#probGrad1)" 
              />
              <Area 
                type="monotone" 
                dataKey={team2Name} 
                stroke={team2Color} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#probGrad2)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
