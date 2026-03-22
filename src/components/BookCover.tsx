import React, { useState, useEffect } from 'react';
import { Book as BookIcon, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react';
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
    <div className={`relative overflow-hidden bg-slate-800 flex items-center justify-center ${className}`}>
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
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">Generating Cover...</span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <BookIcon className="w-12 h-12 text-slate-600 opacity-50" />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-slate-700 rounded-full border border-white/10">
                    <ImageIcon className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter line-clamp-2 px-2">{title}</p>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">{author}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-[9px] font-bold uppercase tracking-widest text-fuchsia-400 transition-all flex items-center gap-1.5 active:scale-95"
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
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}
