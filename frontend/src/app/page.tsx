"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Plus, ArrowRight, FileText, Activity } from "lucide-react";

export default function Dashboard() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideasRes, postsRes] = await Promise.all([
          api.get("ideas/"),
          api.get("posts/")
        ]);
        setIdeas(ideasRes.data);
        setPosts(postsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your SEO blog ideas and drafts.</p>
        </div>
        <Link href="/generate" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} className="mr-2" />
          New Idea
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Drafts */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="mr-2 text-blue-500" size={20} />
              Active Drafts
            </h2>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No drafts yet. Generate an idea to start writing!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="group relative border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-900 line-clamp-1">{post.idea.title}</h3>
                    {post.seo_score ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.seo_score >= 8 ? 'bg-green-100 text-green-800' : post.seo_score >= 6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        Score: {post.seo_score}/10
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{post.content || "Empty post..."}</p>
                  <Link href={`/editor/${post.id}`} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                    Continue Writing <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Saved Ideas */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Activity className="mr-2 text-purple-500" size={20} />
              Saved Ideas
            </h2>
          </div>
          {ideas.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No saved ideas. Go generate some!
            </div>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => {
                const hasPost = posts.some(p => p.idea.id === idea.id);
                return (
                  <div key={idea.id} className="border border-slate-100 rounded-xl p-4 hover:border-purple-200 transition-all bg-slate-50/50">
                    <h3 className="font-medium text-slate-900 mb-2">{idea.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        Vol: {idea.search_volume || "N/A"}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                        Diff: {idea.difficulty || "N/A"}
                      </span>
                    </div>
                    {!hasPost && (
                      <button 
                        onClick={async () => {
                          try {
                            const res = await api.post("posts/", { idea_id: idea.id });
                            window.location.href = `/editor/${res.data.id}`;
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-sm font-medium text-purple-600 hover:text-purple-700"
                      >
                        Start Writing &rarr;
                      </button>
                    )}
                    {hasPost && (
                      <span className="text-sm text-slate-400">Draft created</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
