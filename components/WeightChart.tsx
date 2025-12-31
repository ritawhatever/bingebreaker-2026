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
import { Plus, Target, History, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { format, differenceInDays, parseISO, subDays } from 'date-fns';

interface WeightChartProps {
  onViewHistory: () => void;
  onCelebrate?: () => void;
}

const WeightChart: React.FC<WeightChartProps> = ({ onViewHistory, onCelebrate }) => {
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

    // Check for progress to celebrate
    const latestWeight = logs.length > 0 ? logs[logs.length - 1].weight : settings.startWeight;
    if (weightVal < latestWeight) {
        onCelebrate?.();
    }

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

  // Calculate Weekly Averages
  const weeklyStats = useMemo(() => {
    const today = new Date();
    // Current Window: Last 7 days (including today)
    const currentWindowStart = subDays(today, 6);
    const currentWindowStartStr = format(currentWindowStart, 'yyyy-MM-dd');
    
    // Previous Window: 7 days before that
    const prevWindowEnd = subDays(currentWindowStart, 1);
    const prevWindowStart = subDays(prevWindowEnd, 6);
    
    const prevWindowStartStr = format(prevWindowStart, 'yyyy-MM-dd');
    const prevWindowEndStr = format(prevWindowEnd, 'yyyy-MM-dd');

    // Filter logs
    const currentLogs = logs.filter(l => l.date >= currentWindowStartStr);
    const prevLogs = logs.filter(l => l.date >= prevWindowStartStr && l.date <= prevWindowEndStr);

    const calculateAvg = (entries: WeightEntry[]) => {
        if (entries.length === 0) return 0;
        const sum = entries.reduce((acc, curr) => acc + curr.weight, 0);
        return sum / entries.length;
    };

    const currentAvg = calculateAvg(currentLogs);
    const prevAvg = calculateAvg(prevLogs);
    const diff = currentAvg - prevAvg;

    return {
        currentAvg: currentAvg > 0 ? currentAvg.toFixed(2) : null,
        prevAvg: prevAvg > 0 ? prevAvg.toFixed(2) : null,
        diff: (currentAvg > 0 && prevAvg > 0) ? diff.toFixed(2) : null,
        hasData: currentAvg > 0 && prevAvg > 0
    };
  }, [logs]);

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
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Weight Tracker</h2>
            <button 
                onClick={onViewHistory}
                className="text-sky-600 hover:bg-sky-50 p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-bold"
            >
                <History size={18} /> History
            </button>
        </div>
        
        {/* Weekly Avg Comparison */}
        {weeklyStats.hasData && (
             <div className="bg-gradient-to-r from-sky-50 to-cyan-50 p-4 rounded-xl border border-sky-100 mb-6">
                <h3 className="text-sky-800 font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                     <Target size={14} /> Weekly Trend (7-Day Avg)
                </h3>
                <div className="flex items-center justify-around">
                    <div className="text-center">
                         <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Previous 7 Days</div>
                         <div className="font-bold text-slate-500 text-lg">{weeklyStats.prevAvg} <span className="text-xs">kg</span></div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <ArrowRight size={16} className="text-sky-300 mb-1" />
                        {Number(weeklyStats.diff) < 0 ? (
                            <div className="flex items-center text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md text-xs font-bold">
                                <TrendingDown size={12} className="mr-1" />
                                {Math.abs(Number(weeklyStats.diff))} kg
                            </div>
                        ) : (
                            <div className="flex items-center text-rose-500 bg-rose-100 px-2 py-1 rounded-md text-xs font-bold">
                                <TrendingUp size={12} className="mr-1" />
                                +{Math.abs(Number(weeklyStats.diff))} kg
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center">
                         <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Last 7 Days</div>
                         <div className="font-bold text-sky-700 text-2xl">{weeklyStats.currentAvg} <span className="text-sm">kg</span></div>
                    </div>
                </div>
            </div>
        )}

        {/* Comparison Box (Target vs Actual) */}
        {weightComparison && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
                <h3 className="text-slate-400 font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wide">
                    Vs Goal Plan
                </h3>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-slate-400">Target Today</div>
                        <div className="text-xl font-bold text-slate-400">{weightComparison.target} <span className="text-sm">kg</span></div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Current</div>
                        <div className={`text-xl font-bold ${weightComparison.onTrack ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {weightComparison.current} <span className="text-sm">kg</span>
                        </div>
                    </div>
                </div>
                <div className={`mt-1 text-xs font-medium p-2 rounded-lg text-center ${weightComparison.onTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {weightComparison.onTrack 
                        ? `You are ${Math.abs(weightComparison.diff).toFixed(1)} kg ahead of schedule!` 
                        : `You are ${Math.abs(weightComparison.diff).toFixed(1)} kg behind schedule.`}
                </div>
            </div>
        )}

        {/* Input Section */}
        <div className="bg-sky-50/50 p-4 rounded-2xl mb-8 border border-sky-100">
            <h3 className="text-sm font-bold text-sky-900 mb-3 flex items-center gap-2">
                <Plus size={16} className="text-sky-500" /> Log New Weight
            </h3>
            <div className="flex gap-3 items-end">
                <div className="w-1/3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                    <input 
                        type="date" 
                        value={logDate} 
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full h-14 px-3 bg-white border-2 border-transparent hover:border-sky-100 rounded-xl text-slate-600 font-semibold text-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all outline-none shadow-sm"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1.5 ml-1">Weight</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            step="0.1"
                            value={newWeight} 
                            onChange={(e) => setNewWeight(e.target.value)}
                            placeholder="0.0"
                            className="w-full h-14 pl-4 pr-10 text-3xl font-black text-sky-900 bg-white border-2 border-transparent hover:border-sky-100 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all outline-none shadow-sm placeholder-sky-100"
                        />
                        <span className="absolute right-4 bottom-3 text-sm font-bold text-slate-400 pointer-events-none mb-1">kg</span>
                    </div>
                </div>
                <button 
                    onClick={handleAddWeight}
                    disabled={!newWeight}
                    className="h-14 w-14 bg-sky-600 text-white rounded-xl hover:bg-sky-700 shadow-lg shadow-sky-200 active:scale-95 transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:shadow-none"
                >
                    <Plus size={32} strokeWidth={3} />
                </button>
            </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Start</div>
                <div className="text-lg font-bold text-slate-600">{settings.startWeight} kg</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-xs text-cyan-600 uppercase font-bold tracking-wider">Current</div>
                <div className="text-lg font-bold text-cyan-900">{latestWeight} kg</div>
            </div>
             <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Goal</div>
                <div className="text-lg font-bold text-slate-600">{settings.goalWeight} kg</div>
            </div>
        </div>

        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                fontSize={10}
                tick={{fill: '#94a3b8'}}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']} 
                fontSize={10}
                tick={{fill: '#94a3b8'}}
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
                stroke="#cbd5e1" 
                strokeDasharray="5 5" 
                name="Target Plan" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#0284c7" // sky-600 
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