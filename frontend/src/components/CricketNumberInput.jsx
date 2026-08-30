import React from 'react';
import { Plus, Minus } from 'lucide-react';

/**
 * Professional Cricket Numeric Stepper & Slider Component.
 * Provides unified, futuristic glassmorphic styling with:
 * - Direct numeric input & keyboard step
 * - Smooth range slider
 * - Quick boundary / event preset buttons (+1, +4, +6, etc.)
 */
export default function CricketNumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 350,
  step = 1,
  colorScheme = 'cyan', // 'cyan' | 'amber' | 'emerald' | 'purple' | 'rose'
  presets = null, // array of numbers/increments or preset objects
  unit = '',
  className = ''
}) {
  const numValue = Number(value) || 0;

  const colorStyles = {
    cyan: {
      accent: 'accent-cyan-400',
      badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      focus: 'focus-within:border-cyan-400',
      activeBtn: 'active:bg-cyan-500/20',
      sliderTrack: 'from-cyan-500/30 to-cyan-500'
    },
    amber: {
      accent: 'accent-amber-400',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      focus: 'focus-within:border-amber-400',
      activeBtn: 'active:bg-amber-500/20',
      sliderTrack: 'from-amber-500/30 to-amber-500'
    },
    emerald: {
      accent: 'accent-emerald-400',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      focus: 'focus-within:border-emerald-400',
      activeBtn: 'active:bg-emerald-500/20',
      sliderTrack: 'from-emerald-500/30 to-emerald-500'
    },
    purple: {
      accent: 'accent-purple-400',
      badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      focus: 'focus-within:border-purple-400',
      activeBtn: 'active:bg-purple-500/20',
      sliderTrack: 'from-purple-500/30 to-purple-500'
    },
    rose: {
      accent: 'accent-rose-400',
      badge: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      focus: 'focus-within:border-rose-400',
      activeBtn: 'active:bg-rose-500/20',
      sliderTrack: 'from-rose-500/30 to-rose-500'
    }
  };

  const scheme = colorStyles[colorScheme] || colorStyles.cyan;

  const handleIncrement = (amount = 1) => {
    const next = Math.min(max, numValue + amount);
    onChange(next);
  };

  const handleDecrement = (amount = 1) => {
    const prev = Math.max(min, numValue - amount);
    onChange(prev);
  };

  const handleDirectChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div className={`p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md ${className}`}>
      {/* Header Label + Value Badge */}
      <div className="flex justify-between items-center text-xs gap-2">
        <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px] truncate">
          {label}
        </label>
        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs border ${scheme.badge} flex-shrink-0 whitespace-nowrap`}>
          {numValue} {unit}
        </span>
      </div>

      {/* Smooth Range Slider */}
      <div className="pt-0.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${scheme.accent}`}
        />
      </div>

      {/* Stepper with - / + Controls */}
      <div className={`flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-xl p-1 shadow-inner ${scheme.focus} transition`}>
        {/* Decrement Button */}
        <button
          type="button"
          onClick={() => handleDecrement(1)}
          disabled={numValue <= min}
          aria-label={`Decrease ${label}`}
          className={`w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 ${scheme.activeBtn} text-slate-300 hover:text-white border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Numeric Input */}
        <input
          type="number"
          min={min}
          max={max}
          value={numValue}
          onChange={handleDirectChange}
          className="w-full bg-transparent text-center font-mono font-black text-sm text-white focus:outline-none"
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={() => handleIncrement(1)}
          disabled={numValue >= max}
          aria-label={`Increase ${label}`}
          className={`w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 ${scheme.activeBtn} text-slate-300 hover:text-white border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Presets (e.g. +1, +4, +6 or custom presets) */}
      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">Quick:</span>
          <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar">
            {presets.map((preset, idx) => {
              const isIncrement = typeof preset === 'string' && preset.startsWith('+');
              const isSet = typeof preset === 'number';
              const text = isIncrement ? preset : isSet ? preset : preset.label;
              const val = isIncrement ? parseInt(preset) : isSet ? preset : preset.value;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (isIncrement) handleIncrement(val);
                    else onChange(val);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 font-mono text-[10px] font-bold border border-slate-800 hover:border-slate-700 transition flex-shrink-0"
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
