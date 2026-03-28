import React, { useRef, useState } from 'react';
import { Settings as SettingsIcon, Download, Upload, Database, ShieldCheck, AlertTriangle, Github, Sun, Moon, Monitor, ExternalLink, RefreshCw, Plus, Minus, FileText, Trash2, X } from 'lucide-react';
import { useLibrary, Theme } from '../context/LibraryContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { exportData, importData, theme, setTheme, githubUser, loginGitHub, logoutGitHub, syncToGitHub, goals, updateGoal, clearLibrary } = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // CSV import logic placeholder
    setStatus({ type: 'error', message: 'CSV Import is not yet implemented.' });
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const handleDeleteLibrary = () => {
    if (deleteConfirmText === 'DELETE') {
      clearLibrary();
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      setStatus({ type: 'success', message: 'Library cleared successfully.' });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-earth-100 dark:bg-earth-800/50 text-earth-600 dark:text-earth-300 mb-4">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-serif text-earth-900 dark:text-earth-100">Settings & Data</h2>
        <p className="text-earth-600 dark:text-earth-400 max-w-xl mx-auto">
          Personalize your experience and manage your local-first data.
        </p>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border ${status.type === 'success' ? 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'} flex items-center gap-3 font-medium mb-8`}
        >
          {status.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {status.message}
        </motion.div>
      )}

      {/* Reading Goals */}
      <section className="border-b border-earth-200 dark:border-earth-800 pb-10 mb-10">
        <h3 className="text-2xl font-serif text-earth-900 dark:text-earth-100 mb-6">Reading Goals</h3>
        <div className="bg-white dark:bg-earth-900/50 rounded-3xl p-8 shadow-soft border border-earth-100 dark:border-earth-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-earth-900 dark:text-earth-100">Yearly Target</h4>
            <p className="text-earth-600 dark:text-earth-400 text-sm mt-1">How many books do you want to read in {goals.year}?</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => updateGoal({ ...goals, target: Math.max(1, goals.target - 1) })}
              className="bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-full w-12 h-12 flex items-center justify-center text-xl transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="text-4xl font-serif text-earth-900 dark:text-earth-100 w-16 text-center">
              {goals.target}
            </div>
            <button 
              onClick={() => updateGoal({ ...goals, target: goals.target + 1 })}
              className="bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-full w-12 h-12 flex items-center justify-center text-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="border-b border-earth-200 dark:border-earth-800 pb-10 mb-10">
        <h3 className="text-2xl font-serif text-earth-900 dark:text-earth-100 mb-6">Appearance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button 
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'light' ? 'bg-mustard-50 dark:bg-mustard-900/20 border-mustard-400 text-mustard-700 dark:text-mustard-400' : 'bg-white dark:bg-earth-900/50 border-earth-100 dark:border-earth-800 text-earth-600 dark:text-earth-400 hover:border-earth-300 dark:hover:border-earth-600'}`}
          >
            <Sun className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">Light</span>
          </button>
          <button 
            onClick={() => setTheme('lettuce')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'lettuce' ? 'bg-sage-50 dark:bg-sage-900/20 border-sage-400 text-sage-700 dark:text-sage-400' : 'bg-white dark:bg-earth-900/50 border-earth-100 dark:border-earth-800 text-earth-600 dark:text-earth-400 hover:border-earth-300 dark:hover:border-earth-600'}`}
          >
            <div className="w-8 h-8 rounded-full bg-sage-200 dark:bg-sage-800 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-sage-500" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Lettuce</span>
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'dark' ? 'bg-stone-800 border-stone-600 text-stone-200' : 'bg-white dark:bg-earth-900/50 border-earth-100 dark:border-earth-800 text-earth-600 dark:text-earth-400 hover:border-earth-300 dark:hover:border-earth-600'}`}
          >
            <Moon className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">Dark</span>
          </button>
          <button 
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'system' ? 'bg-earth-100 dark:bg-earth-800 border-earth-400 text-earth-800 dark:text-earth-200' : 'bg-white dark:bg-earth-900/50 border-earth-100 dark:border-earth-800 text-earth-600 dark:text-earth-400 hover:border-earth-300 dark:hover:border-earth-600'}`}
          >
            <Monitor className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">System</span>
          </button>
        </div>
      </section>

      {/* GitHub Connection */}
      <section className="border-b border-earth-200 dark:border-earth-800 pb-10 mb-10">
        <h3 className="text-2xl font-serif text-earth-900 dark:text-earth-100 mb-6">Cloud Sync</h3>
        <div className="bg-white dark:bg-earth-900/50 rounded-3xl p-8 shadow-soft border border-earth-100 dark:border-earth-800">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${githubUser ? 'bg-sage-100 dark:bg-sage-900/40 text-sage-600 dark:text-sage-400' : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400'}`}>
              <Github className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-earth-900 dark:text-earth-100">GitHub Connection</h4>
              <p className="text-earth-600 dark:text-earth-400 text-sm mt-1">
                {githubUser 
                  ? `Connected as ${githubUser.login}` 
                  : 'Connect your GitHub account to sync your library across devices.'}
              </p>
            </div>
            {githubUser && (
              <button 
                onClick={logoutGitHub}
                className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
          
          {githubUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-earth-50 dark:bg-earth-800/50 border border-earth-200 dark:border-earth-700">
                <img src={githubUser.avatar_url} alt="" className="w-12 h-12 rounded-full border-2 border-sage-500/30" />
                <div>
                  <p className="font-bold text-earth-900 dark:text-earth-100">{githubUser.name || githubUser.login}</p>
                  <p className="text-xs text-earth-500 dark:text-earth-400">@{githubUser.login}</p>
                </div>
              </div>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-3 group active:scale-95 shadow-soft"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Library to GitHub'}</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={loginGitHub}
              className="w-full bg-earth-800 hover:bg-earth-900 dark:bg-earth-100 dark:hover:bg-white text-white dark:text-earth-900 px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-3 group active:scale-95 shadow-soft"
            >
              <Github className="w-5 h-5" />
              <span>Connect GitHub Account</span>
              <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity ml-2" />
            </button>
          )}
        </div>
      </section>

      {/* Data Management */}
      <section className="border-b border-earth-200 dark:border-earth-800 pb-10 mb-10">
        <h3 className="text-2xl font-serif text-earth-900 dark:text-earth-100 mb-6">Data Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-earth-900/50 rounded-3xl p-8 shadow-soft border border-earth-100 dark:border-earth-800 flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-mustard-100 dark:bg-mustard-900/40 rounded-2xl text-mustard-700 dark:text-mustard-400">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-earth-900 dark:text-earth-100">Backup Data</h4>
                <p className="text-earth-600 dark:text-earth-400 text-sm mt-1">Download your entire library, tags, and authors as a JSON file.</p>
              </div>
            </div>
            <div className="mt-auto">
              <button 
                onClick={handleExport}
                className="w-full bg-sage-600 hover:bg-sage-700 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 shadow-soft"
              >
                <Database className="w-5 h-5" />
                Download Backup (JSON)
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-earth-900/50 rounded-3xl p-8 shadow-soft border border-earth-100 dark:border-earth-800 flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-earth-100 dark:bg-earth-800 rounded-2xl text-earth-700 dark:text-earth-300">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-earth-900 dark:text-earth-100">Restore & Import</h4>
                <p className="text-earth-600 dark:text-earth-400 text-sm mt-1">Restore from a backup or import from other platforms.</p>
              </div>
            </div>
            
            <div className="mt-auto space-y-4">
              <div className="flex gap-2 p-1 bg-earth-50 dark:bg-earth-800/50 rounded-xl border border-earth-200 dark:border-earth-700">
                <button 
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${importMode === 'merge' ? 'bg-white dark:bg-earth-700 text-earth-900 dark:text-earth-100 shadow-sm' : 'text-earth-500 hover:text-earth-700 dark:hover:text-earth-300'}`}
                >
                  Merge
                </button>
                <button 
                  onClick={() => setImportMode('overwrite')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${importMode === 'overwrite' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm' : 'text-earth-500 hover:text-earth-700 dark:hover:text-earth-300'}`}
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
                className="w-full bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 px-4 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Restore from Backup
              </button>

              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={csvInputRef}
                onChange={handleCsvImport}
              />
              <button 
                onClick={() => csvInputRef.current?.click()}
                className="w-full bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 px-4 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Import from CSV
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h3 className="text-2xl font-serif text-red-800 dark:text-red-400 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Danger Zone
        </h3>
        <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl p-8 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-red-900 dark:text-red-300">Clear All Library Data</h4>
            <p className="text-red-700 dark:text-red-400/80 text-sm mt-1">This will permanently delete all books, tags, authors, and goals from your local storage.</p>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Clear Library
          </button>
        </div>
      </section>

      {/* Custom Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-earth-900 rounded-3xl p-8 max-w-md w-full shadow-vibe border border-red-100 dark:border-red-900/30"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-earth-400 hover:text-earth-600 dark:hover:text-earth-300 rounded-full hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-2xl font-serif text-earth-900 dark:text-earth-100 mb-2">Are you absolutely sure?</h3>
              <p className="text-earth-600 dark:text-earth-400 mb-6">
                This action cannot be undone. This will permanently delete your entire library, all tags, and author data from this device.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-2">
                    Please type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm.
                  </label>
                  <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full bg-earth-50 dark:bg-earth-950 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-3 text-earth-900 dark:text-earth-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    placeholder="DELETE"
                  />
                </div>
                
                <button 
                  onClick={handleDeleteLibrary}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-earth-200 dark:disabled:bg-earth-800 disabled:text-earth-400 dark:disabled:text-earth-600 text-white px-6 py-4 rounded-full font-bold transition-all"
                >
                  I understand, delete everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
