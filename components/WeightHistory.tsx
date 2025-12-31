import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Save, Edit2, Calendar } from 'lucide-react';
import { getWeightLogs, saveWeightLog, deleteWeightLog } from '../services/storage';
import { WeightEntry } from '../types';
import { format, parseISO } from 'date-fns';

interface WeightHistoryProps {
  onBack: () => void;
}

const WeightHistory: React.FC<WeightHistoryProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<WeightEntry[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    // Sort newest first
    const data = getWeightLogs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLogs(data);
  };

  const handleEdit = (entry: WeightEntry) => {
    setEditingDate(entry.date);
    setEditValue(entry.weight.toString());
  };

  const handleSave = () => {
    if (!editingDate) return;
    const val = parseFloat(editValue);
    if (isNaN(val) || val <= 0) return;

    saveWeightLog({ date: editingDate, weight: val });
    setEditingDate(null);
    setEditValue('');
    loadLogs();
  };

  const handleDelete = (date: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteWeightLog(date);
      loadLogs();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
        <div className="p-4 border-b border-sky-700 flex items-center gap-3 bg-sky-600 text-white shadow-sm">
          <button onClick={onBack} className="hover:bg-sky-700 p-1 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold flex items-center gap-2">
             <Calendar size={20} /> Weight History
          </h2>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
         {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Calendar size={48} className="mb-2 opacity-20" />
                <p>No weight records yet.</p>
            </div>
         )}

         {logs.map((log) => (
            <div 
                key={log.date} 
                className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:border-sky-200"
            >
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">
                        {format(parseISO(log.date), 'EEEE, MMM d, yyyy')}
                    </span>
                    
                    {editingDate === log.date ? (
                        <div className="flex items-center gap-2 mt-1">
                            <input 
                                type="number" 
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20 p-1 border border-sky-300 rounded text-lg font-bold text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                autoFocus
                            />
                            <span className="text-sm text-slate-500">kg</span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-slate-800 mt-1">
                            {log.weight} <span className="text-sm font-normal text-slate-500">kg</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {editingDate === log.date ? (
                        <button 
                            onClick={handleSave}
                            className="bg-emerald-100 text-emerald-700 p-2 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                            <Save size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleEdit(log)}
                            className="text-slate-400 hover:text-sky-600 p-2 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    
                    <button 
                        onClick={() => handleDelete(log.date)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
         ))}
       </div>
    </div>
  );
};

export default WeightHistory;