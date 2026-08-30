import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { 
  incrementCricketOvers, 
  decrementCricketOvers, 
  normalizeCricketOvers, 
  cricketOversToTotalBalls 
} from '../utils/cricketUtils';

/**
 * Professional Cricket Overs Stepper & 6-Ball Progress Component.
 * Enforces cricket notation: 1 over = exactly 6 balls (0.1 through 0.6 / 1.0).
 * Displays a unified high-end card with direct numeric input, steppers, and B1-B6 tokens.
 */
export default function CricketOversInput({
  value,
  onChange,
  min = 0.0,
  max = 20.0,
  label = "Overs",
  showBallsBadge = true,
  showBallTracker = true,
  className = ""
}) {
  const currentOvers = Number(value) || 0.0;
  const totalBalls = cricketOversToTotalBalls(currentOvers);
  const fullOvers = Math.floor(currentOvers);
  const currentBallInOver = Math.round((currentOvers - fullOvers) * 10);

  const handleIncrement = () => {
    const nextVal = incrementCricketOvers(currentOvers, max);
    onChange(nextVal);
  };

  const handleDecrement = () => {
    const prevVal = decrementCricketOvers(currentOvers, min);
    onChange(prevVal);
  };

  const handleChange = (e) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      onChange(0.0);
      return;
    }
    const normalized = normalizeCricketOvers(rawVal, currentOvers);
    onChange(normalized);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const handleSetBall = (ballNum) => {
    if (ballNum === 6) {
      // 6th ball completes the over
      const nextOver = Math.min(max, fullOvers + 1.0);
      onChange(Number(nextOver.toFixed(1)));
    } else {
      const nextVal = Math.min(max, fullOvers + (ballNum / 10.0));
      onChange(Number(nextVal.toFixed(1)));
    }
  };

  return (
    <div className={`p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md flex flex-col justify-between ${className}`}>
      {/* Header Label + Total Deliveries Badge */}
      <div className="flex justify-between items-center text-xs">
        <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
          {label}
        </label>
        {showBallsBadge && (
          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs border text-emerald-400 bg-emerald-500/10 border-emerald-500/30 whitespace-nowrap">
            {currentOvers.toFixed(1)} ov ({totalBalls}/120b)
          </span>
        )}
      </div>

      {/* Stepper with - / + Controls */}
      <div className="flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-xl p-1 shadow-inner focus-within:border-emerald-400 transition">
        {/* Decrement 1 Ball Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={currentOvers <= min}
          aria-label="Decrease by 1 ball"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-emerald-500/20 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Numeric Overs Display */}
        <input
          type="text"
          inputMode="decimal"
          value={currentOvers.toFixed(1)}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Overs in cricket notation"
          className="w-full bg-transparent text-center font-mono font-black text-sm text-white focus:outline-none"
        />

        {/* Increment 1 Ball Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={currentOvers >= max}
          aria-label="Increase by 1 ball"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-emerald-500/20 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive 6-Ball Over Deliveries (B1 through B6) */}
      {showBallTracker && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Over Deliveries:</span>
            <span className="text-emerald-400 font-bold">
              {currentBallInOver === 0 ? 'Over Complete' : `Ball ${currentBallInOver} of 6`}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {[1, 2, 3, 4, 5, 6].map((ballNum) => {
              const isDelivered = (currentBallInOver > 0 && ballNum <= currentBallInOver) || (currentBallInOver === 0 && ballNum === 6 && fullOvers > 0);
              const isCurrent = ballNum === (currentBallInOver || 6);

              return (
                <button
                  key={ballNum}
                  type="button"
                  onClick={() => handleSetBall(ballNum)}
                  className={`py-0.5 rounded text-center text-[10px] font-mono font-bold transition border ${
                    isCurrent
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-sm shadow-emerald-500/40'
                      : isDelivered
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                  title={`Set to Ball ${ballNum}`}
                >
                  B{ballNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
