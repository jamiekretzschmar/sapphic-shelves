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
        <h2 className="text-3xl font-bold tracking-tight text-theme-text flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-theme-accent1" />
          Reading Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card-blue">
          <div className="flex items-center gap-3 text-theme-earth-blue-dark mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Total Library</span>
          </div>
          <div className="text-4xl font-bold text-theme-text">{totalBooks}</div>
        </div>
        <div className="bento-card-yellow">
          <div className="flex items-center gap-3 text-theme-earth-yellow-dark mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Currently Reading</span>
          </div>
          <div className="text-4xl font-bold text-theme-text">{readingBooks}</div>
        </div>
        <div className="bento-card-olive">
          <div className="flex items-center gap-3 text-theme-earth-olive-green-dark mb-2">
            <Bookmark className="w-5 h-5" />
            <span className="font-medium">Wishlist</span>
          </div>
          <div className="text-4xl font-bold text-theme-text">{wishlistBooks}</div>
        </div>
      </div>

      <Recommendations 
        followedAuthors={authors.filter(a => a.isFavorite).map(a => a.name)} 
        readBooks={books.filter(b => b.status === 'Read').map(b => ({ title: b.title, author: b.author, description: b.description || '' }))}
      />

      <div className="bento-card-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent1/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h3 className="text-2xl font-bold text-theme-text flex items-center gap-2">
              <Target className="w-6 h-6 text-theme-accent1" />
              {currentYear} Reading Goal
            </h3>
            <p className="text-theme-text-secondary mt-1">Track your progress throughout the year.</p>
          </div>
          
          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={newGoal}
                onChange={e => setNewGoal(parseInt(e.target.value) || 0)}
                className="w-20 bg-theme-surface border border-theme-accent1/50 rounded-lg px-3 py-1.5 text-theme-text focus:outline-none text-center"
              />
              <button onClick={handleSaveGoal} className="bg-theme-accent1 hover:bg-theme-accent1/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          ) : (
            <button onClick={() => setIsEditingGoal(true)} className="p-2 text-theme-text-secondary hover:text-theme-accent1 transition-colors rounded-lg hover:bg-theme-accent1/10">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-theme-text-secondary">{booksReadThisYear} books read</span>
            <span className="text-theme-accent1">{goals.target} goal</span>
          </div>
          <div className="h-4 bg-theme-bg rounded-full overflow-hidden border border-theme-border">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-theme-accent1 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </motion.div>
          </div>
          <div className="mt-4 text-center text-theme-text-secondary text-sm">
            {progress >= 100 ? (
              <span className="text-theme-accent2 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Goal Achieved!
              </span>
            ) : (
              <span>{progress}% completed. Keep reading!</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-theme-border">
        <CuratedFinds />
      </div>
    </div>
  );
}
