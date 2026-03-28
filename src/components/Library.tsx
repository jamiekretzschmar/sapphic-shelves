import React, { useState, useMemo } from 'react';
import LogoLoader from './LogoLoader';
import { Book as BookIcon, Search, Filter, MoreVertical, Trash2, Edit3, Image as ImageIcon, CheckSquare, Square, ChevronDown, ChevronUp, Star, ExternalLink, BookOpen, Bookmark, XCircle, Sparkles, UserPlus, Check, SortAsc, RotateCcw, MinusCircle, Calendar, Tag as TagIcon, Type, Plus, Loader2 } from 'lucide-react';
import { useLibrary, BookStatus } from '../context/LibraryContext';
import { enrichBookData, suggestBookTags, searchForAuthor, generateBookCover } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import BookCover from './BookCover';

type SortOption = 'title' | 'author' | 'rating' | 'dateAdded' | 'status';

export default function Library() {
  const { books, tags, updateBook, bulkUpdateStatus, bulkDeleteBooks, addTask, updateTask, addBook, addTag, markTagUsed, authors, addAuthor } = useLibrary();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'All'>('All');
  const [includedTags, setIncludedTags] = useState<Set<string>>(new Set());
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set());
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newBook, setNewBook] = useState({ title: '', author: '' });
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<Record<string, Record<string, string[]>>>({});
  const [isSuggestingTags, setIsSuggestingTags] = useState<Record<string, boolean>>({});
  const [isGeneratingCover, setIsGeneratingCover] = useState<Record<string, boolean>>({});
  const [addingAuthor, setAddingAuthor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Advanced Filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [genreFilter, setGenreFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const filteredBooks = useMemo(() => {
    let result = books.filter(b => {
      // Basic Search (Title or Author)
      const matchesSearch = !search || 
        (b.title?.toLowerCase() || '').includes(search.toLowerCase()) || 
        (b.author?.toLowerCase() || '').includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      
      // Tag filtering
      const hasIncludedTags = includedTags.size === 0 || Array.from(includedTags).every(tId => b.tags.includes(tId));
      const hasExcludedTags = Array.from(excludedTags).some(tId => b.tags.includes(tId));
      
      // Advanced Filters
      const matchesGenre = !genreFilter || (b.genre?.toLowerCase() || '').includes(genreFilter.toLowerCase());
      const matchesAuthor = !authorFilter || (b.author?.toLowerCase() || '').includes(authorFilter.toLowerCase());
      
      const year = b.publicationYear || 0;
      const matchesYearStart = !yearStart || year >= parseInt(yearStart);
      const matchesYearEnd = !yearEnd || year <= parseInt(yearEnd);
      
      const matchesKeywords = !keywordFilter || 
        (b.title?.toLowerCase() || '').includes(keywordFilter.toLowerCase()) || 
        (b.description?.toLowerCase() || '').includes(keywordFilter.toLowerCase());
      
      return matchesSearch && matchesStatus && hasIncludedTags && !hasExcludedTags && 
             matchesGenre && matchesAuthor && matchesYearStart && matchesYearEnd && matchesKeywords;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'dateAdded':
          comparison = (a.id || '').localeCompare(b.id || ''); // Using ID as proxy for date added if not available
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [books, search, statusFilter, includedTags, excludedTags, sortBy, sortOrder, genreFilter, authorFilter, yearStart, yearEnd, keywordFilter]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setIncludedTags(new Set());
    setExcludedTags(new Set());
    setGenreFilter('');
    setAuthorFilter('');
    setYearStart('');
    setYearEnd('');
    setKeywordFilter('');
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedBooks);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedBooks(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedBooks.size === filteredBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(filteredBooks.map(b => b.id)));
    }
  };

  const handleBulkStatus = (status: BookStatus) => {
    bulkUpdateStatus(Array.from(selectedBooks), status);
    setSelectedBooks(new Set());
  };

  const handleBulkDelete = () => {
    // In a real app, use a custom modal instead of window.confirm
    if (window.confirm('Are you sure you want to delete selected books?')) {
      bulkDeleteBooks(Array.from(selectedBooks));
      setSelectedBooks(new Set());
    }
  };

  const handleBulkEnrich = async () => {
    const idsToEnrich = Array.from(selectedBooks);
    if (idsToEnrich.length === 0) return;

    const taskId = addTask({
      name: `Enriching ${idsToEnrich.length} books`,
      status: 'processing',
      progress: 0
    });

    setSelectedBooks(new Set());

    for (let i = 0; i < idsToEnrich.length; i++) {
      const id = idsToEnrich[i];
      const book = books.find(b => b.id === id);
      if (book) {
        try {
          const data = await enrichBookData(book.title, book.author);
          updateBook(id, data);
        } catch (e) {
          console.error("Failed to enrich", book.title);
        }
      }
      updateTask(taskId, { progress: Math.round(((i + 1) / idsToEnrich.length) * 100) });
    }

    updateTask(taskId, { status: 'completed' });
  };

  const handleEnrichSingle = async (e: React.MouseEvent, id: string, title: string, author: string) => {
    e.stopPropagation();
    const taskId = addTask({
      name: `Enriching ${title}`,
      status: 'processing',
      progress: 50
    });

    try {
      const data = await enrichBookData(title, author);
      updateBook(id, data);
    } catch (err) {
      console.error("Failed to enrich", title);
    }
    updateTask(taskId, { status: 'completed', progress: 100 });
  };

  const handleGenerateCover = async (e: React.MouseEvent, id: string, title: string, author: string) => {
    e.stopPropagation();
    setIsGeneratingCover(prev => ({ ...prev, [id]: true }));
    const taskId = addTask({
      name: `Generating cover for ${title}`,
      status: 'processing',
      progress: 50
    });

    try {
      const coverUrl = await generateBookCover(title, author);
      if (coverUrl) {
        updateBook(id, { coverUrl });
      }
    } catch (err) {
      console.error("Failed to generate cover", err);
    } finally {
      setIsGeneratingCover(prev => ({ ...prev, [id]: false }));
      updateTask(taskId, { status: 'completed', progress: 100 });
    }
  };

  const handleSuggestTags = async (e: React.MouseEvent, id: string, title: string, author: string, description?: string) => {
    e.stopPropagation();
    setIsSuggestingTags(prev => ({ ...prev, [id]: true }));
    try {
      const suggestions = await suggestBookTags(title, author, description);
      setSuggestedTags(prev => ({ ...prev, [id]: suggestions }));
    } catch (err) {
      console.error("Failed to suggest tags", err);
    } finally {
      setIsSuggestingTags(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleAddAuthor = async (e: React.MouseEvent, authorName: string) => {
    e.stopPropagation();
    if (authors.some(a => (a.name?.toLowerCase() || '') === (authorName?.toLowerCase() || ''))) return;
    
    setAddingAuthor(authorName);
    try {
      const authorData = await searchForAuthor(authorName);
      if (authorData) {
        addAuthor(authorData);
      }
    } catch (err) {
      console.error("Failed to add author", err);
    } finally {
      setAddingAuthor(null);
    }
  };

  const handleAddTagToBook = (bookId: string, tagName: string, category: string) => {
    const tagId = addTag(tagName, category as any);
    markTagUsed(tagId);
    const book = books.find(b => b.id === bookId);
    if (book && !book.tags.includes(tagId)) {
      updateBook(bookId, { tags: [...book.tags, tagId] });
    }
    // Remove from suggestions
    setSuggestedTags(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        [category]: prev[bookId]?.[category]?.filter(t => t !== tagName) || []
      }
    }));
  };

  const handleAddExistingTag = (bookId: string, tagId: string) => {
    if (!tagId) return;
    const book = books.find(b => b.id === bookId);
    if (book && !book.tags.includes(tagId)) {
      markTagUsed(tagId);
      updateBook(bookId, { tags: [...book.tags, tagId] });
    }
  };

  const handleBlockSuggestedTag = (bookId: string, tagName: string, category: string) => {
    setSuggestedTags(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        [category]: prev[bookId]?.[category]?.filter(t => t !== tagName) || []
      }
    }));
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;
    setAddError(null);
    
    const result = addBook({
      title: newBook.title,
      author: newBook.author,
      status: 'Wishlist',
      tags: []
    });
    
    if (!result.success) {
      setAddError(result.message || 'Failed to add book');
      return;
    }
    
    setNewBook({ title: '', author: '' });
    setIsAdding(false);
  };

  const handleExpand = (id: string) => {
    setExpandedBook(expandedBook === id ? null : id);
  };

  const handleRating = (e: React.MouseEvent, id: string, rating: number) => {
    e.stopPropagation();
    updateBook(id, { rating });
  };

  const handleStatusChange = (e: React.MouseEvent, id: string, status: BookStatus) => {
    e.stopPropagation();
    updateBook(id, { status });
  };

  const getStoreLinks = (title: string, author: string) => {
    const query = encodeURIComponent(`${title} ${author}`);
    return {
      kindle: `https://www.amazon.com/s?k=${query}&i=digital-text`,
      playStore: `https://play.google.com/store/search?q=${query}&c=books`
    };
  };

  const toggleTagFilter = (tagId: string) => {
    const isIncluded = includedTags.has(tagId);
    const isExcluded = excludedTags.has(tagId);

    if (isIncluded) {
      // Switch to excluded
      const newInc = new Set(includedTags);
      newInc.delete(tagId);
      setIncludedTags(newInc);
      
      const newExc = new Set(excludedTags);
      newExc.add(tagId);
      setExcludedTags(newExc);
    } else if (isExcluded) {
      // Switch to neutral
      const newExc = new Set(excludedTags);
      newExc.delete(tagId);
      setExcludedTags(newExc);
    } else {
      // Switch to included
      const newInc = new Set(includedTags);
      newInc.add(tagId);
      setIncludedTags(newInc);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-earth-900 dark:text-earth-50 flex items-center gap-2">
          <BookIcon className="w-6 h-6 text-mustard-600 dark:text-mustard-400" />
          My Library
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={clearFilters}
            className="bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Clear Filters
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-mustard-600 hover:bg-mustard-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {isAdding ? 'Cancel' : 'Add Book'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bento-card flex flex-col gap-3 overflow-hidden"
          >
            <form onSubmit={handleAddBook} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Title" 
                value={newBook.title}
                onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                className="flex-1 bg-white dark:bg-earth-900/50 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
              />
              <input 
                type="text" 
                placeholder="Author" 
                value={newBook.author}
                onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                className="flex-1 bg-white dark:bg-earth-900/50 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
              />
              <button type="submit" className="bg-sage-600 hover:bg-sage-500 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                Save
              </button>
            </form>
            {addError && (
              <p className="text-red-600 dark:text-red-400 text-sm font-medium px-2">{addError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500" />
          <input
            type="text"
            placeholder="Quick search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl py-2 pl-10 pr-4 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
          />
        </div>
        <div className="flex gap-2 sm:col-span-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50 appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Wishlist">Wishlist</option>
            <option value="Reading">Reading</option>
            <option value="Read">Read</option>
            <option value="Ignored">Ignored</option>
          </select>
          <div className="flex-1 flex gap-1 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl px-2 py-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 bg-transparent text-earth-900 dark:text-earth-100 text-sm focus:outline-none appearance-none px-2"
            >
              <option value="title">Sort by Title</option>
              <option value="author">Sort by Author</option>
              <option value="rating">Sort by Rating</option>
              <option value="dateAdded">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-earth-500 hover:text-mustard-600 dark:hover:text-mustard-400 transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <SortAsc className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${showAdvanced ? 'bg-mustard-500/20 border-mustard-500/50 text-mustard-700 dark:text-mustard-300' : 'bg-white dark:bg-earth-900 border-earth-200 dark:border-earth-800 text-earth-600 dark:text-earth-400 hover:border-mustard-500/30'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-earth-900/50 border border-earth-200 dark:border-earth-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-earth-500 uppercase tracking-widest flex items-center gap-2">
                  <TagIcon className="w-3 h-3" /> Genre
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Fantasy, Romance..."
                  value={genreFilter}
                  onChange={e => setGenreFilter(e.target.value)}
                  className="w-full bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-earth-500 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-3 h-3" /> Author Name
                </label>
                <input 
                  type="text"
                  placeholder="Filter by author..."
                  value={authorFilter}
                  onChange={e => setAuthorFilter(e.target.value)}
                  className="w-full bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-earth-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Publication Year Range
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    placeholder="From"
                    value={yearStart}
                    onChange={e => setYearStart(e.target.value)}
                    className="w-1/2 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
                  />
                  <span className="text-earth-600 dark:text-earth-400">—</span>
                  <input 
                    type="number"
                    placeholder="To"
                    value={yearEnd}
                    onChange={e => setYearEnd(e.target.value)}
                    className="w-1/2 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
                  />
                </div>
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-bold text-earth-500 uppercase tracking-widest flex items-center gap-2">
                  <Type className="w-3 h-3" /> Keywords (Title or Synopsis)
                </label>
                <input 
                  type="text"
                  placeholder="Search for keywords in title or description..."
                  value={keywordFilter}
                  onChange={e => setKeywordFilter(e.target.value)}
                  className="w-full bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-earth-900 dark:text-earth-100 focus:outline-none focus:border-mustard-500/50"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-earth-800 dark:text-earth-200 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter by Tags
            </h3>
            {(includedTags.size > 0 || excludedTags.size > 0) && (
              <button 
                onClick={() => { setIncludedTags(new Set()); setExcludedTags(new Set()); }}
                className="text-[10px] font-bold uppercase tracking-widest text-mustard-600 dark:text-mustard-400 hover:text-mustard-700 dark:hover:text-mustard-300 transition-colors"
              >
                Clear Tags
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
            {tags.map(tag => {
              const isIncluded = includedTags.has(tag.id);
              const isExcluded = excludedTags.has(tag.id);
              
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2
                    ${isIncluded ? 'bg-sage-500/20 border-sage-500/50 text-sage-700 dark:text-sage-300' : 
                      isExcluded ? 'bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300 opacity-70' : 
                      'bg-earth-100 dark:bg-earth-800 border-earth-200 dark:border-earth-700 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-700'}`}
                >
                  {isIncluded ? <CheckSquare className="w-3.5 h-3.5" /> : 
                   isExcluded ? <XCircle className="w-3.5 h-3.5" /> : 
                   <Square className="w-3.5 h-3.5" />}
                  {tag.name}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-[10px] text-earth-500 font-medium uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><CheckSquare className="w-3 h-3 text-sage-500" /> Include</div>
            <div className="flex items-center gap-1.5"><XCircle className="w-3 h-3 text-red-500" /> Exclude</div>
            <div className="flex items-center gap-1.5"><Square className="w-3 h-3 text-earth-400 dark:text-earth-600" /> Neutral</div>
          </div>
        </div>
      )}

      {selectedBooks.size > 0 && (
        <div className="bg-mustard-500/10 border border-mustard-500/20 rounded-xl p-3 flex flex-wrap items-center gap-4">
          <span className="text-mustard-700 dark:text-mustard-300 font-medium text-sm">{selectedBooks.size} selected</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleBulkStatus('Read')} className="text-xs bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 px-3 py-1.5 rounded-lg transition-colors">Mark Read</button>
            <button onClick={() => handleBulkStatus('Reading')} className="text-xs bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 px-3 py-1.5 rounded-lg transition-colors">Mark Reading</button>
            <button onClick={() => handleBulkStatus('Wishlist')} className="text-xs bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 px-3 py-1.5 rounded-lg transition-colors">To Wishlist</button>
            <button onClick={() => handleBulkStatus('Ignored')} className="text-xs bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 px-3 py-1.5 rounded-lg transition-colors">Ignore</button>
            <button onClick={handleBulkEnrich} className="text-xs bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Auto-Enrich</button>
            <button onClick={handleBulkDelete} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
          </div>
          <div className="flex gap-2 flex-wrap border-l border-earth-200 dark:border-earth-800 pl-4">
            <select
              className="bg-earth-100 dark:bg-earth-800 text-earth-800 dark:text-earth-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
              onChange={(e) => {
                const tagId = e.target.value;
                if (!tagId) return;
                selectedBooks.forEach(bookId => {
                  const book = books.find(b => b.id === bookId);
                  if (book && !book.tags.includes(tagId)) {
                    updateBook(bookId, { tags: [...book.tags, tagId] });
                  }
                });
                setSelectedBooks(new Set());
                e.target.value = "";
              }}
              defaultValue=""
            >
              <option value="" disabled>+ Add tag...</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select
              className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
              onChange={(e) => {
                const tagId = e.target.value;
                if (!tagId) return;
                selectedBooks.forEach(bookId => {
                  const book = books.find(b => b.id === bookId);
                  if (book) {
                    updateBook(bookId, { tags: book.tags.filter(id => id !== tagId) });
                  }
                });
                setSelectedBooks(new Set());
                e.target.value = "";
              }}
              defaultValue=""
            >
              <option value="" disabled>- Remove tag...</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredBooks.length > 0 && (
          <div className="col-span-full flex items-center px-4 py-2 text-sm text-slate-500">
            <button onClick={toggleSelectAll} className="mr-4 hover:text-slate-300">
              {selectedBooks.size === filteredBooks.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </button>
            <span className="flex-1">Library ({filteredBooks.length})</span>
          </div>
        )}
        
        {filteredBooks.length === 0 ? (
          <div className="col-span-full text-center py-12 text-earth-500 dark:text-earth-400 bg-earth-100/50 dark:bg-earth-900/30 rounded-3xl border border-earth-200 dark:border-earth-800 border-dashed">
            <BookIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No books found.</p>
            {(search || statusFilter !== 'All' || includedTags.size > 0 || excludedTags.size > 0) && (
              <button onClick={clearFilters} className="mt-4 text-mustard-600 dark:text-mustard-400 hover:text-mustard-700 dark:hover:text-mustard-300 text-sm font-medium">Clear all filters</button>
            )}
          </div>
        ) : (
          filteredBooks.map(book => {
            const isExpanded = expandedBook === book.id;
            const links = getStoreLinks(book.title, book.author);            return (
              <React.Fragment key={book.id}>
                <motion.div 
                  key={book.id} 
                  layout
                  className={`flex flex-col rounded-2xl border transition-all overflow-hidden ${selectedBooks.has(book.id) ? 'bg-mustard-500/5 border-mustard-500/30 ring-1 ring-mustard-500/50' : 'bg-white/60 dark:bg-earth-900/60 backdrop-blur-sm border-earth-200 dark:border-earth-800 hover:border-earth-300 dark:hover:border-earth-700 hover:shadow-soft-lg hover:-translate-y-1'}`}
                >
                  {/* Top section: Cover + Actions overlay */}
                  <div className="relative aspect-[3/4] w-full bg-earth-100 dark:bg-earth-800 group cursor-pointer" onClick={() => handleExpand(book.id)}>
                    <BookCover 
                      title={book.title} 
                      author={book.author} 
                      initialCoverUrl={book.coverUrl} 
                      className="w-full h-full"
                    />
                    
                    {/* Hover actions for cover */}
                    <div className="absolute inset-0 bg-earth-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 z-20">
                        <button
                          onClick={(e) => handleEnrichSingle(e, book.id, book.title, book.author)}
                          className="w-full py-2 rounded-xl bg-mustard-500/20 hover:bg-mustard-500/40 text-xs font-bold uppercase text-mustard-300 transition-colors flex items-center justify-center gap-2"
                          title="Search web for cover"
                        >
                          <Search className="w-4 h-4" /> Fetch Cover
                        </button>
                        <button
                          onClick={(e) => handleGenerateCover(e, book.id, book.title, book.author)}
                          disabled={isGeneratingCover[book.id]}
                          className="w-full py-2 rounded-xl bg-sage-500/20 hover:bg-sage-500/40 text-xs font-bold uppercase text-sage-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          title="Generate AI cover"
                        >
                          {isGeneratingCover[book.id] ? <LogoLoader size={16} /> : <ImageIcon className="w-4 h-4" />} Gen Cover
                        </button>
                      </div>

                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-earth-950 via-earth-900/20 to-transparent opacity-90 pointer-events-none" />

                    {/* Selection Checkbox */}
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(book.id); }} className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-earth-950/50 backdrop-blur-md border border-white/10 text-earth-300 hover:text-mustard-400 transition-colors">
                      {selectedBooks.has(book.id) ? <CheckSquare className="w-4 h-4 text-mustard-400" /> : <Square className="w-4 h-4" />}
                    </button>

                    {/* Quick Action Icons (Top Right) */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                      <a href={links.playStore} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-earth-950/60 backdrop-blur-md border border-white/10 text-earth-300 hover:text-blue-400 hover:border-blue-400/50 transition-all shadow-soft" title="Google Play Books">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a href={links.kindle} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-earth-950/60 backdrop-blur-md border border-white/10 text-earth-300 hover:text-amber-400 hover:border-amber-400/50 transition-all shadow-soft" title="Amazon Kindle">
                        <Bookmark className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Title & Author Overlay (Bottom) */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <h4 className="font-bold text-earth-100 text-lg leading-tight mb-1 line-clamp-2">{book.title}</h4>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-earth-300 font-medium truncate">{book.author}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {book.publicationYear && (
                            <span className="text-[10px] font-mono text-earth-300 bg-earth-800/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10">
                              {book.publicationYear}
                            </span>
                          )}
                          {!authors.some(a => (a.name?.toLowerCase() || '') === (book.author?.toLowerCase() || '')) ? (
                            <button
                              onClick={(e) => handleAddAuthor(e, book.author)}
                              disabled={addingAuthor === book.author}
                              className="p-1 rounded-md bg-mustard-500/20 text-mustard-400 hover:bg-mustard-500/40 transition-colors backdrop-blur-sm"
                              title="Quick add author to tracking"
                            >
                              {addingAuthor === book.author ? (
                                <LogoLoader size={12} />
                              ) : (
                                <UserPlus className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <div className="p-1 rounded-md bg-sage-500/20 text-sage-400 backdrop-blur-sm" title="Author is tracked">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Actions (Below Cover) */}
                  <div className="p-3 border-b border-earth-200 dark:border-earth-800 flex items-center justify-between gap-2 bg-earth-50 dark:bg-earth-950/30">
                    <div className="flex gap-2 w-full">
                      <button onClick={(e) => handleStatusChange(e, book.id, 'Wishlist')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${book.status === 'Wishlist' ? 'bg-mustard-500/20 text-mustard-600 dark:text-mustard-400 border border-mustard-500/30' : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-700'}`}>
                        <Plus className="w-3 h-3" /> Wish
                      </button>
                      <button onClick={(e) => handleStatusChange(e, book.id, 'Reading')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${book.status === 'Reading' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-700'}`}>
                        <BookOpen className="w-3 h-3" /> Read<span className="hidden sm:inline">ing</span>
                      </button>
                      <button onClick={(e) => handleStatusChange(e, book.id, 'Read')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${book.status === 'Read' ? 'bg-sage-500/20 text-sage-600 dark:text-sage-400 border border-sage-500/30' : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-700'}`}>
                        <Check className="w-3 h-3" /> Read
                      </button>
                    </div>
                  </div>
                </motion.div>
                
                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 bg-white dark:bg-earth-950 p-4 sm:p-8 overflow-y-auto"
                    >
                      <div className="max-w-3xl mx-auto">
                        <button onClick={() => setExpandedBook(null)} className="mb-4 text-earth-500 hover:text-earth-900 dark:hover:text-earth-100">Close</button>
                        <div className="p-4 space-y-4">
                        {/* Rating Stars */}
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-mustard-600 dark:text-mustard-400 uppercase tracking-wider">Rating</h5>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                key={star}
                                onClick={(e) => handleRating(e, book.id, star)}
                                className={`p-1 transition-colors ${book.rating && book.rating >= star ? 'text-amber-400' : 'text-earth-400 dark:text-earth-600 hover:text-amber-400/50'}`}
                              >
                                <Star className={`w-4 h-4 ${book.rating && book.rating >= star ? 'fill-amber-400' : ''}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Synopsis */}
                        <div>
                          <h5 className="text-xs font-bold text-mustard-600 dark:text-mustard-400 uppercase tracking-wider mb-2">Synopsis</h5>
                          {book.description ? (
                            <p className="text-sm text-earth-700 dark:text-earth-300 leading-relaxed">
                              {book.description}
                            </p>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-earth-500 italic text-sm">No synopsis available.</span>
                              <button
                                onClick={(e) => handleEnrichSingle(e, book.id, book.title, book.author)}
                                className="text-xs bg-mustard-500/10 hover:bg-mustard-500/20 text-mustard-600 dark:text-mustard-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" /> Auto-fetch Synopsis
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        <div>
                          <h5 className="text-xs font-bold text-mustard-600 dark:text-mustard-400 uppercase tracking-wider mb-2">Notes</h5>
                          <textarea
                            value={book.notes || ''}
                            onChange={(e) => updateBook(book.id, { notes: e.target.value })}
                            placeholder="Add your notes here..."
                            className="w-full bg-earth-100/50 dark:bg-earth-900/50 border border-earth-200 dark:border-earth-800 rounded-xl px-4 py-2 text-sm text-earth-800 dark:text-earth-200 focus:outline-none focus:border-mustard-500/50 min-h-[80px]"
                          />
                        </div>

                        {/* Tags */}
                        <div className="mt-4 pt-4 border-t border-earth-200 dark:border-earth-800">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-bold text-mustard-600 dark:text-mustard-400 uppercase tracking-wider">Tags</h5>
                            <button
                              onClick={(e) => handleSuggestTags(e, book.id, book.title, book.author, book.description)}
                              disabled={isSuggestingTags[book.id]}
                              className="text-xs bg-sage-500/10 hover:bg-sage-500/20 text-sage-600 dark:text-sage-400 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Sparkles className="w-3 h-3" /> {isSuggestingTags[book.id] ? 'Suggesting...' : 'Suggest Tags'}
                            </button>
                          </div>
                          
                          {book.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {book.tags.map(tId => {
                                const tag = tags.find(t => t.id === tId);
                                return tag ? (
                                  <span key={tId} className="text-xs px-2.5 py-1 rounded-md bg-earth-100 dark:bg-earth-800 text-earth-800 dark:text-earth-200 border border-earth-200 dark:border-earth-700 flex items-center gap-1">
                                    {tag.name}
                                    <button 
                                      onClick={() => updateBook(book.id, { tags: book.tags.filter(id => id !== tId) })}
                                      className="text-earth-500 hover:text-red-400 ml-1"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-earth-500 italic mb-3">No tags added yet.</p>
                          )}

                          <div className="mb-4">
                            <select
                              className="w-full bg-earth-50 dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-lg px-3 py-2 text-sm text-earth-800 dark:text-earth-200 focus:outline-none focus:border-sage-500/50"
                              onChange={(e) => {
                                handleAddExistingTag(book.id, e.target.value);
                                e.target.value = "";
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>+ Add existing tag...</option>
                              {tags.filter(t => !book.tags.includes(t.id)).map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.category || 'Other'})</option>
                              ))}
                            </select>
                          </div>

                          {suggestedTags[book.id] && Object.keys(suggestedTags[book.id]).length > 0 && (
                            <div className="bg-earth-100/50 dark:bg-earth-900/50 rounded-xl p-3 border border-sage-500/20">
                              <h6 className="text-xs font-semibold text-sage-600 dark:text-sage-400 mb-3">AI Suggestions (Click to add, X to block)</h6>
                              <div className="flex flex-col gap-4">
                                {Object.entries(suggestedTags[book.id]).map(([category, tags]) => {
                                  if (!tags || tags.length === 0) return null;
                                  return (
                                    <div key={category} className="space-y-1.5">
                                      <h6 className="text-[10px] font-bold text-earth-500 uppercase tracking-widest">{category}</h6>
                                      <div className="flex flex-wrap gap-1.5">
                                        {tags.map(suggestion => (
                                          <div key={suggestion} className="flex items-center justify-between bg-white dark:bg-earth-900 px-2 py-1 rounded-lg border border-earth-200 dark:border-earth-800">
                                            <button 
                                              onClick={() => handleAddTagToBook(book.id, suggestion, category)}
                                              className="text-xs text-earth-700 dark:text-earth-300 hover:text-sage-600 dark:hover:text-sage-400 text-left flex-1"
                                            >
                                              + {suggestion}
                                            </button>
                                            <button 
                                              onClick={() => handleBlockSuggestedTag(book.id, suggestion, category)}
                                              className="text-earth-400 hover:text-red-400 ml-2 p-0.5"
                                              title="Dismiss suggestion"
                                            >
                                              <XCircle className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes & Tasks */}
                        <div className="mt-6 pt-6 border-t border-earth-200 dark:border-earth-800">
                          <h5 className="text-xs font-bold text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-2">Notes & Tasks</h5>
                          <textarea
                            value={book.notes || ''}
                            onChange={(e) => updateBook(book.id, { notes: e.target.value })}
                            placeholder="Add custom tasks, reading notes, or thoughts here..."
                            className="w-full bg-earth-100/50 dark:bg-earth-900/50 border border-earth-200 dark:border-earth-800 rounded-xl p-3 text-sm text-earth-800 dark:text-earth-200 focus:outline-none focus:border-sage-500/50 min-h-[100px] resize-y"
                          />
                        </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
