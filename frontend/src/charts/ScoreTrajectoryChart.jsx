import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function ScoreTrajectoryChart({
  data = [],
  currentOver = 10,
  battingColor = "#00F0FF"
}) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={battingColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={battingColor} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis 
            dataKey="over" 
            stroke="#64748B" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis 
            stroke="#64748B" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderColor: '#334155', 
              borderRadius: '0.75rem',
              color: '#F8FAFC',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
            }} 
            formatter={(value, name) => [`${value} Runs`, name]}
          />
          <Area 
            type="monotone" 
            dataKey="Actual" 
            stroke="#3B82F6" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#actualAreaGrad)" 
            name="Current Runs"
          />
          <Area 
            type="monotone" 
            dataKey="Projected" 
            stroke={battingColor} 
            strokeWidth={3} 
            strokeDasharray="4 4"
            fillOpacity={1} 
            fill="url(#scoreAreaGrad)" 
            name="ML Projected"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
