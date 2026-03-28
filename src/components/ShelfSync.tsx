import React, { useState, useRef } from 'react';
import LogoLoader from './LogoLoader';
import { Camera, Upload, Check, Loader2 } from 'lucide-react';
import { analyzeBookshelfForIngestion, analyzeImage, QuotaExceededError } from '../services/gemini';
import { useLibrary } from '../context/LibraryContext';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ShelfSync() {
  const [results, setResults] = useState<{ id: string, preview: string, books: { title: string, author: string, genre?: string, publicationYear?: number }[] | null, status: 'pending' | 'processing' | 'completed' | 'failed' | 'quota-exceeded', fileName: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { books, addBook, addTask, updateTask } = useLibrary();

  const [analysisResults, setAnalysisResults] = useState<{ id: string, preview: string, analysis: string | null, status: 'pending' | 'processing' | 'completed' | 'failed' | 'quota-exceeded', fileName: string }[]>([]);
  const analysisInputRef = useRef<HTMLInputElement>(null);

  const handleAnalysisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newResults = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      analysis: null,
      status: 'pending' as const,
      fileName: file.name,
      file
    }));

    setAnalysisResults(prev => [...newResults, ...prev]);

    newResults.forEach(async (item) => {
      const taskId = addTask({
        name: `Analyzing image: ${item.fileName}`,
        status: 'processing',
        progress: 10
      });

      setAnalysisResults(prev => prev.map(r => r.id === item.id ? { ...r, status: 'processing' } : r));

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          updateTask(taskId, { progress: 40 });
          const res = await analyzeImage(base64String, item.file.type, "Describe this image in detail, focus on any books or literary elements if present.");
          
          setAnalysisResults(prev => prev.map(r => r.id === item.id ? { ...r, analysis: res, status: 'completed' } : r));
          updateTask(taskId, { status: 'completed', progress: 100, result: res });
        } catch (err) {
          const isQuota = err instanceof QuotaExceededError;
          setAnalysisResults(prev => prev.map(r => r.id === item.id ? { ...r, analysis: null, status: isQuota ? 'quota-exceeded' : 'failed' } : r));
          updateTask(taskId, { 
            status: 'failed', 
            progress: 100, 
            name: isQuota ? 'Quota Exceeded' : `Failed Analysis: ${item.fileName}` 
          });
        }
      };
      reader.readAsDataURL(item.file);
    });

    if (analysisInputRef.current) analysisInputRef.current.value = '';
  };

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
    <div className="space-y-12 max-w-4xl mx-auto pb-20">
      {/* Image Analysis Section */}
      <div className="bento-card relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-theme-accent1/5 to-theme-accent1/10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-theme-text flex items-center gap-3">
                <Camera className="w-8 h-8 text-theme-accent1" />
                Vision Intelligence
              </h2>
              <p className="text-theme-text-secondary text-sm mt-1">Upload any photo to analyze it with Gemini 3.1 Pro.</p>
            </div>
            <button 
              onClick={() => analysisInputRef.current?.click()}
              className="bg-theme-accent1 hover:bg-theme-accent1 active:scale-[0.98] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all duration-300 shadow-xl shadow-theme-accent1/20"
            >
              <Upload className="w-5 h-5" />
              <span>Analyze Photo</span>
            </button>
            <input 
              type="file" 
              ref={analysisInputRef}
              onChange={handleAnalysisFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {analysisResults.map((result, index) => {
              const cardColorClass = index % 3 === 0 ? 'bg-theme-card-blue' : index % 3 === 1 ? 'bg-theme-card-yellow' : 'bg-theme-card-olive';
              const hoverColorClass = index % 3 === 0 ? 'hover:bg-theme-earth-blue-light' : index % 3 === 1 ? 'hover:bg-theme-earth-yellow-light' : 'hover:bg-theme-earth-olive-green-light';

              return (
                <motion.div 
                  key={result.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`${cardColorClass} ${hoverColorClass} backdrop-blur-md border border-theme-border rounded-[2rem] overflow-hidden flex flex-col shadow-2xl shadow-black/20 transition-all duration-300`}
                >
                <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                  <img 
                    src={result.preview} 
                    alt={result.fileName} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  {result.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                      <LogoLoader size={60} />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analyzing Scene</span>
                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-theme-accent1"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {result.status === 'quota-exceeded' && (
                    <div className="absolute inset-0 bg-theme-danger/40 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-theme-danger/20 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-theme-danger" />
                      </div>
                      <span className="text-theme-danger font-black text-xs uppercase tracking-widest">Quota Exceeded</span>
                      <p className="text-theme-danger/80 text-[10px] leading-relaxed">The vision engine is resting. Please try again tomorrow.</p>
                    </div>
                  )}
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-theme-text-secondary uppercase tracking-[0.15em] mb-1">Source File</span>
                      <span className="text-xs font-bold text-theme-text-secondary truncate max-w-[180px]">
                        {result.fileName}
                      </span>
                    </div>
                    {result.status === 'completed' && (
                      <div className="bg-theme-success/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-theme-success" />
                        <span className="text-[9px] font-black text-theme-success uppercase tracking-widest">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  {result.analysis ? (
                    <div className="text-sm text-theme-text-secondary leading-relaxed max-h-[250px] overflow-y-auto pr-4 custom-scrollbar whitespace-pre-wrap font-medium">
                      {result.analysis}
                    </div>
                  ) : result.status === 'failed' ? (
                    <div className="bg-theme-danger/5 border border-theme-danger/10 rounded-xl p-4 flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-theme-danger" />
                      <span className="text-theme-danger text-[10px] font-bold uppercase tracking-widest">Analysis failed. Please retry.</span>
                    </div>
                  ) : result.status === 'processing' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-theme-accent1"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-theme-text-secondary font-bold uppercase tracking-widest">Neural Processing</span>
                          <span className="text-[9px] text-theme-text-secondary font-bold uppercase tracking-widest">Gemini 3.1 Pro</span>
                        </div>
                      </div>
                      <p className="text-xs text-theme-text-secondary italic leading-relaxed">Decoding visual elements and literary context...</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-theme-text-secondary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Queued for processing</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ); })}
            {analysisResults.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02]">
                <div className="w-20 h-20 rounded-full bg-theme-text/5 flex items-center justify-center mb-6">
                  <Camera className="w-10 h-10 text-theme-text-secondary" />
                </div>
                <p className="text-theme-text-secondary text-sm font-medium tracking-wide">No images analyzed yet. Drop a photo to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent my-12" />

      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-accent1/10 text-theme-accent1 mb-4">
          <Camera className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-theme-text">Shelf Sync</h2>
        <p className="text-theme-text-secondary max-w-xl mx-auto">
          Upload a photo of a bookshelf. Our vision engine will extract the titles and authors, allowing you to quickly ingest them into your library.
        </p>
      </div>

      <div className="bento-card text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-theme-accent1/5 to-theme-accent2/5 pointer-events-none"></div>
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
          className="relative z-10 border-2 border-dashed border-theme-border rounded-2xl p-12 cursor-pointer hover:border-theme-accent1/50 hover:bg-theme-accent1/5 transition-all duration-300 group"
        >
          <Upload className="w-12 h-12 text-theme-text-secondary mx-auto mb-4 group-hover:text-theme-accent1 group-hover:scale-110 transition-all duration-500" />
          <p className="text-theme-text font-medium mb-1 text-lg">Upload photos</p>
          <p className="text-theme-text-secondary text-sm">You can select multiple images at once</p>
        </div>
      </div>

      <div className="space-y-6">
        {results.map((result, index) => {
          const cardColorClass = index % 3 === 0 ? 'bento-card-blue' : index % 3 === 1 ? 'bento-card-yellow' : 'bento-card-olive';
          return (
            <motion.div 
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardColorClass} overflow-hidden`}
            >
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-48 shrink-0">
                <div className="relative rounded-xl overflow-hidden border border-theme-border shadow-lg aspect-[3/4] sm:aspect-auto sm:h-64">
                  <img src={result.preview} alt="Preview" className="w-full h-full object-cover" />
                  {result.status === 'processing' && (
                    <div className="absolute inset-0 bg-theme-bg/40 backdrop-blur-[2px] flex items-center justify-center">
                      <LogoLoader size={32} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeResult(result.id)}
                  className="w-full mt-3 text-xs font-medium text-theme-text-secondary hover:text-theme-danger transition-colors py-2"
                >
                  Remove from list
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                    {result.status === 'completed' ? (
                      <Check className="w-5 h-5 text-theme-accent1" />
                    ) : result.status === 'processing' ? (
                      <LogoLoader size={20} />
                    ) : result.status === 'quota-exceeded' ? (
                      <AlertTriangle className="w-5 h-5 text-theme-warning" />
                    ) : (
                      <Camera className="w-5 h-5 text-theme-text-secondary" />
                    )}
                    {result.status === 'completed' ? `Found ${result.books?.length || 0} Books` : 
                     result.status === 'quota-exceeded' ? 'Quota Exceeded' : 'Analyzing...'}
                  </h3>
                  {result.status === 'completed' && result.books && result.books.length > 0 && result.books.some(b => !isBookInLibrary(b.title, b.author)) && (
                    <button 
                      onClick={() => handleIngestAll(result.id)}
                      className="bg-theme-accent1 hover:bg-theme-accent1/80 text-theme-bg px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Ingest All New
                    </button>
                  )}
                </div>

                {result.status === 'completed' && result.books && (
                  <div className="grid gap-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {result.books.length === 0 ? (
                      <p className="text-theme-text-secondary italic text-sm py-4">No books identified in this image.</p>
                    ) : (
                      result.books.map((book, i) => (
                        <div key={i} className="flex items-center justify-between bg-theme-bg/30 p-3 rounded-xl border border-theme-border">
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-theme-text text-sm truncate">{book.title}</h4>
                              {book.publicationYear && (
                                <span className="text-[9px] font-mono text-theme-text-secondary bg-theme-surface px-1 rounded">
                                  {book.publicationYear}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-theme-text-secondary truncate">{book.author}</p>
                              {book.genre && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-theme-accent2/70">
                                  {book.genre}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isBookInLibrary(book.title, book.author) ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary bg-theme-border/50 px-3 py-1.5 rounded-lg border border-theme-border flex items-center gap-1 shrink-0">
                                <Check className="w-3 h-3" /> In Library
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleIngest(book, result.id)}
                                className="text-theme-accent1 hover:text-theme-accent1/80 bg-theme-accent1/10 hover:bg-theme-accent1/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
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
                  <div className="bg-theme-warning/10 border border-theme-warning/20 p-4 rounded-xl space-y-2">
                    <p className="text-theme-warning text-sm font-medium">API Limit Reached</p>
                    <p className="text-theme-warning/70 text-xs leading-relaxed">
                      You've exceeded the free usage quota for the Gemini API. This limit usually resets after a short period. Please try again in a few minutes or tomorrow.
                    </p>
                  </div>
                )}

                {result.status === 'failed' && (
                  <div className="bg-theme-danger/10 border border-theme-danger/20 p-4 rounded-xl">
                    <p className="text-theme-danger text-sm">Analysis failed. Please try a different image or try again later.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ); })}
      </div>
    </div>
  );
}
