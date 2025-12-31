import React, { useState, useEffect } from 'react';
import { DailyEntry } from '../types';
import { MOODS } from '../constants';
import { Save, CheckCircle, XCircle, History, Trash2, RotateCcw, X } from 'lucide-react';
import { saveDailyLog, getDailyLogs, deleteDailyLog } from '../services/storage';

interface DailyLogProps {
  targetDate?: string;
  onViewHistory: () => void;
  onCelebrate?: () => void;
}

const DailyLog: React.FC<DailyLogProps> = ({ targetDate, onViewHistory, onCelebrate }) => {
  // Helper to get local date string YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(targetDate || getTodayStr());
  const [snacked, setSnacked] = useState<boolean | null>(null);
  const [snackDetails, setSnackDetails] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (targetDate) {
        setDate(targetDate);
    }
  }, [targetDate]);

  useEffect(() => {
    // Load existing data for selected date
    const logs = getDailyLogs();
    const entry = logs.find(l => l.date === date);
    if (entry) {
      setSnacked(entry.snacked);
      setSnackDetails(entry.snackDetails || '');
      setMood(entry.mood);
      setNotes(entry.notes);
    } else {
      setSnacked(null);
      setSnackDetails('');
      setMood('');
      setNotes('');
    }
    setSaved(false);
  }, [date]);

  const handleSave = () => {
    if (snacked === null) {
        // If snacked is cleared, we treat this as deleting the entry to ensure "no entry" for the day
        if (window.confirm('Saving with no selection will remove this day\'s record. Continue?')) {
            deleteDailyLog(date);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
        return;
    }
    
    const entry: DailyEntry = {
      date,
      snacked,
      snackDetails: snacked ? snackDetails : undefined,
      mood,
      notes
    };
    saveDailyLog(entry);
    
    if (snacked === false) {
        onCelebrate?.();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete the record for this date?')) {
        deleteDailyLog(date);
        setSnacked(null);
        setSnackDetails('');
        setMood('');
        setNotes('');
        setSaved(false);
    }
  };

  const handleClearSelection = () => {
    setSnacked(null);
    setSnackDetails('');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden p-6 relative">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Daily Check-in</h2>
          <button 
            onClick={onViewHistory}
            className="text-cyan-600 hover:bg-cyan-50 p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <History size={18} /> History
          </button>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-2">Date</label>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-700 bg-slate-50"
        />
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <label className="block text-lg font-medium text-slate-800 text-center">
            Did you snack around dinner?
            </label>
            {snacked !== null && (
                <button 
                    onClick={handleClearSelection}
                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600 bg-slate-50 px-2 py-1 rounded-full transition-colors"
                >
                    <RotateCcw size={12} /> Reset
                </button>
            )}
        </div>
        
        <div className="flex gap-4 justify-center mb-4">
          <button
            onClick={() => setSnacked(false)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              snacked === false 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                : 'border-slate-100 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle size={32} />
            <span className="font-semibold">No, stayed clean!</span>
          </button>
          
          <button
            onClick={() => setSnacked(true)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              snacked === true 
                ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-sm' 
                : 'border-slate-100 text-slate-400 hover:border-rose-200 hover:bg-rose-50'
            }`}
          >
            <XCircle size={32} />
            <span className="font-semibold">Yes, slipped up</span>
          </button>
        </div>

        {snacked === true && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 relative">
                <label className="block text-sm font-bold text-rose-600 mb-2">What did you eat?</label>
                <div className="relative">
                    <input
                        type="text"
                        value={snackDetails}
                        onChange={(e) => setSnackDetails(e.target.value)}
                        placeholder="e.g. A bag of chips, ice cream..."
                        className="w-full p-3 pr-10 border border-rose-200 bg-rose-50/50 rounded-lg focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-800 placeholder-rose-300"
                    />
                    {snackDetails && (
                        <button 
                            onClick={() => setSnackDetails('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300 hover:text-rose-500"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-3">How did you feel today?</label>
        <div className="flex flex-wrap gap-2 justify-center">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(m.label)}
              className={`text-2xl p-2 rounded-full transition-transform hover:scale-110 ${
                mood === m.label ? 'bg-cyan-100 ring-2 ring-cyan-500' : 'bg-transparent'
              }`}
              title={m.label}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-2">Notes (Triggers, thoughts?)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="I felt stressed because..."
          className="w-full p-3 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none bg-slate-50 placeholder-slate-400"
        />
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 text-white font-bold text-lg transition-all shadow-lg active:scale-[0.98] ${
           saved 
              ? 'bg-emerald-500' 
              : snacked === null 
                ? 'bg-slate-400 hover:bg-slate-500' 
                : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200'
        }`}
      >
        {saved ? (
          <>
            <CheckCircle size={24} /> {snacked === null ? 'Cleared!' : 'Saved!'}
          </>
        ) : (
          <>
            {snacked === null ? <Trash2 size={24} /> : <Save size={24} />} 
            {snacked === null ? 'Clear Day Record' : 'Save Record'}
          </>
        )}
      </button>

      {snacked !== null && (
        <button
            onClick={handleDelete}
            className="w-full mt-4 py-2 rounded-lg flex items-center justify-center gap-2 text-rose-400 hover:bg-rose-50 transition-colors text-sm font-semibold"
        >
            <Trash2 size={16} /> Delete Entry
        </button>
      )}
    </div>
  );
};

export default DailyLog;