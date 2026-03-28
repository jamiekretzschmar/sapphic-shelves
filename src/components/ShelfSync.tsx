import React, { useState, useRef } from 'react';
import LogoLoader from './LogoLoader';
import { Camera, Upload, Check, Loader2 } from 'lucide-react';
import { analyzeBookshelfForIngestion, QuotaExceededError } from '../services/gemini';
import { useLibrary } from '../context/LibraryContext';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ShelfSync() {
  const [results, setResults] = useState<{ id: string, preview: string, books: { title: string, author: string, genre?: string, publicationYear?: number }[] | null, status: 'pending' | 'processing' | 'completed' | 'failed' | 'quota-exceeded', fileName: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { books, addBook, addTask, updateTask } = useLibrary();

  const isBookInLibrary = (title: string, author: string) => {
    return books.some(b => 
      (b.title?.toLowerCase() || '') === (title?.toLowerCase() || '') && 
      (b.author?.toLowerCase() || '') === (author?.toLowerCase() || '')
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newResults = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      books: null,
      status: 'pending' as const,
      fileName: file.name,
      file
    }));

    setResults(prev => [...newResults, ...prev]);

    // Process each file
    newResults.forEach(async (item) => {
      const taskId = addTask({
        name: `Analyzing ${item.fileName}`,
        status: 'processing',
        progress: 10
      });

      setResults(prev => prev.map(r => r.id === item.id ? { ...r, status: 'processing' } : r));

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          updateTask(taskId, { progress: 40 });
          const res = await analyzeBookshelfForIngestion(base64String, item.file.type);
          
          setResults(prev => prev.map(r => r.id === item.id ? { ...r, books: res, status: 'completed' } : r));
          updateTask(taskId, { status: 'completed', progress: 100, result: res });
        } catch (err) {
          const isQuota = err instanceof QuotaExceededError;
          setResults(prev => prev.map(r => r.id === item.id ? { ...r, books: [], status: isQuota ? 'quota-exceeded' : 'failed' } : r));
          updateTask(taskId, { 
            status: 'failed', 
            progress: 100, 
            name: isQuota ? 'Quota Exceeded' : `Failed: ${item.fileName}` 
          });
        }
      };
      reader.readAsDataURL(item.file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIngest = (book: { title: string, author: string, genre?: string, publicationYear?: number }, resultId: string) => {
    addBook({
      title: book.title,
      author: book.author,
      status: 'Wishlist',
      tags: [],
      genre: book.genre,
      publicationYear: book.publicationYear
    });
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, books: r.books ? r.books.filter(b => b.title !== book.title) : null } : r));
  };

  const handleIngestAll = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result && result.books) {
      result.books.forEach(book => {
        if (!isBookInLibrary(book.title, book.author)) {
          addBook({
            title: book.title,
            author: book.author,
            status: 'Wishlist',
            tags: [],
            genre: book.genre,
            publicationYear: book.publicationYear
          });
        }
      });
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, books: [] } : r));
    }
  };

  const removeResult = (id: string) => {
    const result = results.find(r => r.id === id);
    if (result) {
      URL.revokeObjectURL(result.preview);
    }
    setResults(prev => prev.filter(r => r.id !== id));
  };

  // Cleanup all object URLs on unmount
  React.useEffect(() => {
    return () => {
      results.forEach(r => URL.revokeObjectURL(r.preview));
    };
  }, []);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mb-4">
          <Camera className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Shelf Sync</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Upload a photo of a bookshelf. Our vision engine will extract the titles and authors, allowing you to quickly ingest them into your library.
        </p>
      </div>

      <div className="bento-card text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
        <input 
          type="file" 
          accept="image/*" 
          multiple
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative z-10 border-2 border-dashed border-white/10 rounded-2xl p-12 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 group"
        >
          <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-500" />
          <p className="text-slate-200 font-medium mb-1 text-lg">Upload photos</p>
          <p className="text-slate-500 text-sm">You can select multiple images at once</p>
        </div>
      </div>

      <div className="space-y-6">
        {results.map((result) => (
          <motion.div 
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-48 shrink-0">
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-[3/4] sm:aspect-auto sm:h-64">
                  <img src={result.preview} alt="Preview" className="w-full h-full object-cover" />
                  {result.status === 'processing' && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                      <LogoLoader size={32} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeResult(result.id)}
                  className="w-full mt-3 text-xs font-medium text-slate-500 hover:text-rose-400 transition-colors py-2"
                >
                  Remove from list
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    {result.status === 'completed' ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : result.status === 'processing' ? (
                      <LogoLoader size={20} />
                    ) : result.status === 'quota-exceeded' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-500" />
                    )}
                    {result.status === 'completed' ? `Found ${result.books?.length || 0} Books` : 
                     result.status === 'quota-exceeded' ? 'Quota Exceeded' : 'Analyzing...'}
                  </h3>
                  {result.status === 'completed' && result.books && result.books.length > 0 && result.books.some(b => !isBookInLibrary(b.title, b.author)) && (
                    <button 
                      onClick={() => handleIngestAll(result.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-slate-100 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Ingest All New
                    </button>
                  )}
                </div>

                {result.status === 'completed' && result.books && (
                  <div className="grid gap-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {result.books.length === 0 ? (
                      <p className="text-slate-500 italic text-sm py-4">No books identified in this image.</p>
                    ) : (
                      result.books.map((book, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950/30 p-3 rounded-xl border border-white/5">
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-200 text-sm truncate">{book.title}</h4>
                              {book.publicationYear && (
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 rounded">
                                  {book.publicationYear}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-500 truncate">{book.author}</p>
                              {book.genre && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-blue-400/70">
                                  {book.genre}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isBookInLibrary(book.title, book.author) ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1 shrink-0">
                                <Check className="w-3 h-3" /> In Library
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleIngest(book, result.id)}
                                className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {result.status === 'quota-exceeded' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                    <p className="text-amber-200 text-sm font-medium">API Limit Reached</p>
                    <p className="text-amber-200/70 text-xs leading-relaxed">
                      You've exceeded the free usage quota for the Gemini API. This limit usually resets after a short period. Please try again in a few minutes or tomorrow.
                    </p>
                  </div>
                )}

                {result.status === 'failed' && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                    <p className="text-rose-200 text-sm">Analysis failed. Please try a different image or try again later.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
