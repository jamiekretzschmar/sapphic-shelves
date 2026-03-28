import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, MapPin, Library, Camera, Sparkles, Moon, Sun, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Action = {
  id: string;
  title: string;
  icon: React.ReactNode;
  onSelect: () => void;
  section: string;
};

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onNavigate
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onNavigate: (tab: any) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const actions: Action[] = [
    { id: 'nav-library', title: 'Go to Library', icon: <Library className="w-4 h-4" />, section: 'Navigation', onSelect: () => onNavigate('library') },
    { id: 'nav-search', title: 'Discover Novels', icon: <Search className="w-4 h-4" />, section: 'Navigation', onSelect: () => onNavigate('search') },
    { id: 'nav-local', title: 'Local Bookstores', icon: <MapPin className="w-4 h-4" />, section: 'Navigation', onSelect: () => onNavigate('local') },
    { id: 'nav-sync', title: 'Shelf Sync', icon: <Camera className="w-4 h-4" />, section: 'Navigation', onSelect: () => onNavigate('sync') },
    { id: 'nav-resources', title: 'Resource Engine', icon: <Sparkles className="w-4 h-4" />, section: 'Navigation', onSelect: () => onNavigate('resources') },
  ];

  const filteredActions = actions.filter(a => (a.title?.toLowerCase() || '').includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-theme-bg/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center px-4 py-3 border-b border-theme-border">
          <Search className="w-5 h-5 text-theme-text-secondary mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-theme-text placeholder:text-theme-text-secondary focus:outline-none"
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filteredActions.length > 0) {
                filteredActions[0].onSelect();
                onClose();
              }
            }}
          />
          <div className="text-xs text-theme-text-secondary bg-theme-bg px-2 py-1 rounded border border-theme-border">ESC</div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-4 text-center text-theme-text-secondary text-sm">No results found.</div>
          ) : (
            filteredActions.map((action, i) => (
              <button
                key={action.id}
                onClick={() => { action.onSelect(); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-theme-accent1/10 hover:text-theme-accent1 text-theme-text-secondary ${i === 0 && query ? 'bg-theme-bg/50' : ''}`}
              >
                <div className="text-theme-text-secondary">{action.icon}</div>
                <span>{action.title}</span>
                <span className="ml-auto text-xs text-theme-text-secondary">{action.section}</span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
