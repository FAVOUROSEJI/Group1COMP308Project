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

async function summarizeWithGemini(text) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Summarize this community post in 2-3 sentences:\n\n"${text}"` }] }] }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate summary.";
  } catch {
    return "AI summarization failed. Please check your Gemini API key.";
  }
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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-blue-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📰 Local News & Discussions</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
            {showForm ? "Cancel" : "+ New Post"}
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create a Post</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="title" placeholder="Post title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <textarea name="content" placeholder="What's happening in your neighborhood?" value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              <button type="submit" disabled={creating} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {creating ? "Posting..." : "Post"}
              </button>
            </form>
          </div>
        )}
        {loading && <p className="text-center text-gray-500 mt-10">Loading posts...</p>}
        {error && <p className="text-center text-red-500 mt-10">Error loading posts.</p>}
        <div className="space-y-4">
          {data?.getPosts?.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{post.title}</h3>
                <span className="text-xs text-gray-400">{new Date(parseInt(post.createdAt)).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
              {summaries[post.id] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-blue-600 mb-1">🤖 AI Summary</p>
                  <p className="text-sm text-blue-800">{summaries[post.id]}</p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">by <span className="font-medium text-gray-600">{post.author?.name}</span></span>
                <button onClick={() => handleSummarize(post)} disabled={summarizing[post.id]}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition disabled:opacity-50">
                  {summarizing[post.id] ? "Summarizing..." : "🤖 AI Summarize"}
                </button>
              </div>
            </div>
          ))}
          {data?.getPosts?.length === 0 && <p className="text-center text-gray-400 py-10">No posts yet. Be the first to post!</p>}
        </div>
      </div>
    </div>
  );
}