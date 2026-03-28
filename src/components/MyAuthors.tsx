import React, { useState } from 'react';
import { Search, Plus, Loader2, Book, Trash2, ChevronDown, ChevronUp, Copy, Check, Activity, Star, Bell, X, ExternalLink } from 'lucide-react';
import { Author, searchForAuthor, getAuthorPulse, checkUpcomingReleases, QuotaExceededError } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { useLibrary } from '../context/LibraryContext';
import Logo from './Logo';

export default function MyAuthors() {
  const { authors, addAuthor, removeAuthor, updateAuthor, addTask, updateTask, books, addBook } = useLibrary();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);
  const [loadingAuthorId, setLoadingAuthorId] = useState<string | null>(null);
  const [copiedBookIdx, setCopiedBookIdx] = useState<string | null>(null);
  const [pulseData, setPulseData] = useState<Record<string, string>>({});
  const [loadingPulse, setLoadingPulse] = useState<string | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<'alphabetical' | 'books' | 'favorites'>('favorites');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const author = await searchForAuthor(query);
      if (author) {
        addAuthor(author);
        setQuery('');
      } else {
        setError('Could not find information about this author.');
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setError('API Limit Reached. Please try again later.');
      } else {
        setError('An error occurred while searching.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedAuthor === id) {
      setExpandedAuthor(null);
    } else {
      setExpandedAuthor(id);
      setLoadingAuthorId(id);
      setTimeout(() => {
        setLoadingAuthorId(null);
      }, 600);
    }
  };

  const handlePulse = async (e: React.MouseEvent, authorName: string, authorId: string) => {
    e.stopPropagation();
    if (expandedAuthor !== authorId) {
      setExpandedAuthor(authorId);
    }
    if (pulseData[authorId]) return; // Already loaded
    
    setLoadingPulse(authorId);
    try {
      const res = await getAuthorPulse(authorName);
      setPulseData(prev => ({ ...prev, [authorId]: res }));
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setPulseData(prev => ({ ...prev, [authorId]: 'API Limit Reached. Please try again later.' }));
      } else {
        setPulseData(prev => ({ ...prev, [authorId]: 'Failed to fetch pulse.' }));
      }
    } finally {
      setLoadingPulse(null);
    }
  };

  const handleCopy = (book: any, authorId: string, idx: number) => {
    const textToCopy = `${book.title} (${book.year})\n${book.description}`;
    navigator.clipboard.writeText(textToCopy);
    
    const key = `${authorId}-${idx}`;
    setCopiedBookIdx(key);
    setTimeout(() => {
      setCopiedBookIdx(null);
    }, 2000);
  };

  const toggleFavorite = (e: React.MouseEvent, author: Author) => {
    e.stopPropagation();
    updateAuthor(author.id, { isFavorite: !author.isFavorite });
  };

  const isNewRelease = (releaseDate?: string) => {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const now = new Date();
    const diffTime = now.getTime() - release.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const isFutureRelease = (releaseDate?: string) => {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const now = new Date();
    return release > now;
  };

  const handleBulkPulse = async (target: 'favorites' | 'all' | 'selected') => {
    let targetAuthors: Author[] = [];
    if (target === 'favorites') {
      targetAuthors = authors.filter(a => a.isFavorite);
    } else if (target === 'all') {
      targetAuthors = authors;
    } else if (target === 'selected') {
      targetAuthors = authors.filter(a => selectedAuthors.has(a.id));
    }

    if (targetAuthors.length === 0) {
      setNotification(`No ${target} authors found to check.`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Reset selection mode if we used it
    if (target === 'selected') {
      setSelectionMode(false);
      setSelectedAuthors(new Set());
    }

    const taskId = addTask({
      name: `Bulk Pulse Update (${target})`,
      status: 'processing',
      progress: 0
    });

    let foundUpcoming = 0;
    const currentDate = new Date().toISOString().split('T')[0];

    for (let i = 0; i < targetAuthors.length; i++) {
      const author = targetAuthors[i];
      try {
        const result = await checkUpcomingReleases(author.name, currentDate);
        
        if (result.hasUpcoming) {
          foundUpcoming++;
          
          // Merge new books
          const existingTitles = new Set(author.bibliography.map(b => (b.title?.toLowerCase() || '')));
          const newBooks = result.newBooks.filter(b => !existingTitles.has(b.title?.toLowerCase() || ''));
          
          updateAuthor(author.id, {
            hasUpcomingRelease: true,
            lastPulseCheck: new Date().toISOString(),
            bibliography: [...author.bibliography, ...newBooks]
          });
        } else {
          updateAuthor(author.id, {
            hasUpcomingRelease: false,
            lastPulseCheck: new Date().toISOString(),
          });
        }
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          updateTask(taskId, { status: 'failed', name: 'Quota Exceeded' });
          setNotification('API Limit Reached during bulk update.');
          setTimeout(() => setNotification(null), 5000);
          return;
        }
        // Continue with next author for other errors
      }
      
      updateTask(taskId, { progress: Math.round(((i + 1) / targetAuthors.length) * 100) });
    }

    updateTask(taskId, { status: 'completed' });
    
    if (foundUpcoming > 0) {
      setNotification(`Found upcoming releases for ${foundUpcoming} author(s)! They have been moved to the top.`);
    } else {
      setNotification(`Pulse check complete. No new upcoming releases found.`);
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedAuthors);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAuthors(newSet);
  };

  // Sort authors: upcoming first, then based on sortOption
  const sortedAuthors = [...authors].sort((a, b) => {
    if (a.hasUpcomingRelease && !b.hasUpcomingRelease) return -1;
    if (!a.hasUpcomingRelease && b.hasUpcomingRelease) return 1;
    
    if (sortOption === 'favorites') {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'books') {
      const aBooks = a.bibliography?.length || 0;
      const bBooks = b.bibliography?.length || 0;
      if (aBooks !== bBooks) return bBooks - aBooks;
      return a.name.localeCompare(b.name);
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const getMostRecentBook = (bibliography: any[]) => {
    if (!bibliography || bibliography.length === 0) return null;
    return [...bibliography].sort((a, b) => {
      const dateA = a.releaseDate || `${a.year}-01-01`;
      const dateB = b.releaseDate || `${b.year}-01-01`;
      return dateB.localeCompare(dateA);
    })[0];
  };

  const BookCard = ({ book, author, idx, isFuture, isNew }: { book: any, author: any, idx: number, isFuture: boolean, isNew: boolean }) => {
    const isCopied = copiedBookIdx === `${author.id}-${idx}`;
    const inLibrary = books.find(b => 
      (b.title?.toLowerCase() || '') === (book.title?.toLowerCase() || '') && 
      (b.author?.toLowerCase() || '') === (author.name?.toLowerCase() || '')
    );

    return (
      <div className={`bg-slate-900 p-4 rounded-xl border transition-colors hover:border-white/10 group/book ${isFuture ? 'border-amber-500/30 bg-amber-500/5' : isNew ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="font-medium text-slate-200">{book.title}</h5>
              {isFuture && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Upcoming</span>}
              {isNew && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">New Release</span>}
              {inLibrary && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  inLibrary.status === 'Read' ? 'bg-emerald-500/20 text-emerald-400' :
                  inLibrary.status === 'Wishlist' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {inLibrary.status}
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-md mt-1.5 inline-block">
              {book.releaseDate || book.year}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCopy(book, author.id, idx)}
              className="p-2 text-slate-500 hover:text-fuchsia-400 hover:bg-fuchsia-400/10 rounded-lg transition-all"
              title="Copy details"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-4">{book.description}</p>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => addBook({ title: book.title, author: author.name, status: 'Wishlist', tags: [], description: book.description })}
            disabled={!!inLibrary}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              inLibrary?.status === 'Wishlist' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 
              'bg-slate-800 text-slate-300 hover:bg-fuchsia-600 hover:text-white disabled:opacity-50'
            }`}
          >
            <Plus className="w-3 h-3" /> Wishlist
          </button>
          <button
            onClick={() => addBook({ title: book.title, author: author.name, status: 'Read', tags: [], description: book.description })}
            disabled={!!inLibrary}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              inLibrary?.status === 'Read' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
              'bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white disabled:opacity-50'
            }`}
          >
            <Check className="w-3 h-3" /> Read
          </button>
          <button
            onClick={() => addBook({ title: book.title, author: author.name, status: 'Ignored', tags: [], description: book.description })}
            disabled={!!inLibrary}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              inLibrary?.status === 'Ignored' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' : 
              'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50'
            }`}
          >
            <X className="w-3 h-3" /> Ignore
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-neo px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-emerald-500/30"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-100 font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bento-card relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-purple-500/5 pointer-events-none"></div>
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
          <Plus className="w-6 h-6 text-fuchsia-400" />
          Track a New Author
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 relative z-10">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Sarah Waters..."
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all shadow-inner text-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 active:scale-[0.98] text-white px-6 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-fuchsia-500/25"
          >
            {loading ? <Logo isLoading={true} size={20} /> : <Plus className="w-5 h-5" />}
            <span>Track Author</span>
          </button>
        </form>
        {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100">My Tracked Authors</h2>
          <div className="flex items-center gap-3">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500/50 appearance-none cursor-pointer"
            >
              <option value="favorites">Sort by Favorites</option>
              <option value="alphabetical">Sort Alphabetically</option>
              <option value="books">Sort by Books</option>
            </select>
            <div className="relative">
              <button 
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="text-sm font-medium text-ocean bg-ocean/10 hover:bg-ocean/20 px-4 py-2 rounded-xl border border-ocean/20 transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Pulse</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showBulkMenu ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showBulkMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 glass-neo rounded-xl overflow-hidden z-20 shadow-xl border border-white/20"
                  >
                    <button 
                      onClick={() => { setShowBulkMenu(false); handleBulkPulse('favorites'); }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-white/40 transition-colors border-b border-white/10 flex items-center gap-2"
                    >
                      <Star className="w-4 h-4 text-amber-500" />
                      Update Favorites
                    </button>
                    <button 
                      onClick={() => { setShowBulkMenu(false); handleBulkPulse('all'); }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-white/40 transition-colors border-b border-white/10 flex items-center gap-2"
                    >
                      <Book className="w-4 h-4 text-ocean" />
                      Update All
                    </button>
                    <button 
                      onClick={() => { 
                        setShowBulkMenu(false); 
                        if (selectionMode && selectedAuthors.size > 0) {
                          handleBulkPulse('selected');
                        } else {
                          setSelectionMode(!selectionMode);
                          setSelectedAuthors(new Set());
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-white/40 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      {selectionMode && selectedAuthors.size > 0 ? `Update Selected (${selectedAuthors.size})` : selectionMode ? 'Cancel Selection' : 'Select Authors...'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {selectionMode && (
              <button
                onClick={() => { setSelectionMode(false); setSelectedAuthors(new Set()); }}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <span className="text-sm font-medium text-slate-500 bg-white/30 px-3 py-1 rounded-full border border-white/20">{sortedAuthors.length} tracked</span>
          </div>
        </div>
        
        {sortedAuthors.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
            <Book className="w-16 h-16 text-slate-600/50 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">You aren't tracking any authors yet.</p>
          </div>
        ) : (
          <motion.div 
            className="grid gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {sortedAuthors.map((author) => (
              <motion.div 
                key={author.id} 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4 } }
                }}
                className="bento-card p-0 overflow-hidden"
              >
                <div 
                  className={`p-6 cursor-pointer flex items-center justify-between transition-colors ${selectedAuthors.has(author.id) ? 'bg-ocean/5' : 'hover:bg-white/[0.02]'}`}
                  onClick={() => selectionMode ? toggleSelection({ stopPropagation: () => {} } as React.MouseEvent, author.id) : handleExpand(author.id)}
                >
                  <div className="flex-1 pr-4 overflow-hidden flex items-center gap-4">
                    {selectionMode && (
                      <div 
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedAuthors.has(author.id) ? 'bg-ocean border-ocean text-white' : 'border-slate-400'}`}
                        onClick={(e) => toggleSelection(e, author.id)}
                      >
                        {selectedAuthors.has(author.id) && <Check className="w-3 h-3" />}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-100 tracking-tight">{author.name}</h3>
                        {author.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        {author.hasUpcomingRelease && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                            <Bell className="w-3 h-3" /> Upcoming
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500 truncate max-w-[200px]">{author.biography}</p>
                        {getMostRecentBook(author.bibliography) && (
                          <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 hidden sm:inline-block">
                            Latest: {getMostRecentBook(author.bibliography)?.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <button 
                      onClick={(e) => toggleFavorite(e, author)}
                      className={`p-2 rounded-lg transition-colors ${author.isFavorite ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-400/10'}`}
                      title="Favorite Author"
                    >
                      <Star className={`w-5 h-5 ${author.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => handlePulse(e, author.name, author.id)}
                      className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors hidden sm:block"
                      title="Author Pulse"
                    >
                      <Activity className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeAuthor(author.id); }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors hidden sm:block"
                      title="Remove Author"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {expandedAuthor === author.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedAuthor === author.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-slate-950/50"
                    >
                      <div className="p-6 space-y-6">
                        {loadingAuthorId === author.id ? (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-3">
                            <Logo isLoading={true} size={32} />
                            <p className="text-sm">Retrieving archival details...</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 sm:hidden mb-4 pb-4 border-b border-white/5">
                              <button 
                                onClick={(e) => handlePulse(e, author.name, author.id)}
                                className="flex-1 p-2 text-sm font-medium text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Activity className="w-4 h-4" /> Pulse
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeAuthor(author.id); }}
                                className="flex-1 p-2 text-sm font-medium text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-fuchsia-400 uppercase tracking-wider mb-2">Biography</h4>
                                  <p className="text-slate-300 text-sm leading-relaxed">{author.biography}</p>
                                </div>
                                
                                {getMostRecentBook(author.bibliography) && (
                                  <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-2xl p-4">
                                    <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <Star className="w-3 h-3" /> Most Recent Release
                                    </h4>
                                    <div className="space-y-2">
                                      <h5 className="font-bold text-slate-100">{getMostRecentBook(author.bibliography)?.title}</h5>
                                      <p className="text-xs text-slate-400 line-clamp-2">{getMostRecentBook(author.bibliography)?.description}</p>
                                      <div className="pt-2">
                                        <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-500/10 px-2 py-1 rounded">
                                          {getMostRecentBook(author.bibliography)?.releaseDate || getMostRecentBook(author.bibliography)?.year}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2">
                                  <a 
                                    href={`https://www.google.com/search?q=${encodeURIComponent(author.name + ' books bibliography')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-ocean hover:text-ocean/80 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    View full bibliography online
                                  </a>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-fuchsia-400 uppercase tracking-wider mb-3">Bibliography</h4>
                                <div className="grid gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                  
                                  {/* Upcoming Releases */}
                                  {author.bibliography.filter(b => isFutureRelease(b.releaseDate)).length > 0 && (
                                    <div className="space-y-3">
                                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-amber-500/20 pb-2">
                                        <Bell className="w-3 h-3" /> Upcoming Releases
                                      </h5>
                                      {author.bibliography.filter(b => isFutureRelease(b.releaseDate)).map((book, idx) => (
                                        <BookCard key={`upcoming-${idx}`} book={book} author={author} idx={idx} isFuture={true} isNew={false} />
                                      ))}
                                    </div>
                                  )}

                                  {/* Recent Releases */}
                                  {author.bibliography.filter(b => isNewRelease(b.releaseDate) && !isFutureRelease(b.releaseDate)).length > 0 && (
                                    <div className="space-y-3">
                                      <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-500/20 pb-2">
                                        <Star className="w-3 h-3" /> Recent Releases (Last 30 Days)
                                      </h5>
                                      {author.bibliography.filter(b => isNewRelease(b.releaseDate) && !isFutureRelease(b.releaseDate)).map((book, idx) => (
                                        <BookCard key={`recent-${idx}`} book={book} author={author} idx={idx} isFuture={false} isNew={true} />
                                      ))}
                                    </div>
                                  )}

                                  {/* Complete Bibliography */}
                                  <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                                      <Book className="w-3 h-3" /> Complete Bibliography
                                    </h5>
                                    {author.bibliography.filter(b => !isFutureRelease(b.releaseDate) && !isNewRelease(b.releaseDate)).map((book, idx) => (
                                      <BookCard key={`older-${idx}`} book={book} author={author} idx={idx} isFuture={false} isNew={false} />
                                    ))}
                                  </div>

                                </div>
                              </div>
                            </div>
                            
                            {(pulseData[author.id] || loadingPulse === author.id) && (
                              <div className="mt-6 pt-6 border-t border-white/5">
                                <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <Activity className="w-4 h-4" />
                                  Author Pulse
                                </h4>
                                {loadingPulse === author.id ? (
                                  <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                    Deep-researching latest news and releases...
                                  </div>
                                ) : (
                                  <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5 markdown-body text-sm">
                                    <Markdown>{pulseData[author.id]}</Markdown>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
