import React, { useState } from 'react';
import { Sparkles, Loader2, Globe } from 'lucide-react';
import { findResources, QuotaExceededError } from '../services/gemini';
import Markdown from 'react-markdown';

export default function ResourceEngine() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleScan = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await findResources();
      setResult(res);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setResult('API Limit Reached. Please try again later.');
      } else {
        setResult('Failed to load resources.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 mb-4">
          <Globe className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Resource Engine</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Discover current ARCs, writing contests, and free queer editions across the web.
        </p>
      </div>

      {!result && !loading && (
        <div className="flex justify-center">
          <button
            onClick={handleScan}
            className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-2xl font-medium transition-colors flex items-center gap-3 shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-5 h-5" />
            Scan for Resources
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-slate-400">Aggregating latest resources from the web...</p>
        </div>
      )}

      {result && !loading && (
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl markdown-body">
          <Markdown>{result}</Markdown>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button
              onClick={handleScan}
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center justify-center gap-2 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              Refresh Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
