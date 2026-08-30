import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export default function PlayerSkillRadar({
  radarData = [],
  color = "#00F0FF"
}) {
  if (!radarData || radarData.length === 0) return null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid stroke="#334155" strokeDasharray="2 2" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            stroke="#475569" 
            tick={{ fill: '#64748B', fontSize: 9 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderColor: '#334155', 
              borderRadius: '0.75rem',
              color: '#F8FAFC',
              fontSize: '12px'
            }} 
            formatter={(val) => [`${val} / 100`, 'Impact Score']}
          />
          <Radar
            name="Performance Index"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
