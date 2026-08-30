import React from 'react';

export default function WinProbabilityMeter({
  team1Name = "Chasing Team",
  team2Name = "Defending Team",
  team1Prob = 50.0,
  team2Prob = 50.0,
  team1Color = "#EC1C24",
  team2Color = "#3A225D"
}) {
  const p1 = Math.max(0, Math.min(100, Number(team1Prob) || 50));
  const p2 = Math.max(0, Math.min(100, Number(team2Prob) || (100 - p1)));

  return (
    <div className="space-y-4">
      {/* Header Numbers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full shadow-md" style={{ backgroundColor: team1Color }} />
          <div>
            <span className="text-xs font-bold text-white block">{team1Name}</span>
            <span className="text-2xl font-black font-mono tracking-tight" style={{ color: team1Color }}>
              {p1.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Win Probability</span>
          <span className="text-xs font-mono text-slate-400 font-bold">LIVE ML SPLIT</span>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <span className="text-xs font-bold text-white block">{team2Name}</span>
            <span className="text-2xl font-black font-mono tracking-tight" style={{ color: team2Color }}>
              {p2.toFixed(1)}%
            </span>
          </div>
          <span className="w-3.5 h-3.5 rounded-full shadow-md" style={{ backgroundColor: team2Color }} />
        </div>
      </div>

      {/* Dual Progress Split Meter */}
      <div className="h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800 p-0.5 shadow-inner">
        <div 
          className="h-full rounded-l-full transition-all duration-700 ease-out flex items-center justify-end pr-2 shadow-lg"
          style={{ 
            width: `${p1}%`, 
            backgroundColor: team1Color,
            boxShadow: `0 0 12px ${team1Color}80` 
          }}
        />
        <div 
          className="h-full rounded-r-full transition-all duration-700 ease-out flex items-center justify-start pl-2 shadow-lg"
          style={{ 
            width: `${p2}%`, 
            backgroundColor: team2Color,
            boxShadow: `0 0 12px ${team2Color}80` 
          }}
        />
      </div>
    </div>
  );
}
