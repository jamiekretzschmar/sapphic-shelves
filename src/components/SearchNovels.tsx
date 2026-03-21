import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Sparkles, Plus, Check, X, Book as BookIcon, Filter, Calendar, Star, Eye, EyeOff, Trash2, Tag as TagIcon, Clock, RefreshCw } from 'lucide-react';
import { searchForNovels, suggestBookTags, DiscoveredBook, QuotaExceededError } from '../services/gemini';
import { useLibrary, BookStatus, TagCategory } from '../context/LibraryContext';
import { motion, AnimatePresence } from 'framer-motion';
import BookCover from './BookCover';

type TropeState = 'neutral' | 'include' | 'exclude';
interface Trope {
  id: string;
  label: string;
  state: TropeState;
  layer: number;
}

const DEFAULT_TROPES: Trope[] = [
  // Layer 0: Genre
  { id: 'g1', label: 'Fantasy', state: 'neutral', layer: 0 },
  { id: 'g2', label: 'Sci-Fi', state: 'neutral', layer: 0 },
  { id: 'g3', label: 'Contemporary', state: 'neutral', layer: 0 },
  { id: 'g4', label: 'Historical', state: 'neutral', layer: 0 },
  { id: 'g5', label: 'Mystery', state: 'neutral', layer: 0 },
  { id: 'g6', label: 'Romance', state: 'neutral', layer: 0 },
  
  // Layer 1: Trope
  { id: 't1', label: 'Enemies to Lovers', state: 'neutral', layer: 1 },
  { id: 't2', label: 'Fake Dating', state: 'neutral', layer: 1 },
  { id: 't3', label: 'Found Family', state: 'neutral', layer: 1 },
  { id: 't4', label: 'Slow Burn', state: 'neutral', layer: 1 },
  { id: 't5', label: 'Grumpy/Sunshine', state: 'neutral', layer: 1 },
  { id: 't6', label: 'Forced Proximity', state: 'neutral', layer: 1 },

  // Layer 2: Setting
  { id: 's1', label: 'Small Town', state: 'neutral', layer: 2 },
  { id: 's2', label: 'Space', state: 'neutral', layer: 2 },
  { id: 's3', label: 'High Fantasy', state: 'neutral', layer: 2 },
  { id: 's4', label: 'Urban', state: 'neutral', layer: 2 },
  { id: 's5', label: 'Academic', state: 'neutral', layer: 2 },
  { id: 's6', label: 'Royal', state: 'neutral', layer: 2 },

  // Layer 3: Vibe
  { id: 'v1', label: 'Cozy', state: 'neutral', layer: 3 },
  { id: 'v2', label: 'Angsty', state: 'neutral', layer: 3 },
  { id: 'v3', label: 'Spicy', state: 'neutral', layer: 3 },
  { id: 'v4', label: 'Fluffy', state: 'neutral', layer: 3 },
  { id: 'v5', label: 'Dark', state: 'neutral', layer: 3 },
  { id: 'v6', label: 'Whimsical', state: 'neutral', layer: 3 },
];

export default function SearchNovels() {
  const { addBook, updateBook, deleteBook, books, addTask, updateTask, addTag, markTagUsed, tags } = useLibrary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscoveredBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<Record<string, Record<string, string[]>>>({});
  const [isSuggestingTags, setIsSuggestingTags] = useState<Record<string, boolean>>({});
  
  const [hiddenTropes, setHiddenTropes] = useState<string[]>(() => {
    const saved = localStorage.getItem('sapphic-shelves-hidden-tropes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customTropes, setCustomTropes] = useState<Trope[]>(() => {
    const saved = localStorage.getItem('sapphic-shelves-custom-tropes');
    return saved ? JSON.parse(saved) : [];
  });

  const [tropes, setTropes] = useState<Trope[]>(DEFAULT_TROPES);
  
  useEffect(() => {
    localStorage.setItem('sapphic-shelves-hidden-tropes', JSON.stringify(hiddenTropes));
  }, [hiddenTropes]);

  useEffect(() => {
    localStorage.setItem('sapphic-shelves-custom-tropes', JSON.stringify(customTropes));
  }, [customTropes]);

  const [newTrope, setNewTrope] = useState('');
  const [popularBooks, setPopularBooks] = useState<DiscoveredBook[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [manageTags, setManageTags] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year' | 'rating'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // New filters
  const [releaseFilter, setReleaseFilter] = useState<'all' | 'upcoming' | 'this-year'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [authorSearch, setAuthorSearch] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  
  // Helper to find a book in the library
  const findBookInLibrary = (title: string, author: string) => {
    return books.find(b => 
      (b.title?.toLowerCase() || '') === (title?.toLowerCase() || '') && 
      (b.author?.toLowerCase() || '') === (author?.toLowerCase() || '')
    );
  };

  // Filter out books that are already in the library with a status
  const getBookStatusInLibrary = (title: string, author: string): BookStatus | null => {
    const book = findBookInLibrary(title, author);
    return book ? book.status : null;
  };

  const filteredPopular = useMemo(() => popularBooks.filter(b => getBookStatusInLibrary(b.title, b.author) !== 'Ignored'), [popularBooks, books]);
  const filteredResults = useMemo(() => results.filter(b => getBookStatusInLibrary(b.title, b.author) !== 'Ignored'), [results, books]);

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'year':
          comparison = (a.publicationYear || 0) - (b.publicationYear || 0);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredResults, sortBy, sortOrder]);

  useEffect(() => {
    fetchPopular();
  }, []);

  const fetchPopular = async () => {
    if (loadingPopular) return;
    setLoadingPopular(true);
    
    const taskId = addTask({
      name: "Fetching Popular Discoveries",
      status: 'processing',
      progress: 10
    });

    try {
      updateTask(taskId, { progress: 30 });
      const res = await searchForNovels("Recommend 10 most popular and highly rated sapphic novels of all time across different genres. Focus on books with high visibility and positive reviews.");
      setPopularBooks(res);
      updateTask(taskId, { status: 'completed', progress: 100 });
    } catch (err) {
      console.error("Failed to fetch popular books", err);
      if (err instanceof QuotaExceededError) {
        updateTask(taskId, { status: 'failed', name: 'Quota Exceeded', progress: 100 });
      } else {
        updateTask(taskId, { status: 'failed', progress: 100 });
      }
    } finally {
      setLoadingPopular(false);
    }
  };

  const clearAllTags = () => {
    setTropes(DEFAULT_TROPES);
    setQuery('');
    setReleaseFilter('all');
    setMinRating(0);
    setAuthorSearch('');
    setYearFrom('');
    setYearTo('');
  };

  const handleSuggestTags = async (book: DiscoveredBook) => {
    const bookKey = `${book.title}-${book.author}`;
    setIsSuggestingTags(prev => ({ ...prev, [bookKey]: true }));
    try {
      const suggestions = await suggestBookTags(book.title, book.author, book.description);
      setSuggestedTags(prev => ({ ...prev, [bookKey]: suggestions }));
    } catch (err) {
      console.error("Failed to suggest tags", err);
    } finally {
      setIsSuggestingTags(prev => ({ ...prev, [bookKey]: false }));
    }
  };

  const handleAddTagToBook = (book: DiscoveredBook, tagName: string, category: string) => {
    const bookKey = `${book.title}-${book.author}`;
    const tagId = addTag(tagName, category as TagCategory);
    markTagUsed(tagId);
    
    const existingBook = findBookInLibrary(book.title, book.author);
    if (existingBook) {
      if (!existingBook.tags.includes(tagId)) {
        updateBook(existingBook.id, { tags: [...existingBook.tags, tagId] });
      }
    } else {
      // Add book to library first if it doesn't exist
      addBook({
        title: book.title,
        author: book.author,
        status: 'Wishlist',
        tags: [tagId],
        coverUrl: book.coverUrl,
        description: book.description,
        genre: book.genre,
        publicationYear: book.publicationYear
      });
    }

    // Remove from suggestions
    setSuggestedTags(prev => ({
      ...prev,
      [bookKey]: {
        ...prev[bookKey],
        [category]: prev[bookKey]?.[category]?.filter(t => t !== tagName) || []
      }
    }));
  };

  const handleAddBook = (book: DiscoveredBook, status: BookStatus) => {
    const existingBook = findBookInLibrary(book.title, book.author);
    
    if (existingBook) {
      if (existingBook.status === status) {
        // Toggle off: remove from library
        deleteBook(existingBook.id);
      } else {
        // Change status
        updateBook(existingBook.id, { status });
      }
    } else {
      addBook({
        title: book.title,
        author: book.author,
        status,
        tags: [],
        coverUrl: book.coverUrl,
        description: book.description,
        genre: book.genre,
        publicationYear: book.publicationYear
      });
    }
  };

  const toggleTrope = (id: string, isCustom: boolean = false) => {
    const list = isCustom ? customTropes : tropes;
    const setter = isCustom ? setCustomTropes : setTropes;
    
    setter(list.map(t => {
      if (t.id !== id) return t;
      if (t.state === 'neutral') return { ...t, state: 'include' };
      if (t.state === 'include') return { ...t, state: 'exclude' };
      return { ...t, state: 'neutral' };
    }));
  };

  const hideTrope = (id: string) => {
    setHiddenTropes(prev => [...prev, id]);
  };

  const removeCustomTrope = (id: string) => {
    setCustomTropes(prev => prev.filter(t => t.id !== id));
  };

  const addCustomTrope = () => {
    if (!newTrope.trim()) return;
    const id = Date.now().toString();
    setCustomTropes([{ id, label: newTrope.trim(), state: 'include', layer: 4 }, ...customTropes]);
    setNewTrope('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const includes = tropes.filter(t => t.state === 'include').map(t => t.label);
    const excludes = tropes.filter(t => t.state === 'exclude').map(t => t.label);
    
    if (!query.trim() && includes.length === 0 && excludes.length === 0 && releaseFilter === 'all' && minRating === 0 && !authorSearch && !yearFrom && !yearTo) return;
    
    setLoading(true);
    setResults([]);
    setError('');
    
    let finalQuery = query.trim() ? `Base search: ${query}\n` : 'Recommend sapphic novels.\n';
    if (authorSearch) finalQuery += `Filter by AUTHOR: ${authorSearch}\n`;
    if (yearFrom || yearTo) finalQuery += `Filter by PUBLICATION YEAR: ${yearFrom || 'any'} to ${yearTo || 'any'}\n`;
    if (includes.length > 0) finalQuery += `MUST INCLUDE these tropes/themes: ${includes.join(', ')}\n`;
    if (excludes.length > 0) finalQuery += `MUST EXCLUDE these tropes/themes: ${excludes.join(', ')}\n`;
    if (releaseFilter === 'upcoming') finalQuery += `Focus on upcoming releases.\n`;
    if (releaseFilter === 'this-year') finalQuery += `Focus on books published in ${new Date().getFullYear()}.\n`;
    if (minRating > 0) finalQuery += `Only recommend books with a rating of at least ${minRating} stars.\n`;
    
    try {
      const res = await searchForNovels(finalQuery);
      setResults(res);
    } catch (err) {
      console.error("Search failed", err);
      if (err instanceof QuotaExceededError) {
        setError('API Limit Reached. Please try again later.');
      } else {
        setError('Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const BookCard = ({ book, horizontal = false }: { book: DiscoveredBook, horizontal?: boolean }) => {
    const status = getBookStatusInLibrary(book.title, book.author);
    const inLibrary = !!status;
    
    const bookKey = `${book.title}-${book.author}`;
    const suggestions = suggestedTags[bookKey];
    const isSuggesting = isSuggestingTags[bookKey];

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${horizontal ? 'w-64 shrink-0' : 'w-full'} glass-panel p-4 flex flex-col gap-3 group relative overflow-hidden`}
      >
        <BookCover 
          title={book.title} 
          author={book.author} 
          initialCoverUrl={book.coverUrl} 
          className="aspect-[2/3] rounded-xl"
        />
        {inLibrary && (
          <div className="absolute top-6 right-6 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm shadow-lg flex items-center gap-1 z-10">
            <Check className="w-3 h-3" /> {status}
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{book.title}</h4>
            {book.publicationYear && (
              <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                {book.publicationYear}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{book.author}</p>
            <div className="flex items-center gap-1.5">
              {book.rating && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-2.5 h-2.5 fill-current" /> {book.rating}
                </span>
              )}
              {book.genre && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-fuchsia-300 border border-fuchsia-500/30 bg-fuchsia-500/10 px-1.5 py-0.5 rounded">
                  {book.genre}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-slate-400 line-clamp-3 leading-relaxed">{book.description}</p>
        
        {/* Suggested Tags */}
        <div className="space-y-2">
          {!suggestions && !isSuggesting && (
            <button
              onClick={() => handleSuggestTags(book)}
              className="w-full py-1.5 rounded-lg border border-fuchsia-500/30 text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 hover:bg-fuchsia-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3 h-3" />
              Suggest Tags
            </button>
          )}

          {isSuggesting && (
            <div className="flex items-center justify-center py-1.5">
              <Loader2 className="w-4 h-4 text-fuchsia-500 animate-spin" />
            </div>
          )}

          {suggestions && (
            <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
              {Object.entries(suggestions).map(([category, tags]) => (
                tags.length > 0 && (
                  <div key={category} className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{category}</span>
                    <div className="flex flex-wrap gap-1">
                      {tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleAddTagToBook(book, tag, category)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-white/5 text-[9px] text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-auto pt-2 grid grid-cols-4 gap-1.5">
          <button
            onClick={() => handleAddBook(book, 'Wishlist')}
            title="Add to Wishlist"
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Wishlist' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-fuchsia-500/10 hover:text-fuchsia-400'}`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase">Wish</span>
          </button>
          <button
            onClick={() => handleAddBook(book, 'Reading')}
            title="Mark as Reading"
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Reading' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-blue-500/10 hover:text-blue-400'}`}
          >
            <BookIcon className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase">Reading</span>
          </button>
          <button
            onClick={() => handleAddBook(book, 'Read')}
            title="Mark as Read"
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Read' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
          >
            <Check className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase">Finished</span>
          </button>
          <button
            onClick={() => handleAddBook(book, 'Ignored')}
            title="Ignore this book"
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Ignored' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'}`}
          >
            <X className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase">Hide</span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <motion.div 
        layout
        className="text-center space-y-4"
        animate={{ marginTop: results.length > 0 ? '0' : '10vh', marginBottom: results.length > 0 ? '2rem' : '3rem' }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 mb-4 shadow-[0_0_40px_rgba(217,70,239,0.15)]">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-gradient">Discover New Novels</h2>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Use AI with live search to find upcoming sapphic releases, specific tropes, or recommendations based on your favorite books.
        </p>
      </motion.div>

      <motion.form layout onSubmit={handleSearch} className="relative group z-20 w-full space-y-6">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/30 to-purple-500/30 rounded-[2rem] blur-2xl transition-all duration-500 group-hover:blur-3xl opacity-40"></div>
        <div className="relative flex flex-col gap-3 glass-panel rounded-[2rem] p-2 focus-within:border-fuchsia-500/50 focus-within:ring-2 focus-within:ring-fuchsia-500/20 transition-all duration-300">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-4 w-6 h-6 text-fuchsia-400/70" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'Upcoming sci-fi sapphic novels'"
              className="w-full bg-transparent py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none text-base font-medium"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`mr-2 p-2 rounded-full transition-colors ${showFilters ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/10 pt-4 px-4 pb-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Release Date
                    </label>
                    <div className="flex gap-2">
                      {(['all', 'upcoming', 'this-year'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setReleaseFilter(f)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                            releaseFilter === f 
                              ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' 
                              : 'bg-slate-900 text-slate-400 border-white/10 hover:border-fuchsia-500/30'
                          }`}
                        >
                          {f === 'all' ? 'All Time' : f === 'upcoming' ? 'Upcoming' : 'This Year'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Star className="w-3 h-3" /> Minimum Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMinRating(star === minRating ? 0 : star)}
                          className={`p-1.5 transition-colors ${star <= minRating ? 'text-amber-500' : 'text-slate-700'}`}
                        >
                          <Star className={`w-5 h-5 ${star <= minRating ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                      {minRating > 0 && (
                        <span className="text-xs font-bold text-slate-500 ml-2">{minRating}+ Stars</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Plus className="w-3 h-3" /> Author Name
                    </label>
                    <input 
                      type="text"
                      placeholder="Filter by author..."
                      value={authorSearch}
                      onChange={e => setAuthorSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500/50 text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Year Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        placeholder="From"
                        value={yearFrom}
                        onChange={e => setYearFrom(e.target.value)}
                        className="w-1/2 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500/50 text-sm"
                      />
                      <span className="text-slate-600">—</span>
                      <input 
                        type="number"
                        placeholder="To"
                        value={yearTo}
                        onChange={e => setYearTo(e.target.value)}
                        className="w-1/2 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500/50 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Trope Toolbar - 4 Layers */}
          <div className="px-2 pb-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter Tags</span>
              <button 
                type="button"
                onClick={() => setManageTags(!manageTags)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all border ${manageTags ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'text-slate-500 hover:text-slate-400 border-transparent hover:border-slate-700'}`}
              >
                {manageTags ? 'Done Managing' : 'Manage Tags'}
              </button>
            </div>

            {[0, 1, 2, 3].map(layerIdx => {
              const layerLabels = ['Genres', 'Tropes', 'Settings', 'Vibes'];
              const layerTropes = tropes.filter(t => t.layer === layerIdx && !hiddenTropes.includes(t.id));
              
              if (layerTropes.length === 0) return null;

              return (
                <div key={layerIdx} className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 flex justify-between items-center">
                    <span>{layerLabels[layerIdx]}</span>
                    {layerIdx === 0 && (
                      <button 
                        type="button"
                        onClick={clearAllTags}
                        className="text-fuchsia-500 hover:text-fuchsia-400 transition-colors normal-case font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="w-full overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
                    <div className="flex items-center gap-2 w-max">
                      {layerTropes.map(trope => (
                        <div key={trope.id} className="relative group/tag">
                          <button
                            type="button"
                            onClick={() => toggleTrope(trope.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 active:scale-95 border ${
                              trope.state === 'include' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' :
                              trope.state === 'exclude' ? 'bg-rose-500/20 text-rose-600 border-rose-500/30' :
                              'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-white/10 hover:border-fuchsia-500/30'
                            }`}
                          >
                            {trope.state === 'include' && <Check className="w-3 h-3" />}
                            {trope.state === 'exclude' && <X className="w-3 h-3" />}
                            {trope.label}
                          </button>
                          {manageTags && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); hideTrope(trope.id); }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center border border-white/20 hover:bg-rose-500 transition-colors shadow-lg"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom Tropes Section */}
            {(customTropes.length > 0 || manageTags) && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 flex justify-between items-center">
                  <span>Your Tags</span>
                </div>
                <div className="w-full overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
                  <div className="flex items-center gap-2 w-max">
                    {customTropes.map(trope => (
                      <div key={trope.id} className="relative group/tag">
                        <button
                          type="button"
                          onClick={() => toggleTrope(trope.id, true)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 active:scale-95 border ${
                            trope.state === 'include' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' :
                            trope.state === 'exclude' ? 'bg-rose-500/20 text-rose-600 border-rose-500/30' :
                            'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-white/10 hover:border-fuchsia-500/30'
                          }`}
                        >
                          {trope.state === 'include' && <Check className="w-3 h-3" />}
                          {trope.state === 'exclude' && <X className="w-3 h-3" />}
                          {trope.label}
                        </button>
                        {manageTags && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeCustomTrope(trope.id); }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center border border-white/20 hover:bg-rose-500 transition-colors shadow-lg"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {customTropes.length === 0 && (
                      <span className="text-[10px] text-slate-500 italic px-2">No custom tags added yet.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Trope Input */}
            <div className="flex items-center gap-2 mt-2 px-2">
              <input
                type="text"
                value={newTrope}
                onChange={(e) => setNewTrope(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTrope();
                  }
                }}
                placeholder="Add custom trope or keyword..."
                className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-4 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all shadow-inner text-sm"
              />
              <button
                type="button"
                onClick={addCustomTrope}
                disabled={!newTrope.trim()}
                className="glass-neo p-2.5 rounded-xl text-fuchsia-400 hover:text-fuchsia-300 disabled:opacity-50 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!query.trim() && tropes.filter(t => t.state !== 'neutral').length === 0 && releaseFilter === 'all' && minRating === 0)}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 active:scale-[0.98] text-white px-6 py-4 rounded-3xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-fuchsia-500/25"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>
      </motion.form>
      {error && <p className="text-rose-400 text-sm mt-4 text-center">{error}</p>}

      {/* Popular Section */}
      {filteredResults.length === 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Popular Discoveries
            </h3>
            <button onClick={fetchPopular} className="text-xs text-fuchsia-500 hover:text-fuchsia-400 transition-colors">Refresh</button>
          </div>
          
          <div className="w-full overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
            <div className="flex gap-4 w-max">
              {loadingPopular ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-64 h-96 rounded-[2rem] bg-slate-200 dark:bg-slate-900/50 animate-pulse border border-white/5" />
                ))
              ) : (
                filteredPopular.map((book, i) => (
                  <BookCard key={i} book={book} horizontal />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {sortedResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Search Results</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-fuchsia-500/50"
                >
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="year">Year</option>
                  <option value="rating">Rating</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 bg-slate-900 border border-white/10 rounded-lg text-slate-400 hover:text-slate-200 hover:border-fuchsia-500/30 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              <button onClick={() => setResults([])} className="text-xs text-slate-500 hover:text-slate-300 ml-2">Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sortedResults.map((book, i) => (
              <BookCard key={i} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
