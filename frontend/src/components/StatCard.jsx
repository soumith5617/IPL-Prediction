import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'cyan', // cyan, emerald, amber, purple, blue, rose
  badge,
  trend, // { value: "+5.2%", positive: true }
  onClick,
  className = ""
}) {
  const colorMap = {
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'group-hover:border-cyan-500/50'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'group-hover:border-emerald-500/50'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'group-hover:border-amber-500/50'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'group-hover:border-purple-500/50'
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'group-hover:border-blue-500/50'
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      glow: 'group-hover:border-rose-500/50'
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-2xl p-5 border border-slate-800 transition-all duration-200 group ${
        onClick ? 'cursor-pointer hover:border-slate-700 hover:scale-[1.01]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {title}
            </span>
            {badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {value !== undefined && value !== null ? value : '--'}
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${scheme.bg} border ${scheme.border} flex items-center justify-center ${scheme.text} transition-transform group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-slate-400 font-medium truncate">{subtitle}</span>
          )}
          {trend && (
            <span className={`font-mono font-bold ml-auto ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
