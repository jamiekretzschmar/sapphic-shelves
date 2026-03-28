import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Server, Code } from 'lucide-react';

export default function DebugPanel() {
  const [health, setHealth] = useState<any>(null);
  const [pythonResult, setPythonResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error("Health check failed:", err);
      setError("Failed to connect to Node server");
    }
  };

  const runPython = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { test: "Hello from React", timestamp: Date.now() } })
      });
      const data = await res.json();
      setPythonResult(data);
    } catch (err) {
      console.error("Python execution failed:", err);
      setError("Failed to execute Python logic");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto bg-slate-900/50 rounded-3xl border border-white/5 backdrop-blur-xl mt-10">
      <div className="flex items-center gap-3 mb-4">
        <Terminal className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-100">Full-Stack Debug Panel</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Node Health */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Server className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Node Server</span>
          </div>
          {health ? (
            <div className="space-y-1">
              <p className="text-sm text-slate-200">{health.message}</p>
              <p className="text-[10px] text-slate-500 font-mono">Status: {health.status}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Checking connectivity...</p>
          )}
        </div>

        {/* Python Integration */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <Code className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Python Integration</span>
          </div>
          <button 
            onClick={runPython}
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-100 dark:text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {loading ? "Processing..." : "Run Python Script"}
          </button>
        </div>
      </div>

      {/* Results */}
      {pythonResult && (
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Python Output</span>
          </div>
          <pre className="text-[10px] text-emerald-300 font-mono bg-black/30 p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(pythonResult, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
