import React from 'react';
import { User, Globe, Calendar, Award, Flame, Zap, Shield, ChevronRight } from 'lucide-react';
import { calculateDerivedAge } from '../utils/dateUtils';

export default function PlayerCard({
  player,
  onSelect,
  className = ""
}) {
  if (!player) return null;

  const derivedAge = calculateDerivedAge(player.dob);
  const hasStats = (player.matches > 0 || player.total_runs > 0 || player.wickets > 0);

  return (
    <div 
      onClick={() => onSelect && onSelect(player)}
      className={`glass-panel-interactive rounded-2xl p-5 border border-slate-800 flex flex-col justify-between cursor-pointer group bg-slate-900/50 hover:bg-slate-900/90 hover:border-cyan-500/40 transition-all ${className}`}
    >
      <div className="space-y-3.5">
        {/* Header: Name & Country */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
              {player.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>{player.country || 'International'}</span>
            </div>
          </div>

          <button 
            type="button" 
            className="p-1.5 rounded-lg bg-slate-800/60 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 transition"
            aria-label={`View ${player.name} details`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Player Core Attributes */}
        <div className="space-y-1.5 text-xs">
          {/* Date of Birth & Age */}
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> DOB:
            </span>
            <span className="text-slate-200 font-mono">
              {player.dob ? (
                <>
                  {player.dob} {derivedAge && <strong className="text-cyan-400 font-bold">({derivedAge})</strong>}
                </>
              ) : (
                'Not recorded'
              )}
            </span>
          </div>

          {/* Batting Hand */}
          <div className="flex items-center justify-between text-slate-400">
            <span>Batting Hand:</span>
            <span className="text-slate-200 font-semibold">{player.batting_hand || 'Not listed'}</span>
          </div>

          {/* Bowling Skill */}
          <div className="flex items-center justify-between text-slate-400">
            <span>Bowling Skill:</span>
            <span className="text-slate-200 font-semibold truncate max-w-[150px] text-right">
              {player.bowling_skill || 'None / Part-time'}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Section: Only show real data or explicit note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        {hasStats ? (
          <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Matches</span>
              <span className="text-white font-bold text-sm">{player.matches}</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Runs</span>
              <span className="text-cyan-400 font-bold text-sm">{player.total_runs}</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Wickets</span>
              <span className="text-emerald-400 font-bold text-sm">{player.wickets}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic text-center py-1">
            Performance statistics are not available in the current dataset.
          </p>
        )}
      </div>
    </div>
  );
}
