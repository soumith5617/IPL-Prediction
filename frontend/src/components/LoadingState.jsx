import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

export function LoadingSpinner({ text = "Loading data...", size = "md" }) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-3" role="status" aria-live="polite">
      <div className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-cyan-500/20 border-t-cyan-400 animate-spin`} />
      {text && <p className="text-xs font-semibold text-slate-400 font-sans tracking-wide">{text}</p>}
      <span className="sr-only">{text}</span>
    </div>
  );
}

export function SkeletonCard({ rows = 3, className = "" }) {
  return (
    <div className={`glass-panel rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-slate-800 rounded-full w-8" />
      </div>
      <div className="h-8 bg-slate-800/80 rounded w-1/2" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-800/60 rounded" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-800 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-800/60 p-4 space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 py-2">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3.5 bg-slate-800/50 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ title = "Failed to load data", message, onRetry }) {
  return (
    <div className="glass-panel rounded-2xl p-8 border border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-slate-900 text-center space-y-3 max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      {message && <p className="text-xs text-slate-400">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Database, title = "No data found", description = "Try changing your filters or running a prediction.", action }) {
  return (
    <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center space-y-3 max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-slate-400">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export default {
  LoadingSpinner,
  SkeletonCard,
  SkeletonTable,
  ErrorState,
  EmptyState
};
