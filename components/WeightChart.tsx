import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { getSettings, getWeightLogs, saveWeightLog } from '../services/storage';
import { UserSettings, WeightEntry } from '../types';
import { Plus, Target } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

const WeightChart: React.FC = () => {
  const [settings] = useState<UserSettings>(getSettings());
  const [logs, setLogs] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState<string>('');
  
  // Helper to get local date string YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [logDate, setLogDate] = useState<string>(getTodayStr());

  useEffect(() => {
    setLogs(getWeightLogs());
  }, []);

  const handleAddWeight = () => {
    if (!newWeight) return;
    const weightVal = parseFloat(newWeight);
    if (isNaN(weightVal)) return;

    const entry: WeightEntry = { date: logDate, weight: weightVal };
    saveWeightLog(entry);
    setLogs(getWeightLogs()); // Refresh
    setNewWeight('');
  };

  // Calculate Comparison Stats
  const weightComparison = useMemo(() => {
    if (!settings.startDate) return null;
    
    const today = new Date();
    const start = parseISO(settings.startDate);
    const daysDiff = differenceInDays(today, start);
    
    // If future or just started
    if (daysDiff < 0) return null;

    // Calculate linear target
    // Monthly loss target / 30 days = daily loss
    const dailyLoss = settings.monthlyLossTarget / 30;
    const expectedLoss = dailyLoss * daysDiff;
    const targetNow = Math.max(settings.goalWeight, settings.startWeight - expectedLoss);

    // Latest actual
    const lastEntry = logs.length > 0 ? logs[logs.length - 1] : null;
    const currentWeight = lastEntry ? lastEntry.weight : settings.startWeight;
    
    const diff = currentWeight - targetNow; 
    // negative diff is good (under target weight)
    
    return {
        target: targetNow.toFixed(1),
        current: currentWeight,
        diff: diff,
        onTrack: diff <= 0
    };
  }, [logs, settings]);

  // Calculate Chart Data
  const chartData = useMemo(() => {
    const dataPoints: any[] = [];
    const startDate = parseISO(settings.startDate);
    const monthsDuration = 7; // Jan to July is 6 months, +1 buffer
    
    // Create target points every 2 weeks (approx 15 days)
    for (let i = 0; i <= monthsDuration * 2; i++) {
        const daysToAdd = i * 15; // Every ~2 weeks
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

    // Merge actual logs
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

    // Sort by date
    return dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, settings]);

  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weight : settings.startWeight;

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Weight Tracker</h2>
        
        {/* Comparison Box */}
        {weightComparison && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 bg-gradient-to-br from-indigo-50 to-white">
                <h3 className="text-indigo-800 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Target size={16} /> Current Status
                </h3>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Target Today</div>
                        <div className="text-2xl font-bold text-gray-400">{weightComparison.target} <span className="text-sm">kg</span></div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Current</div>
                        <div className={`text-2xl font-bold ${weightComparison.onTrack ? 'text-green-600' : 'text-orange-500'}`}>
                            {weightComparison.current} <span className="text-sm">kg</span>
                        </div>
                    </div>
                </div>
                <div className={`mt-1 text-sm font-medium p-3 rounded-lg text-center shadow-sm ${weightComparison.onTrack ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {weightComparison.onTrack 
                        ? `🎉 Awesome! You are ${Math.abs(weightComparison.diff).toFixed(1)} kg ahead of your target.` 
                        : `⚠️ You are ${Math.abs(weightComparison.diff).toFixed(1)} kg behind target. Keep pushing!`}
                </div>
            </div>
        )}

        {/* Input Section */}
        <div className="flex gap-2 items-end mb-6 bg-gray-50 p-4 rounded-lg">
           <div className="flex-1">
             <label className="block text-xs text-gray-500 mb-1">Date</label>
             <input 
                type="date" 
                value={logDate} 
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
           </div>
           <div className="flex-1">
             <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
             <input 
                type="number" 
                step="0.1"
                value={newWeight} 
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="e.g. 61.5"
                className="w-full p-2 border rounded text-sm"
              />
           </div>
           <button 
             onClick={handleAddWeight}
             className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 h-10 w-10 flex items-center justify-center"
           >
             <Plus size={20} />
           </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 uppercase font-bold tracking-wider">Start</div>
                <div className="text-lg font-bold text-blue-900">{settings.startWeight} kg</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-purple-600 uppercase font-bold tracking-wider">Current</div>
                <div className="text-lg font-bold text-purple-900">{latestWeight} kg</div>
            </div>
             <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600 uppercase font-bold tracking-wider">Goal</div>
                <div className="text-lg font-bold text-green-900">{settings.goalWeight} kg</div>
            </div>
        </div>

        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                fontSize={10}
                tick={{fill: '#6b7280'}}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']} 
                fontSize={10}
                tick={{fill: '#6b7280'}}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                labelFormatter={(str) => format(parseISO(str as string), 'MMM d, yyyy')}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#9ca3af" 
                strokeDasharray="5 5" 
                name="Target Plan" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#4f46e5" 
                name="Actual Weight" 
                strokeWidth={3}
                connectNulls
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WeightChart;