import React, { useState } from 'react';
import { BarChart3, Target, BookOpen, CheckCircle2, Bookmark, Settings } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { books, goals, updateGoal } = useLibrary();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(goals.target);

  const currentYear = new Date().getFullYear();
  const booksReadThisYear = books.filter(b => 
    b.status === 'Read' && new Date(b.dateAdded).getFullYear() === currentYear
  ).length;

  const totalBooks = books.length;
  const readingBooks = books.filter(b => b.status === 'Reading').length;
  const wishlistBooks = books.filter(b => b.status === 'Wishlist').length;

  const progress = Math.min(100, Math.round((booksReadThisYear / goals.target) * 100));

  const handleSaveGoal = () => {
    updateGoal({ target: newGoal, year: currentYear });
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-amber-400" />
          Reading Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Total Library</span>
          </div>
          <div className="text-4xl font-bold text-slate-100">{totalBooks}</div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Currently Reading</span>
          </div>
          <div className="text-4xl font-bold text-slate-100">{readingBooks}</div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3 text-fuchsia-400 mb-2">
            <Bookmark className="w-5 h-5" />
            <span className="font-medium">Wishlist</span>
          </div>
          <div className="text-4xl font-bold text-slate-100">{wishlistBooks}</div>
        </div>
      </div>

      <div className="bento-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-400" />
              {currentYear} Reading Goal
            </h3>
            <p className="text-slate-400 mt-1">Track your progress throughout the year.</p>
          </div>
          
          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={newGoal}
                onChange={e => setNewGoal(parseInt(e.target.value) || 0)}
                className="w-20 bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none text-center"
              />
              <button onClick={handleSaveGoal} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          ) : (
            <button onClick={() => setIsEditingGoal(true)} className="p-2 text-slate-500 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-400/10">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-slate-300">{booksReadThisYear} books read</span>
            <span className="text-amber-400">{goals.target} goal</span>
          </div>
          <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </motion.div>
          </div>
          <div className="mt-4 text-center text-slate-400 text-sm">
            {progress >= 100 ? (
              <span className="text-emerald-400 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Goal Achieved!
              </span>
            ) : (
              <span>{progress}% completed. Keep reading!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
