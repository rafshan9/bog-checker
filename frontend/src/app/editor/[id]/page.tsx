"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import api from "@/lib/axios";
import { Save, Bot, AlertTriangle, CheckCircle, ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";

export default function EditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      // we can auto-save or wait for manual save
    }
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`posts/${id}/`);
        setPost(res.data);
        if (editor && res.data.content) {
          editor.commands.setContent(res.data.content);
        }
      } catch (err) {
        setError("Failed to load draft.");
      } finally {
        setLoading(false);
      }
    };
    if (id && editor) fetchPost();
  }, [id, editor]);

  const handleSave = async () => {
    if (!editor || !post) return;
    setSaving(true);
    try {
      await api.put(`posts/${id}/`, {
        ...post,
        content: editor.getHTML(),
        idea_id: post.idea.id
      });
      // Update local state
      setPost({ ...post, content: editor.getHTML() });
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluate = async () => {
    if (!editor || !post) return;
    setEvaluating(true);
    // ensure we save latest content before evaluating
    await handleSave();
    try {
      const res = await api.post("evaluate-post/", {
        content: editor.getText(), // send text for evaluation, or HTML
        topic: post.idea.topic,
        post_id: post.id
      });
      // Store the full evaluation result (includes checklist)
      setEvaluationResult(res.data);
      // refresh post to get new score
      const freshPost = await api.get(`posts/${id}/`);
      setPost(freshPost.data);
    } catch (err) {
      console.error(err);
      alert("Evaluation failed.");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return <div className="text-center text-red-500 mt-10">{error || "Post not found."}</div>;
  }

  const score = post.seo_score;
  const isPublishable = score && score >= 6;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{post.idea.title}</h1>
            <div className="flex items-center text-sm text-white mt-1 space-x-4">
              <span>Target Topic: <span className="font-medium text-white">{post.idea.topic}</span></span>
              <span>Keywords: <span className="font-medium text-white">{post.idea.keywords}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Save size={18} className="mr-2" />
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg font-medium text-white hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <Bot size={18} className="mr-2" />
            {evaluating ? "Reviewing..." : "Review Post"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Simple Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-2">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded ${editor?.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded ${editor?.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <em>I</em>
            </button>
            <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded text-sm font-bold ${editor?.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              H2
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded text-sm font-bold ${editor?.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              H3
            </button>
          </div>
          <EditorContent editor={editor} />
        </div>

        {/* AI Evaluation Panel */}
        <div className="lg:col-span-1 space-y-6 sticky top-24">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Bot className="mr-2 text-blue-500" size={20} />
              AI SEO Analysis
            </h3>

            {score !== null ? (() => {
              // Parse seo_feedback — it may be JSON (new format) or plain text (old format)
              let feedbackText = '';
              let checklist: { item: string; passed: boolean; suggestion: string }[] = [];
              
              try {
                const parsed = JSON.parse(post.seo_feedback);
                feedbackText = parsed.feedback || '';
                checklist = parsed.checklist || [];
              } catch {
                // Old format: plain text feedback
                feedbackText = post.seo_feedback || '';
              }

              // Also check evaluationResult for fresh checklist data
              if (evaluationResult?.checklist?.length) {
                checklist = evaluationResult.checklist;
                feedbackText = evaluationResult.feedback || feedbackText;
              }

              const passedCount = checklist.filter(c => c.passed).length;

              return (
                <div className="space-y-5">
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`text-4xl font-black mb-1 ${score >= 8 ? 'text-green-600' : score >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {score}/10
                    </div>
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">SEO Score</div>
                    {checklist.length > 0 && (
                      <div className="text-xs text-slate-400 mt-1">{passedCount}/{checklist.length} checks passed</div>
                    )}
                  </div>

                  {!isPublishable && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm flex items-start border border-red-100">
                      <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>Score too low for publishing. Improve your content based on the feedback below.</span>
                    </div>
                  )}
                  {isPublishable && (
                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm flex items-start border border-green-100">
                      <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>Great job! This post is ready to be published.</span>
                    </div>
                  )}

                  {/* SEO Checklist */}
                  {checklist.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">SEO Checklist</h4>
                      <div className="space-y-2">
                        {checklist.map((check, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-lg border text-sm ${
                              check.passed 
                                ? 'bg-green-50/50 border-green-100' 
                                : 'bg-red-50/50 border-red-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {check.passed ? (
                                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle size={14} className="text-red-500 flex-shrink-0" />
                              )}
                              <span className={`font-medium ${check.passed ? 'text-green-800' : 'text-red-800'}`}>
                                {check.item}
                              </span>
                            </div>
                            <p className={`text-xs ml-[22px] ${check.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {check.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Feedback */}
                  {feedbackText && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Detailed Feedback</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{feedbackText}</p>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="text-center py-8 text-slate-500">
                <div className="inline-flex items-center justify-center p-3 bg-slate-100 rounded-full mb-3">
                  <Bot size={24} className="text-slate-400" />
                </div>
                <p className="text-sm">Click &quot;Review Post&quot; to get a comprehensive SEO evaluation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
