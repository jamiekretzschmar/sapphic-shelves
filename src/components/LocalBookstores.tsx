import React, { useState } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { findLocalBookstores } from '../services/gemini';
import Markdown from 'react-markdown';

export default function LocalBookstores() {
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const res = await findLocalBookstores(location);
      setResult(res);
    } catch (err) {
      setResult({ text: 'An error occurred while searching.', groundingChunks: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Local Bookstores</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Find independent bookstores near you that carry queer literature using Google Maps grounding.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl transition-all group-hover:blur-2xl opacity-50"></div>
        <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
          <Navigation className="absolute left-4 w-6 h-6 text-slate-500" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. 'Seattle, WA' or 'London, UK'"
            className="w-full bg-transparent py-5 pl-14 pr-32 text-slate-200 placeholder:text-slate-500 focus:outline-none text-lg"
          />
          <button
            type="submit"
            disabled={loading || !location.trim()}
            className="absolute right-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find'}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl mt-8">
          <div className="max-w-none mb-8 markdown-body">
            <Markdown>{result.text}</Markdown>
          </div>
          
          {result.groundingChunks && result.groundingChunks.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Map Locations
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {result.groundingChunks.map((chunk: any, i: number) => {
                  if (chunk.web?.uri) {
                    return (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800 transition-all"
                      >
                        <h4 className="font-medium text-emerald-400 mb-1">{chunk.web.title || 'View Location'}</h4>
                        <p className="text-xs text-slate-400 truncate">{chunk.web.uri}</p>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
