import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import LogoLoader from './LogoLoader';
import { Sparkles, BookOpen } from 'lucide-react';
import { getRecommendations, DiscoveredBook } from '../services/gemini';

interface RecommendationsProps {
  followedAuthors: string[];
  readBooks: DiscoveredBook[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ followedAuthors, readBooks }) => {
  const [recommendations, setRecommendations] = useState<DiscoveredBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (followedAuthors.length > 0 || readBooks.length > 0) {
      setLoading(true);
      getRecommendations(followedAuthors, readBooks)
        .then(setRecommendations)
        .finally(() => setLoading(false));
    }
  }, [followedAuthors, readBooks]);

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center text-earth-500 italic space-y-4">
      <LogoLoader size={48} />
      <span>Finding your next favorite read...</span>
    </div>
  );
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif text-earth-800 dark:text-earth-100 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-mustard-500" /> Recommended for You
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {recommendations.map((book, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-earth-50 dark:bg-earth-900 p-4 rounded-xl border border-earth-200 dark:border-earth-800"
          >
            <div className="flex items-start gap-3">
              {book.coverUrl && <img src={book.coverUrl} alt={book.title} className="w-16 h-24 object-cover rounded shadow-sm" referrerPolicy="no-referrer" />}
              <div>
                <h4 className="font-bold text-earth-900 dark:text-earth-100">{book.title}</h4>
                <p className="text-sm text-earth-600 dark:text-earth-400">{book.author}</p>
                <p className="text-xs text-earth-500 mt-1">{book.genre} • {book.publicationYear}</p>
              </div>
            </div>
            <p className="text-sm text-earth-700 dark:text-earth-300 mt-3 line-clamp-3">{book.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
