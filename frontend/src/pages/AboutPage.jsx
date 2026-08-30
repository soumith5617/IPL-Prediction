import React from 'react';
import { 
  BrainCircuit, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  GitBranch, 
  Layers, 
  CheckCircle2,
  Server,
  Activity,
  Award
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/70 via-[#0D1527] to-cyan-950/60 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Platform Architecture & Methodology
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            About IPL Prediction Intelligence Pro
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            An enterprise-grade sports analytics platform powered by scikit-learn machine learning ensembles, real historical delivery states, and FastAPI async inference.
          </p>
        </div>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pillar 1: Data Source */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">50,000+ Verified Deliveries</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trained on granular ball-by-ball IPL match records (2008–2024), capturing dynamic pitch scoring tempos, wicket depreciation curves, and venue dimensions.
          </p>
          <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-cyan-400">
            deliveries.csv • matches.csv • Players.xlsx
          </div>
        </div>

        {/* Pillar 2: ML Regressors */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">1st Innings Regression</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Random Forest & MLP Neural Network ensembles forecast final 20-over totals with an MAE of 5.50 runs and an explained variance ($R^2$) of 90.95%.
          </p>
          <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-blue-400">
            Rolling 5-Over Windows • Venue Priors
          </div>
        </div>

        {/* Pillar 3: Live Win Classifier */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">2nd Innings Win Probability</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gradient Boosting Classifier outputs live calibrated chase win probabilities with an ROC-AUC of 99.54% and a holdout accuracy of 96.91%.
          </p>
          <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-emerald-400">
            Required Run Rate • Balls Remaining
          </div>
        </div>

      </div>

      {/* Architecture Overview */}
      <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Full Stack Architecture Pipeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block font-mono">1. Data & Preprocessing</span>
            <p className="text-slate-300 font-semibold">ETL Pipeline</p>
            <p className="text-slate-400 text-[11px]">Causal ball filtering, team name normalization, rolling run rates.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-blue-400 block font-mono">2. Model Training</span>
            <p className="text-slate-300 font-semibold">Scikit-Learn Ensemble</p>
            <p className="text-slate-400 text-[11px]">80/20 train/test stratified split, pipeline column transformers, joblib serialization.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono">3. Inference API</span>
            <p className="text-slate-300 font-semibold">FastAPI Async Server</p>
            <p className="text-slate-400 text-[11px]">In-memory model singleton, SQLite transaction logging, Pydantic v2 schemas.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">4. Client Visuals</span>
            <p className="text-slate-300 font-semibold">React 18 + Recharts</p>
            <p className="text-slate-400 text-[11px]">Athletic dark theme, responsive navigation, over worm curves, radar charts.</p>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider block text-amber-400">Statistical Disclaimer</span>
          <p className="font-sans font-medium leading-relaxed">
            "Predictions are statistical estimates and are not guaranteed outcomes." All projected metrics, win probability percentages, and player scorecards are mathematical estimates calculated by trained machine learning algorithms from historical cricket records.
          </p>
        </div>
      </div>

    </div>
  );
}
