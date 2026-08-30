import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  CheckCircle2, 
  Layers, 
  Gauge, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { fetchModelMetrics } from '../services/api';

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetchModelMetrics();
      setMetrics(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        Loading ML model benchmarks and metrics...
      </div>
    );
  }

  const scoreData = metrics.score_model?.metrics ? Object.entries(metrics.score_model.metrics).map(([name, m]) => ({
    name,
    RMSE: m.RMSE,
    MAE: m.MAE,
    R2: m.R2 * 100
  })) : [];

  const winData = metrics.win_probability_model?.metrics ? Object.entries(metrics.win_probability_model.metrics).map(([name, m]) => ({
    name: name.replace(' Classifier', ''),
    Accuracy: m.Accuracy,
    LogLoss: m.Log_Loss * 100,
    ROC_AUC: m.ROC_AUC * 100
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BrainCircuit className="w-4 h-4" /> Machine Learning Architecture & Evaluation Suite
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Model Performance & Benchmarks</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Comprehensive benchmark comparisons across 5 regression models and 3 classification algorithms trained on over 50,000+ ball-by-ball IPL match states.
        </p>
      </div>

      {/* Regression Score Model Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              First Innings Score Predictor (Regression Suite)
            </h2>
            <p className="text-xs text-slate-400">Target: Total 1st Innings Runs • Metric: Mean Absolute Error (MAE) & RMSE</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            Selected: {metrics.score_model?.model_name || 'Random Forest'}
          </span>
        </div>

        {/* Score Models Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-sans">Model Architecture</th>
                <th className="py-3 px-4 text-right">MAE (Runs)</th>
                <th className="py-3 px-4 text-right">RMSE (Runs)</th>
                <th className="py-3 px-4 text-right">R² Score</th>
                <th className="py-3 px-4 text-center font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.score_model?.metrics && Object.entries(metrics.score_model.metrics).map(([mName, mVals]) => {
                const isBest = mName === metrics.score_model.model_name;
                return (
                  <tr key={mName} className={`transition ${isBest ? 'bg-cyan-950/20' : 'hover:bg-slate-800/30'}`}>
                    <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                      {isBest && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      {mName}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">{mVals.MAE}</td>
                    <td className="py-3.5 px-4 text-right text-cyan-300 font-bold">{mVals.RMSE}</td>
                    <td className="py-3.5 px-4 text-right text-amber-400 font-bold">{mVals.R2}</td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      {isBest ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase">
                          Production Active
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Feature Columns */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold block mb-2">Input Pipeline Features:</span>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {metrics.score_model?.feature_columns?.map((col) => (
              <span key={col} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Classification Win Model Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Match Win Probability Predictor (Classification Suite)
            </h2>
            <p className="text-xs text-slate-400">Target: Match Chase Winner • Metric: Accuracy, Log Loss, ROC-AUC</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            Selected: {metrics.win_probability_model?.model_name || 'Gradient Boosting'}
          </span>
        </div>

        {/* Win Models Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-sans">Model Architecture</th>
                <th className="py-3 px-4 text-right">Accuracy (%)</th>
                <th className="py-3 px-4 text-right">Log Loss</th>
                <th className="py-3 px-4 text-right">ROC-AUC</th>
                <th className="py-3 px-4 text-right">Brier Score</th>
                <th className="py-3 px-4 text-center font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.win_probability_model?.metrics && Object.entries(metrics.win_probability_model.metrics).map(([mName, mVals]) => {
                const isBest = mName === metrics.win_probability_model.model_name;
                return (
                  <tr key={mName} className={`transition ${isBest ? 'bg-emerald-950/20' : 'hover:bg-slate-800/30'}`}>
                    <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                      {isBest && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {mName}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">{mVals.Accuracy}%</td>
                    <td className="py-3.5 px-4 text-right text-cyan-300 font-bold">{mVals.Log_Loss}</td>
                    <td className="py-3.5 px-4 text-right text-amber-400 font-bold">{mVals.ROC_AUC}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{mVals.Brier_Score}</td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      {isBest ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
                          Production Active
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
