import React from 'react';
import { getDailyLogs } from '../services/storage';
import { MOODS } from '../constants';
import { CheckCircle, XCircle, Calendar, ArrowLeft, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HistoryLogProps {
  onEdit: (date: string) => void;
  onBack: () => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ onEdit, onBack }) => {
  const logs = getDailyLogs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[calc(100vh-140px)]">
       <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-teal-600 text-white shadow-sm z-10">
          <button onClick={onBack} className="hover:bg-teal-700 p-1 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold flex items-center gap-2">
             <Calendar size={20} /> Check-in History
          </h2>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
         {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
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
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex gap-4 items-start group"
                >
                   <div className="mt-1">
                     {log.snacked ? (
                        <XCircle className="text-orange-500 drop-shadow-sm" size={28} />
                     ) : (
                        <CheckCircle className="text-green-500 drop-shadow-sm" size={28} />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start">
                        <div>
                            <span className="block font-bold text-gray-800 text-sm">
                                {format(parseISO(log.date), 'EEEE, MMM d, yyyy')}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${log.snacked ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                {log.snacked ? 'Snacked' : 'Clean'}
                            </span>
                        </div>
                        {moodObj && (
                            <span className="text-2xl bg-gray-50 p-1 rounded-full" title={moodObj.label}>
                                {moodObj.emoji}
                            </span>
                        )}
                     </div>
                     
                     {log.snacked && log.snackDetails && (
                        <div className="mt-2 text-xs font-medium text-orange-800 bg-orange-50 border border-orange-100 p-2 rounded">
                            <span className="opacity-70 uppercase tracking-wide text-[10px]">Ate:</span> {log.snackDetails}
                        </div>
                     )}

                     {log.notes ? (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 bg-gray-50 p-2 rounded-lg italic">
                            "{log.notes}"
                        </p>
                     ) : (
                        !log.snackDetails && <p className="text-xs text-gray-300 mt-2 italic">No notes added</p>
                     )}
                   </div>
                   <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                        <Edit2 size={16} />
                   </div>
                </div>
            );
         })}
       </div>
    </div>
  );
};

export default HistoryLog;