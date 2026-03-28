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
              <h3 className="font-semibold text-theme-text flex items-center gap-2">
                <Activity className="w-4 h-4 text-theme-accent1" />
                Background Tasks
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-theme-text-secondary hover:text-theme-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2 space-y-2">
              {tasks.map((task, index) => {
                const cardColorClass = index % 3 === 0 ? 'bg-theme-earth-blue-light' : index % 3 === 1 ? 'bg-theme-earth-yellow-light' : 'bg-theme-earth-olive-green-light';
                return (
                  <div key={task.id} className={`p-3 rounded-xl border border-theme-border flex items-start gap-3 ${cardColorClass}`}>
                    <div className="mt-0.5">
                      {task.status === 'processing' && <LogoLoader size={16} />}
                      {task.status === 'pending' && <Activity className="w-4 h-4 text-theme-text-secondary" />}
                      {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-theme-accent1" />}
                      {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-theme-danger" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-theme-text truncate pr-2">{task.name}</p>
                        {(task.status === 'completed' || task.status === 'failed') && (
                          <button onClick={() => removeTask(task.id)} className="text-theme-text-secondary hover:text-theme-text">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {task.status === 'processing' && task.progress !== undefined && (
                        <div className="mt-2 h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-theme-accent1 transition-all duration-300" 
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-neo shadow-xl rounded-full p-3 flex items-center gap-2 hover:bg-white/40 transition-colors"
      >
        <div className="relative">
          <Activity className={`w-5 h-5 ${activeTasks > 0 ? 'text-theme-accent1' : 'text-theme-text-secondary'}`} />
          {activeTasks > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-theme-accent1 rounded-full animate-pulse border border-theme-surface"></span>
          )}
        </div>
        <span className="text-sm font-medium text-theme-text pr-1">
          {activeTasks > 0 ? `${activeTasks} Active` : 'Tasks'}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-theme-text-secondary" /> : <ChevronUp className="w-4 h-4 text-theme-text-secondary" />}
      </button>
    </div>
  );
}
