import React, { useState, useEffect } from 'react';
import { getDailyLogs, deleteDailyLog } from '../services/storage';
import { MOODS } from '../constants';
import { CheckCircle, XCircle, Calendar, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DailyEntry } from '../types';

interface HistoryLogProps {
  onEdit: (date: string) => void;
  onBack: () => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ onEdit, onBack }) => {
  const [logs, setLogs] = useState<DailyEntry[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const data = getDailyLogs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLogs(data);
  };

  const handleDelete = (e: React.MouseEvent, date: string) => {
    e.stopPropagation(); // Prevent triggering the row click
    if (window.confirm('Are you sure you want to delete this record permanently?')) {
        deleteDailyLog(date);
        loadLogs(); // Refresh list
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[calc(100vh-140px)] border border-slate-100">
       <div className="p-4 border-b border-cyan-700 flex items-center gap-3 bg-cyan-600 text-white shadow-sm z-10">
          <button onClick={onBack} className="hover:bg-cyan-700 p-1 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold flex items-center gap-2">
             <Calendar size={20} /> Check-in History
          </h2>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
         {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Calendar size={48} className="mb-2 opacity-20" />
                <p>No records yet. Start tracking!</p>
            </div>
         )}
         
         {logs.map(log => {
            const moodObj = MOODS.find(m => m.label === log.mood);
            return (
                <div 
                  key={log.date} 
                  onClick={() => onEdit(log.date)}
                  className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex gap-4 items-start group relative pr-12 hover:border-cyan-200"
                >
                   <div className="mt-1">
                     {log.snacked ? (
                        <XCircle className="text-rose-400 drop-shadow-sm" size={28} />
                     ) : (
                        <CheckCircle className="text-emerald-500 drop-shadow-sm" size={28} />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start">
                        <div>
                            <span className="block font-bold text-slate-700 text-sm">
                                {format(parseISO(log.date), 'EEEE, MMM d, yyyy')}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${log.snacked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {log.snacked ? 'Snacked' : 'Clean'}
                            </span>
                        </div>
                        {moodObj && (
                            <span className="text-2xl bg-slate-50 p-1 rounded-full" title={moodObj.label}>
                                {moodObj.emoji}
                            </span>
                        )}
                     </div>
                     
                     {log.snacked && log.snackDetails && (
                        <div className="mt-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-100 p-2 rounded">
                            <span className="opacity-70 uppercase tracking-wide text-[10px]">Ate:</span> {log.snackDetails}
                        </div>
                     )}

                     {log.notes ? (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg italic">
                            "{log.notes}"
                        </p>
                     ) : (
                        !log.snackDetails && <p className="text-xs text-slate-300 mt-2 italic">No notes added</p>
                     )}
                   </div>
                   
                   {/* Actions */}
                   <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-between items-end">
                       <button 
                            onClick={(e) => handleDelete(e, log.date)}
                            className="p-2 text-rose-400 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Delete Entry"
                       >
                           <Trash2 size={18} />
                       </button>
                       <div className="p-2 text-slate-300">
                            <Edit2 size={16} />
                       </div>
                   </div>
                </div>
            );
         })}
       </div>
    </div>
  );
};

export default HistoryLog;