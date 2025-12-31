import React, { useState, useEffect } from 'react';
import { DailyEntry } from '../types';
import { MOODS } from '../constants';
import { Save, CheckCircle, XCircle, History } from 'lucide-react';
import { saveDailyLog, getDailyLogs } from '../services/storage';

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
    if (snacked === null) return;
    
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

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 relative">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Daily Check-in</h2>
          <button 
            onClick={onViewHistory}
            className="text-teal-600 hover:bg-teal-50 p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <History size={18} /> History
          </button>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
      </div>

      <div className="mb-8">
        <label className="block text-lg font-medium text-gray-800 mb-4 text-center">
          Did you snack around dinner?
        </label>
        <div className="flex gap-4 justify-center mb-4">
          <button
            onClick={() => setSnacked(false)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              snacked === false 
                ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                : 'border-gray-200 text-gray-500 hover:border-green-200'
            }`}
          >
            <CheckCircle size={32} />
            <span className="font-semibold">No, I stayed clean!</span>
          </button>
          
          <button
            onClick={() => setSnacked(true)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              snacked === true 
                ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                : 'border-gray-200 text-gray-500 hover:border-orange-200'
            }`}
          >
            <XCircle size={32} />
            <span className="font-semibold">Yes, I slipped up</span>
          </button>
        </div>

        {snacked === true && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-orange-700 mb-2">What did you eat?</label>
                <input
                    type="text"
                    value={snackDetails}
                    onChange={(e) => setSnackDetails(e.target.value)}
                    placeholder="e.g. A bag of chips, ice cream..."
                    className="w-full p-3 border border-orange-200 bg-orange-50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-gray-800 placeholder-orange-300"
                />
            </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">How did you feel today?</label>
        <div className="flex flex-wrap gap-2 justify-center">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(m.label)}
              className={`text-2xl p-2 rounded-full transition-transform hover:scale-110 ${
                mood === m.label ? 'bg-teal-100 ring-2 ring-teal-500' : 'bg-transparent'
              }`}
              title={m.label}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Triggers, thoughts?)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="I felt stressed because..."
          className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={snacked === null}
        className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 text-white font-bold text-lg transition-colors ${
          snacked === null 
            ? 'bg-gray-300 cursor-not-allowed' 
            : saved 
              ? 'bg-green-600' 
              : 'bg-teal-600 hover:bg-teal-700'
        }`}
      >
        {saved ? (
          <>
            <CheckCircle size={24} /> Saved!
          </>
        ) : (
          <>
            <Save size={24} /> Save Record
          </>
        )}
      </button>
    </div>
  );
};

export default DailyLog;