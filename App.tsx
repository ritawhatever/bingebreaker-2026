import React, { useState, useEffect } from 'react';
import { AppView, DailyEntry, UserSettings } from './types';
import DailyLog from './components/DailyLog';
import WeightChart from './components/WeightChart';
import WeightHistory from './components/WeightHistory';
import AICoach from './components/AICoach';
import HistoryLog from './components/HistoryLog';
import DashboardWeightChart from './components/DashboardWeightChart';
import SettingsView from './components/SettingsView';
import Celebration from './components/Celebration';
import { getDailyLogs, getSettings, updateUserSetting, saveDailyLog, saveWeightLog, getWeightLogs } from './services/storage';
import { getMotivation } from './services/gemini';
import { Home, PenTool, TrendingDown, MessageCircle, Calendar, Trophy, Edit2, Check, CheckCircle, XCircle, Scale, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [logs, setLogs] = useState<DailyEntry[]>([]);
  const [motivation, setMotivation] = useState<string>("Loading motivation...");
  const [streak, setStreak] = useState(0);
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [streakGoalInput, setStreakGoalInput] = useState(settings.streakGoal.toString());
  const [trackerDate, setTrackerDate] = useState<string | undefined>(undefined);
  const [quickWeight, setQuickWeight] = useState('');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("Great Job!");

  // Helper to get local date string YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const data = getDailyLogs();
    setLogs(data);

    // Load settings
    const currentSettings = getSettings();
    setSettings(currentSettings);
    setStreakGoalInput(currentSettings.streakGoal.toString());

    // Calculate streak
    let currentStreak = 0;
    const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Streak logic: consecutive non-snacked days from most recent
    for (const log of sorted) {
      if (!log.snacked) currentStreak++;
      else break;
    }
    setStreak(currentStreak);

    // Fetch motivation if empty or just once on mount/view change logic
    if (motivation === "Loading motivation...") {
        getMotivation().then(setMotivation);
    }
  }, [currentView, lastUpdated]); 

  const triggerCelebration = (msg: string = "Great Job!") => {
    setCelebrationMessage(msg);
    setIsCelebrating(true);
  };

  const handleSaveGoal = () => {
    const newGoal = parseInt(streakGoalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      updateUserSetting('streakGoal', newGoal);
      setSettings(prev => ({ ...prev, streakGoal: newGoal }));
      setIsEditingGoal(false);
    }
  };

  const handleQuickLog = (snacked: boolean) => {
    const todayStr = getTodayStr();
    const existingLog = logs.find(l => l.date === todayStr);
    
    const entry: DailyEntry = {
        date: todayStr,
        snacked: snacked,
        mood: existingLog?.mood || '',
        notes: existingLog?.notes || '',
        snackDetails: existingLog?.snackDetails // Preserve details if re-logging
    };
    saveDailyLog(entry);
    setLastUpdated(Date.now());

    // If they snacked, redirect to tracker to ask what they ate
    if (snacked) {
        setTrackerDate(todayStr);
        setCurrentView(AppView.TRACKER);
    } else {
        triggerCelebration("Clean Streak!");
    }
  };

  const handleQuickWeightSave = () => {
    const val = parseFloat(quickWeight);
    if (isNaN(val) || val <= 0) return;
    
    // Check if progress
    const currentWeights = getWeightLogs();
    if (currentWeights.length > 0) {
        const lastWeight = currentWeights[currentWeights.length - 1].weight;
        if (val < lastWeight) {
            triggerCelebration("Weight Down!");
        }
    } else {
        triggerCelebration("First Step!");
    }

    saveWeightLog({
        date: getTodayStr(),
        weight: val
    });
    setQuickWeight('');
    setLastUpdated(Date.now());
  };

  const handleEditHistory = (date: string) => {
    setTrackerDate(date);
    setCurrentView(AppView.TRACKER);
  };

  const handleViewTracker = () => {
    setTrackerDate(getTodayStr());
    setCurrentView(AppView.TRACKER);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.TRACKER:
        return (
            <DailyLog 
                targetDate={trackerDate} 
                onViewHistory={() => setCurrentView(AppView.HISTORY)} 
                onCelebrate={() => triggerCelebration("Clean Day!")}
            />
        );
      case AppView.WEIGHT:
        return (
            <WeightChart 
                onViewHistory={() => setCurrentView(AppView.WEIGHT_HISTORY)}
                onCelebrate={() => triggerCelebration("Progress Made!")}
            />
        );
      case AppView.WEIGHT_HISTORY:
        return (
            <WeightHistory 
                onBack={() => setCurrentView(AppView.WEIGHT)}
            />
        );
      case AppView.COACH:
        return <AICoach />;
      case AppView.HISTORY:
        return (
            <HistoryLog 
                onEdit={handleEditHistory} 
                onBack={() => setCurrentView(AppView.DASHBOARD)} 
            />
        );
      case AppView.SETTINGS:
        return (
            <SettingsView onBack={() => setCurrentView(AppView.DASHBOARD)} />
        );
      case AppView.DASHBOARD:
      default:
        const progressPercent = Math.min(100, (streak / settings.streakGoal) * 100);
        const isGoalMet = streak >= settings.streakGoal;
        const todayStr = getTodayStr();
        const todayLog = logs.find(l => l.date === todayStr);

        return (
          <div className="space-y-6">
            {/* Header / Hero */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               {/* Decorative background circle */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>

              <h1 className="text-2xl font-bold mb-2 relative z-10">Jan 1, 2026 Starts Now</h1>
              <p className="opacity-90 text-sm mb-6 relative z-10 italic">
                "{motivation}"
              </p>
              
              {/* Streak Goal Section */}
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <Trophy size={20} className={isGoalMet ? "text-yellow-300" : "text-white/80"} />
                        <span className="font-semibold text-sm uppercase tracking-wide opacity-90">Clean Streak Goal</span>
                    </div>
                    
                    {isEditingGoal ? (
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={streakGoalInput}
                                onChange={(e) => setStreakGoalInput(e.target.value)}
                                className="w-12 text-teal-800 rounded px-1 py-0.5 text-center font-bold text-sm"
                                autoFocus
                            />
                            <button onClick={handleSaveGoal} className="bg-white text-teal-700 p-1 rounded hover:bg-teal-50">
                                <Check size={14} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsEditingGoal(true)} 
                            className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity bg-white/10 px-2 py-1 rounded"
                        >
                            <span>Goal: {settings.streakGoal} days</span>
                            <Edit2 size={10} />
                        </button>
                    )}
                </div>

                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold leading-none">{streak}</span>
                    <span className="text-sm opacity-80 mb-1">/ {settings.streakGoal} days</span>
                    {isGoalMet && (
                        <span className="ml-auto text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">
                            Goal Met!
                        </span>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoalMet ? 'bg-gradient-to-r from-yellow-300 to-yellow-500' : 'bg-white'}`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
              </div>
            </div>

            {/* Calendar Preview */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2"><Calendar size={18} /> Recent Activity</div>
                <button onClick={() => setCurrentView(AppView.HISTORY)} className="text-teal-600 text-xs font-bold hover:underline">See All</button>
              </h3>
              <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  // Create local date string
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  
                  const log = logs.find(l => l.date === dateStr);
                  
                  let statusColor = 'bg-gray-100 border-gray-200';
                  if (log) {
                    statusColor = log.snacked ? 'bg-orange-100 border-orange-300' : 'bg-green-100 border-green-300';
                  }

                  return (
                    <div 
                        key={i} 
                        onClick={() => handleEditHistory(dateStr)}
                        className={`flex flex-col items-center min-w-[40px] p-2 rounded-lg border cursor-pointer active:scale-95 transition-transform ${statusColor}`}
                    >
                      <span className="text-xs text-gray-500 mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className={`text-sm font-bold ${log ? (log.snacked ? 'text-orange-600' : 'text-green-600') : 'text-gray-400'}`}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Snack */}
            <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <CheckCircle size={18} className="text-teal-600"/> Today's Check-in
                    </h3>
                    <button 
                        onClick={handleViewTracker} 
                        className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full hover:bg-teal-100"
                    >
                        Add Details
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleQuickLog(false)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            todayLog?.snacked === false
                            ? 'bg-green-500 border-green-500 text-white shadow-lg scale-[1.02]'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-green-200 hover:bg-green-50 hover:text-green-600'
                        }`}
                    >
                        <CheckCircle size={28} className={todayLog?.snacked === false ? "text-white" : "currentColor"} />
                        <span className="font-bold text-sm">No Snacks</span>
                    </button>

                    <button 
                        onClick={() => handleQuickLog(true)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            todayLog?.snacked === true
                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-[1.02]'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                    >
                        <XCircle size={28} className={todayLog?.snacked === true ? "text-white" : "currentColor"} />
                        <span className="font-bold text-sm">I Snacked</span>
                    </button>
                </div>
            </div>

            {/* Quick Weight Log */}
            <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Scale size={18} className="text-indigo-600"/> Quick Weight Log
                    </h3>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        inputMode="decimal"
                        value={quickWeight}
                        onChange={(e) => {
                            const val = e.target.value;
                            // Allow numbers and one decimal point
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setQuickWeight(val);
                            }
                        }}
                        placeholder="kg"
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg font-bold text-gray-900 bg-white placeholder-gray-400"
                    />
                    <button 
                        onClick={handleQuickWeightSave}
                        className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>

            <DashboardWeightChart key={lastUpdated} />

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setCurrentView(AppView.WEIGHT)}
                className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 transition-colors group"
              >
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">
                    <TrendingDown size={24} />
                </div>
                <span className="font-semibold text-gray-700">Log Weight</span>
              </button>

              <button 
                 onClick={() => setCurrentView(AppView.COACH)}
                 className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-purple-50 transition-colors group"
              >
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 group-hover:scale-110 transition-transform">
                    <MessageCircle size={24} />
                </div>
                <span className="font-semibold text-gray-700">Coach</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Top Bar */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-200 flex justify-between items-center">
        <div className="font-bold text-xl text-teal-700 tracking-tight">BingeBreaker</div>
        <div className="flex items-center gap-2">
            <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-500">
            Target: July '26
            </div>
            <button 
                onClick={() => setCurrentView(AppView.SETTINGS)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {renderContent()}
      </div>

      {/* Celebration Overlay */}
      {isCelebrating && (
        <Celebration 
            message={celebrationMessage}
            onComplete={() => setIsCelebrating(false)} 
        />
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
        <div className="flex justify-around items-center p-2">
          <button 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className={`flex flex-col items-center p-2 rounded-lg w-16 ${currentView === AppView.DASHBOARD ? 'text-teal-600' : 'text-gray-400'}`}
          >
            <Home size={24} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>
          
          <button 
             onClick={handleViewTracker}
             className={`flex flex-col items-center p-2 rounded-lg w-16 ${currentView === AppView.TRACKER ? 'text-teal-600' : 'text-gray-400'}`}
          >
            <PenTool size={24} />
            <span className="text-[10px] mt-1 font-medium">Track</span>
          </button>

          <button 
             onClick={() => setCurrentView(AppView.WEIGHT)}
             className={`flex flex-col items-center p-2 rounded-lg w-16 ${currentView === AppView.WEIGHT ? 'text-teal-600' : 'text-gray-400'}`}
          >
            <TrendingDown size={24} />
            <span className="text-[10px] mt-1 font-medium">Weight</span>
          </button>

          <button 
             onClick={() => setCurrentView(AppView.COACH)}
             className={`flex flex-col items-center p-2 rounded-lg w-16 ${currentView === AppView.COACH ? 'text-teal-600' : 'text-gray-400'}`}
          >
            <MessageCircle size={24} />
            <span className="text-[10px] mt-1 font-medium">Coach</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;