import React, { useState, useEffect, useRef } from 'react';
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

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setSrc(initialCoverUrl || null);
    setError(false);
    setTriedOpenLibrary(false);
    return () => { isMounted.current = false; };
  }, [initialCoverUrl]);

  const handleGenerate = async (useOpenLibrary: boolean = false) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setLoading(true);
    try {
      if (useOpenLibrary) {
        if (!isMounted.current) return;
        setTriedOpenLibrary(true);
        const openLibraryUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-${encodeURIComponent(author)}-L.jpg`;
        setSrc(openLibraryUrl);
        setError(false);
        setIsGenerating(false);
        setLoading(false);
        return;
      }
      
      const generated = await generateBookCover(title, author);
      if (!isMounted.current) return;
      if (generated) {
        setSrc(generated);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      if (!isMounted.current) return;
      console.error("Failed to generate cover:", err);
      setError(true);
    } finally {
      if (isMounted.current) {
        setIsGenerating(false);
        setLoading(false);
      }
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
    <div className={`relative overflow-hidden bg-theme-surface flex items-center justify-center ${className}`}>
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
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-3 bg-gradient-to-br from-theme-earth-olive-light to-theme-earth-blue-light"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 px-4">
                <div className="relative">
                  <LogoLoader size={48} />
                  <div className="absolute -top-1 -right-1">
                    <Loader2 className="w-4 h-4 text-theme-accent1 animate-spin" />
                  </div>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-bold text-theme-accent1 uppercase tracking-[0.2em] animate-pulse">Generating Cover</p>
                  <p className="text-[11px] font-bold text-theme-text line-clamp-2 max-w-[150px]">{title}</p>
                  <p className="text-[9px] text-theme-text-secondary uppercase tracking-widest">{author}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <BookIcon className="w-12 h-12 text-theme-text opacity-50" />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-theme-surface rounded-full border border-theme-accent1">
                    <ImageIcon className="w-3 h-3 text-theme-text" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-theme-text uppercase tracking-tighter line-clamp-2 px-2">{title}</p>
                  <p className="text-[8px] text-theme-text-secondary uppercase tracking-widest">{author}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-theme-accent1/10 hover:bg-theme-accent1/20 border border-theme-accent1/30 text-[9px] font-bold uppercase tracking-widest text-theme-text transition-all flex items-center gap-1.5 active:scale-95"
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
