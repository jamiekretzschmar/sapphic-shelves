import React, { useState } from 'react';
import { BarChart3, Target, BookOpen, CheckCircle2, Bookmark, Settings } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { motion } from 'framer-motion';
import CuratedFinds from './CuratedFinds';
import { Recommendations } from './Recommendations';

export default function Dashboard() {
  const { books, authors, goals, updateGoal } = useLibrary();
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
        <h2 className="text-3xl font-bold tracking-tight text-earth-900 dark:text-earth-50 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-mustard-600 dark:text-mustard-400" />
          Reading Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card">
          <div className="flex items-center gap-3 text-earth-600 dark:text-earth-400 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Total Library</span>
          </div>
          <div className="text-4xl font-bold text-earth-900 dark:text-earth-50">{totalBooks}</div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3 text-sage-600 dark:text-sage-400 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Currently Reading</span>
          </div>
          <div className="text-4xl font-bold text-earth-900 dark:text-earth-50">{readingBooks}</div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 mb-2">
            <Bookmark className="w-5 h-5" />
            <span className="font-medium">Wishlist</span>
          </div>
          <div className="text-4xl font-bold text-earth-900 dark:text-earth-50">{wishlistBooks}</div>
        </div>
      </div>

      <Recommendations 
        followedAuthors={authors.filter(a => a.isFavorite).map(a => a.name)} 
        readBooks={books.filter(b => b.status === 'Read').map(b => ({ title: b.title, author: b.author, description: b.description || '' }))}
      />

      <div className="bento-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-mustard-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h3 className="text-2xl font-bold text-earth-900 dark:text-earth-50 flex items-center gap-2">
              <Target className="w-6 h-6 text-mustard-600 dark:text-mustard-400" />
              {currentYear} Reading Goal
            </h3>
            <p className="text-earth-600 dark:text-earth-400 mt-1">Track your progress throughout the year.</p>
          </div>
          
          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={newGoal}
                onChange={e => setNewGoal(parseInt(e.target.value) || 0)}
                className="w-20 bg-white dark:bg-earth-900 border border-mustard-500/50 rounded-lg px-3 py-1.5 text-earth-900 dark:text-earth-100 focus:outline-none text-center"
              />
              <button onClick={handleSaveGoal} className="bg-mustard-600 hover:bg-mustard-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          ) : (
            <button onClick={() => setIsEditingGoal(true)} className="p-2 text-earth-500 hover:text-mustard-600 dark:hover:text-mustard-400 transition-colors rounded-lg hover:bg-mustard-400/10">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-earth-600 dark:text-earth-300">{booksReadThisYear} books read</span>
            <span className="text-mustard-600 dark:text-mustard-400">{goals.target} goal</span>
          </div>
          <div className="h-4 bg-earth-200 dark:bg-earth-800 rounded-full overflow-hidden border border-earth-300 dark:border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-mustard-600 to-mustard-400 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </motion.div>
          </div>
          <div className="mt-4 text-center text-earth-600 dark:text-earth-400 text-sm">
            {progress >= 100 ? (
              <span className="text-sage-600 dark:text-sage-400 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Goal Achieved!
              </span>
            ) : (
              <span>{progress}% completed. Keep reading!</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-earth-200 dark:border-earth-800">
        <CuratedFinds />
      </div>
    </div>
  );
}
