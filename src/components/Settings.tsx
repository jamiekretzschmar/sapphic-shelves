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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-bg/50 text-theme-text mb-4">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-serif text-theme-text">Settings & Data</h2>
        <p className="text-theme-text-secondary max-w-xl mx-auto">
          Personalize your experience and manage your local-first data.
        </p>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border ${status.type === 'success' ? 'bg-theme-accent2 dark:bg-theme-accent2/20 border-theme-accent2 dark:border-theme-accent2 text-theme-accent2' : 'bg-theme-danger/10 border-theme-danger/30 text-theme-danger'} flex items-center gap-3 font-medium mb-8`}
        >
          {status.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {status.message}
        </motion.div>
      )}

      {/* Reading Goals */}
      <section className="border-b border-theme-border pb-10 mb-10">
        <h3 className="text-2xl font-serif text-theme-text mb-6">Reading Goals</h3>
        <div className="bg-theme-surface rounded-3xl p-8 shadow-soft border border-theme-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-theme-text">Yearly Target</h4>
            <p className="text-theme-text-secondary text-sm mt-1">How many books do you want to read in {goals.year}?</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => updateGoal({ ...goals, target: Math.max(1, goals.target - 1) })}
              className="bg-theme-bg hover:bg-theme-bg/80 text-theme-text rounded-full w-12 h-12 flex items-center justify-center text-xl transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="text-4xl font-serif text-theme-text w-16 text-center">
              {goals.target}
            </div>
            <button 
              onClick={() => updateGoal({ ...goals, target: goals.target + 1 })}
              className="bg-theme-bg hover:bg-theme-bg/80 text-theme-text rounded-full w-12 h-12 flex items-center justify-center text-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="border-b border-theme-border pb-10 mb-10">
        <h3 className="text-2xl font-serif text-theme-text mb-6">Appearance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button 
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'light' ? 'bg-theme-bg border-theme-accent1 text-theme-text' : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-border/80'}`}
          >
            <Sun className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">Light</span>
          </button>
          <button 
            onClick={() => setTheme('leaf')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'leaf' ? 'bg-theme-bg border-theme-accent1 text-theme-text' : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-border/80'}`}
          >
            <div className="w-8 h-8 rounded-full bg-theme-accent1/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-theme-accent1" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Leaf</span>
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'dark' ? 'bg-theme-bg border-theme-accent1 text-theme-text' : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-border/80'}`}
          >
            <Moon className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">Dark</span>
          </button>
          <button 
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'system' ? 'bg-theme-bg border-theme-accent1 text-theme-text' : 'bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-border/80'}`}
          >
            <Monitor className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">System</span>
          </button>
        </div>
      </section>

      {/* GitHub Connection */}
      <section className="border-b border-theme-border pb-10 mb-10">
        <h3 className="text-2xl font-serif text-theme-text mb-6">Cloud Sync</h3>
        <div className="bg-theme-surface rounded-3xl p-8 shadow-soft border border-theme-border">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${githubUser ? 'bg-theme-accent1/20 text-theme-accent1' : 'bg-theme-bg text-theme-text-secondary'}`}>
              <Github className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-theme-text">GitHub Connection</h4>
              <p className="text-theme-text-secondary text-sm mt-1">
                {githubUser 
                  ? `Connected as ${githubUser.login}` 
                  : 'Connect your GitHub account to sync your library across devices.'}
              </p>
            </div>
            {githubUser && (
              <button 
                onClick={logoutGitHub}
                className="text-xs font-bold uppercase tracking-widest text-theme-danger hover:text-theme-danger/80 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
          
          {githubUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-theme-bg/50 border border-theme-border">
                <img src={githubUser.avatar_url} alt="" className="w-12 h-12 rounded-full border-2 border-theme-accent1/30" />
                <div>
                  <p className="font-bold text-theme-text">{githubUser.name || githubUser.login}</p>
                  <p className="text-xs text-theme-text-secondary">@{githubUser.login}</p>
                </div>
              </div>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-theme-accent1 hover:bg-theme-accent1/90 disabled:opacity-50 text-white px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-3 group active:scale-95 shadow-soft"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Library to GitHub'}</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={loginGitHub}
              className="w-full bg-theme-text hover:opacity-90 text-theme-bg px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-3 group active:scale-95 shadow-soft"
            >
              <Github className="w-5 h-5" />
              <span>Connect GitHub Account</span>
              <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity ml-2" />
            </button>
          )}
        </div>
      </section>

      {/* Data Management */}
      <section className="border-b border-theme-border pb-10 mb-10">
        <h3 className="text-2xl font-serif text-theme-text mb-6">Data Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-theme-surface rounded-3xl p-8 shadow-soft border border-theme-border flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-theme-accent1/20 rounded-2xl text-theme-accent1">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-theme-text">Backup Data</h4>
                <p className="text-theme-text-secondary text-sm mt-1">Download your entire library, tags, and authors as a JSON file.</p>
              </div>
            </div>
            <div className="mt-auto">
              <button 
                onClick={handleExport}
                className="w-full bg-theme-accent1 hover:bg-theme-accent1/90 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 shadow-soft"
              >
                <Database className="w-5 h-5" />
                Download Backup (JSON)
              </button>
            </div>
          </div>

          <div className="bg-theme-surface rounded-3xl p-8 shadow-soft border border-theme-border flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-theme-bg rounded-2xl text-theme-text-secondary">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-theme-text">Restore & Import</h4>
                <p className="text-theme-text-secondary text-sm mt-1">Restore from a backup or import from other platforms.</p>
              </div>
            </div>
            
            <div className="mt-auto space-y-4">
              <div className="flex gap-2 p-1 bg-theme-bg rounded-xl border border-theme-border">
                <button 
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${importMode === 'merge' ? 'bg-theme-surface text-theme-text shadow-sm' : 'text-theme-text-secondary hover:text-theme-text-secondary/70'}`}
                >
                  Merge
                </button>
                <button 
                  onClick={() => setImportMode('overwrite')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${importMode === 'overwrite' ? 'bg-theme-danger/20 text-theme-danger shadow-sm' : 'text-theme-text-secondary hover:text-theme-text-secondary/70'}`}
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
                className="w-full bg-theme-bg hover:bg-theme-bg/80 text-theme-text px-4 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
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
                className="w-full bg-theme-bg hover:bg-theme-bg/80 text-theme-text px-4 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
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
        <h3 className="text-2xl font-serif text-theme-danger mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Danger Zone
        </h3>
        <div className="bg-theme-danger/5 rounded-3xl p-8 border border-theme-danger/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-theme-danger">Clear All Library Data</h4>
            <p className="text-theme-danger/70 text-sm mt-1">This will permanently delete all books, tags, authors, and goals from your local storage.</p>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 bg-theme-danger/20 hover:bg-theme-danger/30 text-theme-danger px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Clear Library
          </button>
        </div>
      </section>

      {/* Custom Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-3xl p-8 max-w-md w-full shadow-vibe border border-red-200 dark:border-red-900/30"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-theme-danger/20 flex items-center justify-center text-theme-danger">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-theme-text-secondary hover:text-theme-text rounded-full hover:bg-theme-bg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-2xl font-serif text-theme-text mb-2">Are you absolutely sure?</h3>
              <p className="text-theme-text-secondary mb-6">
                This action cannot be undone. This will permanently delete your entire library, all tags, and author data from this device.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    Please type <span className="font-bold text-theme-danger">DELETE</span> to confirm.
                  </label>
                  <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-theme-text focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    placeholder="DELETE"
                  />
                </div>
                
                <button 
                  onClick={handleDeleteLibrary}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="w-full bg-theme-danger hover:bg-theme-danger/90 disabled:bg-theme-bg disabled:text-theme-text-secondary text-white px-6 py-4 rounded-full font-bold transition-all"
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
