import React, { useRef, useState } from 'react';
import { Download, Upload, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { getAllData, restoreData } from '../services/storage';

interface SettingsViewProps {
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleExport = () => {
    const data = getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bingebreaker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation check
        if (!json.settings && !json.dailyLogs) {
            throw new Error("Invalid file format");
        }
        restoreData(json);
        setImportStatus('success');
        setTimeout(() => {
            window.location.reload(); // Reload to reflect changes
        }, 1500);
      } catch (err) {
        console.error(err);
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-800 text-white shadow-sm">
          <button onClick={onBack} className="hover:bg-gray-700 p-1 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold">Data Management</h2>
       </div>

       <div className="p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">Export Data</h3>
                <p className="text-sm text-blue-700 mb-4">Save a copy of your history, settings, and logs to your device.</p>
                <button 
                    onClick={handleExport}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Download size={20} /> Download Backup
                </button>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h3 className="font-bold text-orange-900 mb-2">Import Data</h3>
                <p className="text-sm text-orange-700 mb-4">Restore your data from a backup file. <span className="font-bold">This will overwrite current data.</span></p>
                
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
                
                <button 
                    onClick={handleImportClick}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                    <Upload size={20} /> Restore Backup
                </button>

                {importStatus === 'success' && (
                    <div className="mt-3 text-center text-green-600 font-bold flex items-center justify-center gap-2">
                        <Check size={16} /> Import Successful! Reloading...
                    </div>
                )}
                {importStatus === 'error' && (
                    <div className="mt-3 text-center text-red-600 font-bold flex items-center justify-center gap-2">
                        <AlertTriangle size={16} /> Invalid File
                    </div>
                )}
            </div>
            
            <div className="mt-8 text-center">
                 <p className="text-xs text-gray-400">Version 1.0.0</p>
            </div>
       </div>
    </div>
  );
};

export default SettingsView;