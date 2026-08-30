import React from 'react';
import { Shield, ChevronDown } from 'lucide-react';

export default function TeamSelector({
  label = "Select Franchise",
  value,
  onChange,
  teams = [],
  exclude,
  badge,
  disabled = false,
  className = ""
}) {
  const selectedTeam = teams.find(t => t.name === value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            {badge}
          </span>
        )}
      </div>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none transition shadow-inner pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {teams.map((t) => (
            <option 
              key={t.id || t.name} 
              value={t.name} 
              disabled={t.name === exclude}
              className="bg-slate-900 text-white py-1"
            >
              {t.name} {t.short_name ? `(${t.short_name})` : ''} {t.name === exclude ? '• Already Selected' : ''}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 text-slate-400">
          {selectedTeam?.primary_color && (
            <span 
              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: selectedTeam.primary_color }}
            />
          )}
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {selectedTeam && (
        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="font-mono text-slate-300 font-semibold">{selectedTeam.short_name}</span>
          <span>•</span>
          <span>{selectedTeam.titles || 0} Titles</span>
          <span>•</span>
          <span className="text-emerald-400 font-mono font-medium">{selectedTeam.win_percentage || 0}% Win Rate</span>
        </div>
      )}
    </div>
  );
}
