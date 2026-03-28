import React, { useState, useEffect } from 'react';
import { BookOpen, Search, MapPin, Library as LibraryIcon, Camera, Sparkles, LayoutDashboard, Hash, Settings as SettingsIcon, Users, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MyAuthors from './components/MyAuthors';
import SearchNovels from './components/SearchNovels';
import ShelfSync from './components/ShelfSync';
import CommandPalette from './components/CommandPalette';
import Library from './components/Library';
import Lexicon from './components/Lexicon';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import TaskHub from './components/TaskHub';
import ErrorBoundary from './components/ErrorBoundary';
import DebugPanel from './components/DebugPanel';
import Logo from './components/Logo';
import { LibraryProvider } from './context/LibraryContext';

type Tab = 'dashboard' | 'library' | 'authors' | 'lexicon' | 'discovery' | 'sync' | 'settings' | 'debug';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-stone-100 sm:p-8 flex items-center justify-center selection:bg-ocean/30">
      {/* Pixel 10 Pro Device Frame */}
      <div className="w-full h-[100dvh] sm:w-[412px] sm:h-[892px] bg-[#F4F3F0] relative sm:rounded-[3rem] sm:border-[14px] border-stone-300 overflow-hidden shadow-2xl flex flex-col transition-colors duration-500">
        
        {/* Ambient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] rounded-full bg-[#4A7C82]/10 blur-[80px] mix-blend-multiply transition-all duration-1000"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[40%] rounded-full bg-[#8B5A5A]/10 blur-[80px] mix-blend-multiply transition-all duration-1000"></div>
        </div>

        <CommandPalette 
          isOpen={isCmdPaletteOpen} 
          onClose={() => setIsCmdPaletteOpen(false)} 
          onNavigate={(tab) => setActiveTab(tab as Tab)}
        />
        
        {/* Mobile Header */}
        <header className="relative z-40 pt-safe mt-4 px-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#5A0A18]">
            <button 
              onClick={() => setIsLogoLoading(!isLogoLoading)}
              className="p-1.5 bg-white/50 rounded-2xl shadow-sm border border-white/60 hover:bg-white/80 transition-colors active:scale-95"
              aria-label="Toggle loading state"
            >
              <Logo isLoading={isLogoLoading} size={28} />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-stone-800">Sapphic Shelves</h1>
          </div>
          <button 
            onClick={() => setIsCmdPaletteOpen(true)}
            className="p-3 text-slate-500 bg-white/40 hover:bg-white/60 border border-white/60 rounded-2xl transition-all duration-300 active:scale-90 shadow-sm"
          >
            <Search className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 relative z-10 overflow-y-auto overscroll-y-contain no-scrollbar px-5 pt-2 pb-44">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Dashboard />
              </motion.div>
            )}
            {activeTab === 'library' && (
              <motion.div key="library" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Library />
              </motion.div>
            )}
            {activeTab === 'authors' && (
              <motion.div key="authors" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <MyAuthors />
              </motion.div>
            )}
            {activeTab === 'lexicon' && (
              <motion.div key="lexicon" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Lexicon />
              </motion.div>
            )}
            {activeTab === 'discovery' && (
              <motion.div key="discovery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <SearchNovels />
              </motion.div>
            )}
            {activeTab === 'sync' && (
              <motion.div key="sync" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <ShelfSync />
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Settings />
              </motion.div>
            )}
            {activeTab === 'debug' && (
              <motion.div key="debug" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <DebugPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <TaskHub />

        {/* Bottom Navigation (Mobile Ergonomics) */}
        <nav className="absolute bottom-0 left-0 w-full z-50 pointer-events-none">
          <div className="pointer-events-auto glass-neo w-full px-4 py-4 pb-safe rounded-t-[2rem] rounded-b-none flex items-center justify-between gap-1 overflow-x-auto no-scrollbar snap-x snap-mandatory border-b-0 shadow-[0_-10px_40px_rgba(140,146,157,0.15)]">
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-6 h-6" />} label="Dashboard" />
            <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<LibraryIcon className="w-6 h-6" />} label="Library" />
            <TabButton active={activeTab === 'authors'} onClick={() => setActiveTab('authors')} icon={<Users className="w-6 h-6" />} label="Authors" />
            <TabButton active={activeTab === 'lexicon'} onClick={() => setActiveTab('lexicon')} icon={<Hash className="w-6 h-6" />} label="Lexicon" />
            <TabButton active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} icon={<Sparkles className="w-6 h-6" />} label="Discovery" />
            <TabButton active={activeTab === 'sync'} onClick={() => setActiveTab('sync')} icon={<Camera className="w-6 h-6" />} label="Sync" />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon className="w-6 h-6" />} label="Settings" />
            <TabButton active={activeTab === 'debug'} onClick={() => setActiveTab('debug')} icon={<Terminal className="w-6 h-6" />} label="Debug" />
          </div>
        </nav>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center min-w-[4.5rem] h-16 rounded-2xl transition-all duration-300 active:scale-90 snap-center shrink-0 ${
        active 
          ? 'text-fuchsia-400 glass-neo-pressed' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
      }`}
    >
      <div className="relative z-10 mb-1">{icon}</div>
      <span className="text-[10px] font-medium relative z-10">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LibraryProvider>
        <AppContent />
      </LibraryProvider>
    </ErrorBoundary>
  );
}
