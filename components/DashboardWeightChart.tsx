import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { getSettings, getWeightLogs } from '../services/storage';
import { UserSettings, WeightEntry } from '../types';
import { format, parseISO, differenceInDays } from 'date-fns';

const DashboardWeightChart: React.FC = () => {
  const [settings] = useState<UserSettings>(getSettings());
  const [logs, setLogs] = useState<WeightEntry[]>([]);

  useEffect(() => {
    setLogs(getWeightLogs());
  }, []);

  const chartData = useMemo(() => {
    const dataPoints: any[] = [];
    const startDate = parseISO(settings.startDate);
    const monthsDuration = 7; 
    
    // Create target points
    for (let i = 0; i <= monthsDuration * 2; i++) {
        const daysToAdd = i * 15;
        const pointDate = new Date(startDate);
        pointDate.setDate(startDate.getDate() + daysToAdd);
        
        const daysPassed = daysToAdd;
        const targetWeight = Math.max(
            settings.goalWeight, 
            settings.startWeight - (daysPassed * (settings.monthlyLossTarget / 30))
        );
        
        const dateStr = format(pointDate, 'yyyy-MM-dd');

        dataPoints.push({
            date: dateStr,
            target: parseFloat(targetWeight.toFixed(2)),
            actual: null,
            isTarget: true
        });
    }

    logs.forEach(log => {
        const existing = dataPoints.find(d => d.date === log.date);
        if (existing) {
            existing.actual = log.weight;
        } else {
            const logDateObj = parseISO(log.date);
            const diffDays = differenceInDays(logDateObj, startDate);
            let targetWeight = null;
            if (diffDays >= 0) {
                 targetWeight = Math.max(
                    settings.goalWeight, 
                    settings.startWeight - (diffDays * (settings.monthlyLossTarget / 30))
                );
            }

            dataPoints.push({
                date: log.date,
                target: targetWeight ? parseFloat(targetWeight.toFixed(2)) : null,
                actual: log.weight,
                isTarget: false
            });
        }
    });

    return dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, settings]);

  if (logs.length === 0) {
      return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Weight Progress</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => format(parseISO(str), 'MMM')}
              fontSize={10}
              tick={{fill: '#9ca3af'}}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              fontSize={10}
              tick={{fill: '#9ca3af'}}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              labelFormatter={(str) => format(parseISO(str as string), 'MMM d')}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#d1d5db" 
              strokeDasharray="4 4" 
              name="Goal" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#4f46e5" 
              name="Weight" 
              strokeWidth={2}
              connectNulls
              dot={{ r: 3, fill: '#4f46e5' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardWeightChart;