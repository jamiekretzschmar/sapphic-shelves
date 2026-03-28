import React, { useState } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { findLocalBookstores } from '../services/gemini';
import Markdown from 'react-markdown';
import Logo from './Logo';

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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-accent1/10 text-theme-accent1 mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-theme-text">Local Bookstores</h2>
        <p className="text-theme-text-secondary max-w-xl mx-auto">
          Find independent bookstores near you that carry queer literature using Google Maps grounding.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-accent1/20 to-theme-accent2/20 rounded-2xl blur-xl transition-all group-hover:blur-2xl opacity-50"></div>
        <div className="relative flex items-center bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden focus-within:border-theme-accent1/50 focus-within:ring-1 focus-within:ring-theme-accent1/50 transition-all">
          <Navigation className="absolute left-4 w-6 h-6 text-theme-text-secondary" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. 'Seattle, WA' or 'London, UK'"
            className="w-full bg-transparent py-5 pl-14 pr-32 text-theme-text placeholder:text-theme-text-secondary focus:outline-none text-lg"
          />
          <button
            type="submit"
            disabled={loading || !location.trim()}
            className="absolute right-2 bg-theme-accent1 hover:bg-theme-accent1 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Logo isLoading={true} size={20} /> : 'Find'}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-theme-surface border border-theme-border rounded-3xl p-8 shadow-2xl mt-8">
          <div className="max-w-none mb-8 markdown-body">
            <Markdown>{result.text}</Markdown>
          </div>
          
          {result.groundingChunks && result.groundingChunks.length > 0 && (
            <div className="mt-8 pt-8 border-t border-theme-border">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-theme-accent1" />
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
                        className="block p-4 rounded-xl bg-theme-bg/50 border border-theme-border hover:border-theme-accent1/30 hover:bg-theme-bg transition-all"
                      >
                        <h4 className="font-medium text-theme-accent1 mb-1">{chunk.web.title || 'View Location'}</h4>
                        <p className="text-xs text-theme-text-secondary truncate">{chunk.web.uri}</p>
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
