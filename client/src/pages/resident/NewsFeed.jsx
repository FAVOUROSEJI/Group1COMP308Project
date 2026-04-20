import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_POSTS = gql`
  query { getPosts { id title content createdAt author { id name } } }
`;
const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!) {
    createPost(title: $title, content: $content) { id title content createdAt author { id name } }
  }
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function callGeminiWithRetry(prompt, retries = 3) {
  const models = ["gemini-3-flash-preview"];
  for (const model of models) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        if (res.status === 503) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        if (!res.ok) continue;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  return null;
}

async function summarizeWithGemini(text) {
  const result = await callGeminiWithRetry(`Summarize this community post in 2-3 sentences:\n\n"${text}"`);
  return result || "AI summarization is temporarily unavailable. Please try again in a moment.";
}

export default function NewsFeed() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(GET_POSTS);
  const [createPost, { loading: creating }] = useMutation(CREATE_POST, {
    onCompleted: () => { refetch(); setForm({ title: "", content: "" }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [form, setForm] = useState({ title: "", content: "" });
  const [showForm, setShowForm] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return alert("Please fill in all fields.");
    createPost({ variables: form });
  };

  const handleSummarize = async (post) => {
    setSummarizing((s) => ({ ...s, [post.id]: true }));
    const summary = await summarizeWithGemini(post.title + ". " + post.content);
    setSummaries((s) => ({ ...s, [post.id]: summary }));
    setSummarizing((s) => ({ ...s, [post.id]: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏘️</span>
            <span className="font-headline font-black text-xl tracking-tight">Neighbourhood Hub</span>
          </div>
          <button onClick={() => navigate("/dashboard")} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2 rounded-full transition-all">
            ← Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-headline text-4xl font-extrabold text-gray-900 mb-2">
              📰 Local News & Discussions
            </h1>
            <p className="text-gray-600">Stay updated with what's happening in your neighborhood</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white font-headline font-bold px-6 py-3 rounded-full shadow-lg transition-all">
            {showForm ? "Cancel" : "+ New Post"}
          </button>
        </div>

        {/* Create Post Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">Share with Your Community</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Post Title</label>
                <input name="title" placeholder="What's on your mind?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">What's happening?</label>
                <textarea name="content" placeholder="Share your news, updates, or discussion..." value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all">
                {creating ? "Posting..." : "Publish Post"}
              </button>
            </form>
          </div>
        )}

        {/* Posts List */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading posts...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Error loading posts</p>
          </div>
        )}
        <div className="space-y-6">
          {data?.getPosts?.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(parseInt(post.createdAt)).toLocaleDateString()} • by <span className="font-semibold text-gray-600">{post.author?.name}</span>
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {summaries[post.id] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-xs font-bold text-blue-600 mb-2">🤖 AI SUMMARY</p>
                  <p className="text-sm text-blue-900 leading-relaxed">{summaries[post.id]}</p>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={() => handleSummarize(post)} disabled={summarizing[post.id]}
                  className="bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-700 font-bold px-4 py-2 rounded-full transition-all text-sm">
                  {summarizing[post.id] ? "🤖 Summarizing..." : "🤖 AI Summarize"}
                </button>
              </div>
            </div>
          ))}
          {data?.getPosts?.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <p className="text-5xl mb-3">📝</p>
              <p className="text-gray-500 font-semibold text-lg">No posts yet</p>
              <p className="text-gray-400">Be the first to share what's happening in your neighborhood!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}