import React, { useState, useEffect } from 'react';
import { fetchBooksByAuthor } from '../services/api';
import { filterUpcomingAndRecentBooks } from '../utils/dateFilters';
import { useLibrary } from '../context/LibraryContext';
import { Calendar, Loader2, ExternalLink, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReleaseTracker() {
  const { authors, books, addBook } = useLibrary();
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      if (authors.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let allReleases: any[] = [];
        
        // Fetch books for all authors
        const promises = authors.map(async (author) => {
          const authorBooks = await fetchBooksByAuthor(author.name);
          const filtered = filterUpcomingAndRecentBooks(authorBooks);
          
          // Add author info to each book for display
          return filtered.map((book: any) => ({
            ...book,
            authorName: author.name,
            authorId: author.id
          }));
        });
        
        const results = await Promise.all(promises);
        allReleases = results.flat();
        
        // Sort by publication date (newest first)
        allReleases.sort((a, b) => {
          const dateA = new Date(a.volumeInfo?.publishedDate || '1970-01-01').getTime();
          const dateB = new Date(b.volumeInfo?.publishedDate || '1970-01-01').getTime();
          return dateB - dateA;
        });
        
        setReleases(allReleases);
      } catch (err) {
        console.error("Failed to fetch releases:", err);
        setError("Failed to load upcoming and recent releases. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [authors]);

  const isFutureRelease = (dateStr?: string) => {
    if (!dateStr) return false;
    const release = new Date(dateStr);
    const now = new Date();
    return release > now;
  };

  if (authors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Calendar className="w-16 h-16 text-theme-accent1 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-theme-text mb-2">No Authors Tracked</h2>
        <p className="text-theme-text-secondary max-w-md">
          Add your favorite WLW contemporary romance authors in the Authors tab to start tracking their upcoming and recent releases here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-theme-text flex items-center gap-2">
          <Calendar className="w-6 h-6 text-theme-accent1" />
          Release Tracker
        </h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-theme-accent1 animate-spin mb-4" />
          <p className="text-theme-text-secondary">Scanning Google Books for new releases...</p>
        </div>
      ) : error ? (
        <div className="bg-theme-danger/10 border border-theme-danger/30 rounded-xl p-6 text-center">
          <p className="text-theme-danger">{error}</p>
        </div>
      ) : releases.length === 0 ? (
        <div className="bg-theme-surface border border-theme-border rounded-xl p-12 text-center">
          <p className="text-theme-text-secondary">No recent or upcoming releases found for your tracked authors.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {releases.map((book, idx) => {
            const isFuture = isFutureRelease(book.volumeInfo?.publishedDate);
            const inLibrary = books.find(b => 
              (b.title?.toLowerCase() || '') === (book.volumeInfo?.title?.toLowerCase() || '') && 
              (b.author?.toLowerCase() || '') === (book.authorName?.toLowerCase() || '')
            );
            
            const coverUrl = book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:');

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={book.id || idx} 
                className={`bg-theme-surface p-4 rounded-xl border transition-colors hover:border-theme-border/50 flex flex-col ${isFuture ? 'border-theme-accent1/30 bg-theme-accent1/5' : 'border-theme-border'}`}
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-28 shrink-0 rounded-md overflow-hidden bg-theme-bg/50 border border-theme-border flex items-center justify-center">
                    {coverUrl ? (
                      <img src={coverUrl} alt={book.volumeInfo?.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xs text-theme-text-secondary text-center px-2">No Cover</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-theme-text leading-tight mb-1 line-clamp-2">{book.volumeInfo?.title}</h3>
                    <p className="text-sm text-theme-text-secondary mb-2">{book.authorName}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {isFuture ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-accent1 bg-theme-accent1/10 px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-accent2 bg-theme-accent2/10 px-2 py-0.5 rounded-full">
                          New Release
                        </span>
                      )}
                      
                      {inLibrary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-theme-text/10 text-theme-text-secondary">
                          In Library
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-mono text-theme-text-secondary mt-2">
                      {book.volumeInfo?.publishedDate}
                    </p>
                  </div>
                </div>
                
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => addBook({ 
                      title: book.volumeInfo?.title || '', 
                      author: book.authorName, 
                      status: 'Wishlist', 
                      tags: [], 
                      description: book.volumeInfo?.description || '',
                      coverUrl: coverUrl
                    })}
                    disabled={!!inLibrary}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      inLibrary 
                        ? 'bg-theme-bg text-theme-text-secondary border border-theme-border/50' 
                        : 'bg-theme-accent1 text-white hover:bg-theme-accent1/90'
                    }`}
                  >
                    {inLibrary ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {inLibrary ? 'Added' : 'Wishlist'}
                  </button>
                  
                  {book.volumeInfo?.infoLink && (
                    <a 
                      href={book.volumeInfo.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-theme-bg text-theme-text-secondary hover:text-theme-accent1 hover:bg-theme-accent1/10 transition-colors border border-theme-border"
                      title="View on Google Books"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
