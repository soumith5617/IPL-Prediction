import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import MatchPredictionPage from './pages/MatchPredictionPage';
import LivePredictionPage from './pages/LivePredictionPage';
import PlayerAnalysisPage from './pages/PlayerAnalysisPage';
import TeamComparisonPage from './pages/TeamComparisonPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import ModelInsightsPage from './pages/ModelInsightsPage';
import AboutPage from './pages/AboutPage';
import { LoadingSpinner } from './components/LoadingState';
import { fetchTeams, fetchHealth, fetchVenues } from './services/api';

function AppRoutes() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [systemHealthy, setSystemHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [healthRes, teamsRes, venuesRes] = await Promise.all([
          fetchHealth().catch(() => ({ status: 'down' })),
          fetchTeams().catch(() => []),
          fetchVenues().catch(() => [])
        ]);

        setSystemHealthy(healthRes.status === 'healthy');
        setTeams(teamsRes || []);
        setVenues(venuesRes || []);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleTabChange = (tabId) => {
    const routeMap = {
      dashboard: '/',
      score: '/match-prediction',
      win: '/live-prediction',
      players: '/players',
      teams: '/teams',
      h2h: '/teams',
      history: '/history',
      metrics: '/model-insights',
      about: '/about'
    };
    navigate(routeMap[tabId] || '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6">
        <LoadingSpinner size="lg" text="Initializing ML Prediction Intelligence Telemetry..." />
      </div>
    );
  }

  return (
    <MainLayout systemHealthy={systemHealthy}>
      <Routes>
        <Route path="/" element={<DashboardPage setActiveTab={handleTabChange} teams={teams} />} />
        <Route path="/match-prediction" element={<MatchPredictionPage teams={teams} venues={venues} />} />
        <Route path="/live-prediction" element={<LivePredictionPage teams={teams} venues={venues} />} />
        <Route path="/players" element={<PlayerAnalysisPage />} />
        <Route path="/teams" element={<TeamComparisonPage teams={teams} />} />
        <Route path="/team-comparison" element={<TeamComparisonPage teams={teams} />} />
        <Route path="/history" element={<PredictionHistoryPage />} />
        <Route path="/model-insights" element={<ModelInsightsPage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* Fallback */}
        <Route path="*" element={<DashboardPage setActiveTab={handleTabChange} teams={teams} />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
