"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Sparkles, Save, Search, CheckCircle } from "lucide-react";

export default function GeneratePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setIdeas([]);
    try {
      const res = await api.post("generate-ideas/", { topic });
      if (Array.isArray(res.data)) {
        setIdeas(res.data);
      } else {
        setError(res.data.error || "Failed to generate ideas.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (idea: any, index: number) => {
    try {
      const res = await api.post("ideas/", {
        topic: topic,
        title: idea.title,
        keywords: idea.keywords,
        search_volume: idea.search_volume,
        difficulty: idea.difficulty,
      });
      setSavedIds(new Set(savedIds).add(index));
    } catch (err) {
      console.error("Failed to save idea", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4 text-blue-600">
          <Sparkles size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Topic & Keyword Generator</h1>
        <p className="text-slate-500">Powered by Gemini Pro Search Grounding. Discover real-time SEO opportunities.</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center relative z-10 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
        <Search className="text-slate-400 ml-3" size={20} />
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a niche or topic (e.g., 'sustainable gardening in winter')"
          className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-900 placeholder:text-slate-400"
          required
        />
        <button 
          type="submit" 
          disabled={loading || !topic}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Researching..." : "Generate Ideas"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center">
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ideas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 px-1">Discovered Opportunities</h2>
          {ideas.map((idea, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{idea.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                    <div className="flex items-center text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 font-medium">
                      <span className="text-purple-500 mr-1.5 uppercase text-[10px] tracking-wider">Volume</span>
                      {idea.search_volume || "N/A"}
                    </div>
                    <div className="flex items-center text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 font-medium">
                      <span className="text-orange-500 mr-1.5 uppercase text-[10px] tracking-wider">Difficulty</span>
                      {idea.difficulty || "N/A"}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500"><span className="font-medium text-slate-700">Keywords:</span> {idea.keywords}</p>
                </div>
                <button
                  onClick={() => handleSave(idea, idx)}
                  disabled={savedIds.has(idx)}
                  className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    savedIds.has(idx) 
                      ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm group-hover:border-blue-400 group-hover:text-blue-700'
                  }`}
                >
                  {savedIds.has(idx) ? (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Idea
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
