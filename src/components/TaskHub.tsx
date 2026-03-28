import React, { useState } from 'react';
import LogoLoader from './LogoLoader';
import { Activity, X, CheckCircle2, AlertCircle, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskHub() {
  const { tasks, removeTask } = useLibrary();
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'pending').length;

  return (
    <div className="fixed bottom-24 right-4 sm:right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-panel rounded-2xl w-80 mb-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/20">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Background Tasks
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2 space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="p-3 bg-white/30 rounded-xl border border-white/20 flex items-start gap-3">
                  <div className="mt-0.5">
                    {task.status === 'processing' && <LogoLoader size={16} />}
                    {task.status === 'pending' && <Activity className="w-4 h-4 text-slate-500" />}
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-slate-200 truncate pr-2">{task.name}</p>
                      {(task.status === 'completed' || task.status === 'failed') && (
                        <button onClick={() => removeTask(task.id)} className="text-slate-500 hover:text-slate-300">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {task.status === 'processing' && task.progress !== undefined && (
                      <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300" 
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-neo shadow-xl rounded-full p-3 flex items-center gap-2 hover:bg-white/40 transition-colors"
      >
        <div className="relative">
          <Activity className={`w-5 h-5 ${activeTasks > 0 ? 'text-blue-400' : 'text-slate-400'}`} />
          {activeTasks > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border border-slate-900"></span>
          )}
        </div>
        <span className="text-sm font-medium text-slate-200 pr-1">
          {activeTasks > 0 ? `${activeTasks} Active` : 'Tasks'}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
      </button>
    </div>
  );
}
