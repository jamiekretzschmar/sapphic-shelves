import React, { useState, useEffect } from 'react';
import LogoLoader from './LogoLoader';
import { Book as BookIcon, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { generateBookCover } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';

interface BookCoverProps {
  title: string;
  author: string;
  initialCoverUrl?: string;
  className?: string;
}

export default function BookCover({ title, author, initialCoverUrl, className = "" }: BookCoverProps) {
  const [src, setSrc] = useState<string | null>(initialCoverUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [triedOpenLibrary, setTriedOpenLibrary] = useState(false);

  useEffect(() => {
    setSrc(initialCoverUrl || null);
    setError(false);
    setTriedOpenLibrary(false);
  }, [initialCoverUrl]);

  const handleGenerate = async (useOpenLibrary: boolean = false) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setLoading(true);
    try {
      if (useOpenLibrary) {
        setTriedOpenLibrary(true);
        const openLibraryUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-${encodeURIComponent(author)}-L.jpg`;
        setSrc(openLibraryUrl);
        setError(false);
        setIsGenerating(false);
        setLoading(false);
        return;
      }
      
      const generated = await generateBookCover(title, author);
      if (generated) {
        setSrc(generated);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to generate cover:", err);
      setError(true);
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleError = () => {
    if (!isGenerating) {
      setError(true);
      if (!triedOpenLibrary) {
        handleGenerate(true);
      } else {
        handleGenerate(false);
      }
    }
  };

  return (
    <div className={`relative overflow-hidden bg-earth-100 dark:bg-earth-800 flex items-center justify-center ${className}`}>
      <AnimatePresence mode="wait">
        {src && !error ? (
          <motion.img
            key={src}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={src}
            alt={title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={handleError}
          />
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-3 bg-gradient-to-br from-earth-100 to-earth-200 dark:from-earth-800 dark:to-earth-900"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <LogoLoader size={32} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-mustard-600 dark:text-mustard-400">Generating Cover...</span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <BookIcon className="w-12 h-12 text-earth-400 dark:text-earth-600 opacity-50" />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-earth-200 dark:bg-earth-700 rounded-full border border-earth-300 dark:border-white/10">
                    <ImageIcon className="w-3 h-3 text-earth-500 dark:text-earth-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-earth-600 dark:text-earth-400 uppercase tracking-tighter line-clamp-2 px-2">{title}</p>
                  <p className="text-[8px] text-earth-500 dark:text-earth-500 uppercase tracking-widest">{author}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-mustard-500/10 hover:bg-mustard-500/20 border border-mustard-500/30 text-[9px] font-bold uppercase tracking-widest text-mustard-600 dark:text-mustard-400 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for loading state if src exists but we are regenerating */}
      {isGenerating && src && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
          <LogoLoader size={32} />
        </div>
      )}
    </div>
  );
}
