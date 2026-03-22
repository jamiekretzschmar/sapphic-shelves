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
  { id: 't1', label: 'Coming Out', state: 'neutral', layer: 0 },
  { id: 't2', label: 'Fake relationship', state: 'neutral', layer: 0 },
  { id: 't3', label: 'Contemporary', state: 'neutral', layer: 0 },
  { id: 't4', label: 'Lesbian', state: 'neutral', layer: 0 },
  { id: 't5', label: 'Only One Bed', state: 'neutral', layer: 0 },
  { id: 't6', label: 'Funny/Witty', state: 'neutral', layer: 0 },
  { id: 't7', label: 'Found Family', state: 'neutral', layer: 0 },
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

  const shuffleTags = () => {
    setTropes(prev => [...prev].sort(() => Math.random() - 0.5));
  };

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
      // Updated the prompt on the line below to strictly request contemporary romance
      const res = await searchForNovels("Recommend 10 most popular and highly rated sapphic contemporary romance novels. Focus on books with high visibility and positive reviews.");
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
      addBook({
        title: book.title, author: book.author, status: 'Wishlist',
        tags: [tagId], coverUrl: book.coverUrl, description: book.description,
        genre: book.genre, publicationYear: book.publicationYear
      });
    }
    setSuggestedTags(prev => ({
      ...prev, [bookKey]: { ...prev[bookKey], [category]: prev[bookKey]?.[category]?.filter(t => t !== tagName) || [] }
    }));
  };

  const handleAddBook = (book: DiscoveredBook, status: BookStatus) => {
    const existingBook = findBookInLibrary(book.title, book.author);
    if (existingBook) {
      if (existingBook.status === status) {
        deleteBook(existingBook.id);
      } else {
        updateBook(existingBook.id, { status });
      }
    } else {
      addBook({
        title: book.title, author: book.author, status, tags: [],
        coverUrl: book.coverUrl, description: book.description,
        genre: book.genre, publicationYear: book.publicationYear
      });
    }
  };

  const handleSingleTap = (id: string, isCustom: boolean = false) => {
    const list = isCustom ? customTropes : tropes;
    const setter = isCustom ? setCustomTropes : setTropes;
    setter(list.map(t => {
      if (t.id !== id) return t;
      return { ...t, state: t.state === 'include' ? 'neutral' : 'include' };
    }));
  };

  const handleDoubleTap = (id: string, isCustom: boolean = false) => {
    const list = isCustom ? customTropes : tropes;
    const setter = isCustom ? setCustomTropes : setTropes;
    setter(list.map(t => {
      if (t.id !== id) return t;
      return { ...t, state: 'exclude' };
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
    
    setLoading(true); setResults([]); setError('');
    
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
      <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`${horizontal ? 'w-64 shrink-0' : 'w-full'} glass-panel p-4 flex flex-col gap-3 group relative overflow-hidden`}>
        <BookCover title={book.title} author={book.author} initialCoverUrl={book.coverUrl} className="aspect-[2/3] rounded-xl" />
        {inLibrary && (
          <div className="absolute top-6 right-6 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm shadow-lg flex items-center gap-1 z-10">
            <Check className="w-3 h-3" /> {status}
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{book.title}</h4>
            {book.publicationYear && <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{book.publicationYear}</span>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{book.author}</p>
            <div className="flex items-center gap-1.5">
              {book.rating && <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"><Star className="w-2.5 h-2.5 fill-current" /> {book.rating}</span>}
              {book.genre && <span className="text-[9px] font-bold uppercase tracking-wider text-fuchsia-300 border border-fuchsia-500/30 bg-fuchsia-500/10 px-1.5 py-0.5 rounded">{book.genre}</span>}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-slate-400 line-clamp-3 leading-relaxed">{book.description}</p>
        
        <div className="space-y-2">
          {!suggestions && !isSuggesting && (
            <button onClick={() => handleSuggestTags(book)} className="w-full py-1.5 rounded-lg border border-fuchsia-500/30 text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 hover:bg-fuchsia-500/10 transition-colors flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" /> Suggest Tags
            </button>
          )}
          {isSuggesting && <div className="flex items-center justify-center py-1.5"><Loader2 className="w-4 h-4 text-fuchsia-500 animate-spin" /></div>}
          {suggestions && (
            <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
              {Object.entries(suggestions).map(([category, tags]) => (
                tags.length > 0 && (
                  <div key={category} className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{category}</span>
                    <div className="flex flex-wrap gap-1">
                      {tags.map(tag => (
                        <button key={tag} onClick={() => handleAddTagToBook(book, tag, category)} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-white/5 text-[9px] text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors flex items-center gap-1">
                          <Plus className="w-2.5 h-2.5" /> {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 grid grid-cols-4 gap-1.5">
          <button onClick={() => handleAddBook(book, 'Wishlist')} title="Add to Wishlist" className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Wishlist' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-fuchsia-500/10 hover:text-fuchsia-400'}`}><Plus className="w-4 h-4" /><span className="text-[8px] font-bold uppercase">Wish</span></button>
          <button onClick={() => handleAddBook(book, 'Reading')} title="Mark as Reading" className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Reading' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-blue-500/10 hover:text-blue-400'}`}><BookIcon className="w-4 h-4" /><span className="text-[8px] font-bold uppercase">Reading</span></button>
          <button onClick={() => handleAddBook(book, 'Read')} title="Mark as Read" className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Read' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}><Check className="w-4 h-4" /><span className="text-[8px] font-bold uppercase">Finished</span></button>
          <button onClick={() => handleAddBook(book, 'Ignored')} title="Ignore this book" className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${status === 'Ignored' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'}`}><X className="w-4 h-4" /><span className="text-[8px] font-bold uppercase">Hide</span></button>
        </div>
      </motion.div>
    );
  };
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <motion.div layout className="text-center space-y-4" animate={{ marginTop: results.length > 0 ? '0' : '10vh', marginBottom: results.length > 0 ? '2rem' : '3rem' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}>
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
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. 'Upcoming sci-fi sapphic novels'" className="w-full bg-transparent py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none text-base font-medium" />
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`mr-2 p-2 rounded-full transition-colors ${showFilters ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-slate-400 hover:text-slate-200'}`}><Filter className="w-5 h-5" /></button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 pt-4 px-4 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Release Date</label>
                    <div className="flex gap-2">
                      {(['all', 'upcoming', 'this-year'] as const).map((f) => (
                        <button key={f} type="button" onClick={() => setReleaseFilter(f)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${releaseFilter === f ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' : 'bg-slate-900 text-slate-400 border-white/10 hover:border-fuchsia-500/30'}`}>
                          {f === 'all' ? 'All Time' : f === 'upcoming' ? 'Upcoming' : 'This Year'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Star className="w-3 h-3" /> Minimum Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setMinRating(star === minRating ? 0 : star)} className={`p-1.5 transition-colors ${star <= minRating ? 'text-amber-500' : 'text-slate-700'}`}><Star className={`w-5 h-5 ${star <= minRating ? 'fill-current' : ''}`} /></button>
                      ))}
                      {minRating > 0 && <span className="text-xs font-bold text-slate-500 ml-2">{minRating}+ Stars</span>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Plus className="w-3 h-3" /> Author Name</label>
                    <input type="text" placeholder="Filter by author..." value={authorSearch} onChange={e => setAuthorSearch(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500/50 text-sm" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Year Range</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="From" value={yearFrom} onChange={e => setYearFrom(e.target.value)} className="w-1/2 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500/50 text-sm" />
                      <span className="text-slate-600">—</span>
                      <input type="number" placeholder="To" value={yearTo} onChange={e => setYearTo(e.target.value)} className="w-1/2 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500/50 text-sm" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* New Explore Tags Section */}
          <div className="px-4 pb-4 space-y-6 bg-slate-950 border border-slate-800 rounded-3xl pt-6 mt-4">
            
            {/* Explore Tags */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Explore Tags</span>
                <button 
                  type="button"
                  onClick={shuffleTags}
                  className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-fuchsia-400 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Shuffle
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tropes.filter(t => !hiddenTropes.includes(t.id)).map(trope => (
                  <button
                    key={trope.id}
                    type="button"
                    onClick={() => handleSingleTap(trope.id)}
                    onDoubleClick={() => handleDoubleTap(trope.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all select-none border ${
                      trope.state === 'include' 
                        ? 'bg-emerald-400/20 text-emerald-500 border-emerald-400/50' 
                        : trope.state === 'exclude' 
                        ? 'bg-rose-400/20 text-rose-500 border-rose-400/50' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    {trope.state === 'exclude' ? '- ' : ''}{trope.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Your Favorites & Added Tags */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Star className="w-3 h-3" /> Your Favorites & Added Tags
              </span>
              
              <div className="flex flex-wrap gap-2">
                {customTropes.map(trope => (
                  <button
                    key={trope.id}
                    type="button"
                    onClick={() => handleSingleTap(trope.id, true)}
                    onDoubleClick={() => handleDoubleTap(trope.id, true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all select-none border ${
                      trope.state === 'include' 
                        ? 'bg-emerald-400/20 text-emerald-500 border-emerald-400/50' 
                        : 'bg-rose-400/20 text-rose-500 border-rose-400/50'
                    }`}
                  >
                    {trope.state === 'exclude' ? '- ' : ''}{trope.label}
                  </button>
                ))}
                
                {customTropes.length === 0 && (
                   <span className="text-[10px] text-slate-500 italic px-2 py-2">No custom tags added yet.</span>
                )}
              </div>
              
              <p className="text-center text-[10px] text-slate-500 italic pt-2 pb-2">
                Tap to include (+), double tap to exclude (-).
              </p>
            </div>

            {/* Custom Trope Input */}
            <div className="flex items-center gap-2 mt-2">
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
                placeholder="Add a custom tag (e.g. Space Opera)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-full py-2.5 pl-4 pr-4 text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-400 transition-all text-sm shadow-sm"
              />
              <button
                type="button"
                onClick={addCustomTrope}
                disabled={!newTrope.trim()}
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-full text-slate-500 hover:text-fuchsia-400 hover:border-fuchsia-400 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!query.trim() && tropes.filter(t => t.state !== 'neutral').length === 0 && releaseFilter === 'all' && minRating === 0)}
            className="w-full bg-fuchsia-400 hover:bg-fuchsia-500 active:scale-[0.98] text-white px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md mt-6 border border-fuchsia-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Sparkles className="w-5 h-5" /> Get Book Recommendations </>}
          </button>
        </div>
      </motion.form>

          
      {error && <p className="text-rose-400 text-sm mt-4 text-center">{error}</p>}

      {filteredResults.length === 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Popular Discoveries
            </h3>
            <button onClick={fetchPopular} className="text-xs text-fuchsia-500 hover:text-fuchsia-400 transition-colors">Refresh</button>
          </div>
          <div className="w-full overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
            <div className="flex gap-4 w-max">
              {loadingPopular ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="w-64 h-96 rounded-[2rem] bg-slate-200 dark:bg-slate-900/50 animate-pulse border border-white/5" />)
              ) : (
                filteredPopular.map((book, i) => <BookCard key={i} book={book} horizontal />)
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
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-fuchsia-500/50">
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="year">Year</option>
                  <option value="rating">Rating</option>
                </select>
                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-1.5 bg-slate-900 border border-white/10 rounded-lg text-slate-400 hover:text-slate-200 hover:border-fuchsia-500/30 transition-colors">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              <button onClick={() => setResults([])} className="text-xs text-slate-500 hover:text-slate-300 ml-2">Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sortedResults.map((book, i) => <BookCard key={i} book={book} />)}
          </div>
        </div>
      )}
    </div>
  );
}
