import React, { useRef, useState } from 'react';
import { Settings as SettingsIcon, Download, Upload, Database, ShieldCheck, AlertTriangle, Github, Sun, Moon, Monitor, ExternalLink, RefreshCw } from 'lucide-react';
import { useLibrary, Theme } from '../context/LibraryContext';
import { motion } from 'framer-motion';

export default function Settings() {
  const { exportData, importData, theme, setTheme, githubUser, loginGitHub, logoutGitHub, syncToGitHub } = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await syncToGitHub();
    if (result.success) {
      setStatus({ type: 'success', message: 'Library synced to GitHub Gist successfully!' });
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to sync to GitHub.' });
    }
    setIsSyncing(false);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sapphic-shelves-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Library exported successfully.' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        importData(jsonString, importMode === 'merge');
        setStatus({ type: 'success', message: `Library imported successfully (${importMode} mode).` });
      } catch (error) {
        setStatus({ type: 'error', message: 'Failed to import library. Invalid file format.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/10 text-slate-500 mb-4">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Settings & Data</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Personalize your experience and manage your local-first data.
        </p>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} flex items-center gap-3 font-medium`}
        >
          {status.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {status.message}
        </motion.div>
      )}

      <div className="grid gap-6">
        {/* Theme Selection */}
        <div className="bento-card">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Appearance</h3>
              <p className="text-slate-400 text-sm mt-1">Choose how Sapphic Shelves looks on your device.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-amber-500/10 border-amber-500/50 text-amber-600' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'}`}
            >
              <Sun className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Light</span>
            </button>
            <button 
              onClick={() => setTheme('lettuce')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${theme === 'lettuce' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'}`}
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Lettuce</span>
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'}`}
            >
              <Moon className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Dark</span>
            </button>
            <button 
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${theme === 'system' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'}`}
            >
              <Monitor className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">System</span>
            </button>
          </div>
        </div>

        {/* GitHub Connection */}
        <div className="bento-card">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${githubUser ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800/50 text-slate-400'}`}>
              <Github className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-100">GitHub Connection</h3>
              <p className="text-slate-400 text-sm mt-1">
                {githubUser 
                  ? `Connected as ${githubUser.login}` 
                  : 'Connect your GitHub account to sync your library across devices.'}
              </p>
            </div>
            {githubUser && (
              <button 
                onClick={logoutGitHub}
                className="text-xs font-bold uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
          
          {githubUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <img src={githubUser.avatar_url} alt="" className="w-12 h-12 rounded-full border-2 border-emerald-500/30" />
                <div>
                  <p className="font-bold text-slate-100">{githubUser.name || githubUser.login}</p>
                  <p className="text-xs text-slate-500">@{githubUser.login}</p>
                </div>
              </div>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-3 group active:scale-95"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Library to GitHub'}</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={loginGitHub}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-medium transition-all flex items-center justify-between group active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5" />
                <span>Connect GitHub Account</span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Data Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bento-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Export</h3>
                <p className="text-slate-400 text-xs mt-1">Download your library as JSON.</p>
              </div>
            </div>
            <button 
              onClick={handleExport}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Database className="w-4 h-4" />
              Export Library
            </button>
          </div>

          <div className="bento-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-fuchsia-500/10 rounded-2xl text-fuchsia-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Import</h3>
                <p className="text-slate-400 text-xs mt-1">Restore from backup.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-white/5">
                <button 
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${importMode === 'merge' ? 'bg-slate-800 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Merge
                </button>
                <button 
                  onClick={() => setImportMode('overwrite')}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${importMode === 'overwrite' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Overwrite
                </button>
              </div>

              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImport}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Import File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
