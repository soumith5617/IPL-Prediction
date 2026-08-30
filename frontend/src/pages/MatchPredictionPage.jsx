import React from 'react';
import ScorePrediction from '../components/ScorePrediction';

export default function MatchPredictionPage({ teams = [], venues = [] }) {
  return (
    <div className="pb-12">
      <ScorePrediction teams={teams} venues={venues} />
    </div>
  );
}
