import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const GET_REVIEWS = gql`
  query GetReviews($businessId: ID!) {
    getReviews(businessId: $businessId) {
      id content rating createdAt ownerReply author { id name }
    }
  }
`;
const CREATE_REVIEW = gql`
  mutation CreateReview($businessId: ID!, $content: String!, $rating: Int!) {
    createReview(businessId: $businessId, content: $content, rating: $rating) {
      id content rating createdAt ownerReply author { id name }
    }
  }
`;
const DELETE_REVIEW = gql`
  mutation DeleteReview($id: ID!) { deleteReview(id: $id) }
`;
const ADD_REVIEW_REPLY = gql`
  mutation AddReviewReply($reviewId: ID!, $reply: String!) {
    addReviewReply(reviewId: $reviewId, reply: $reply) {
      id ownerReply
    }
  }
`;
const GET_LISTINGS = gql`
  query { getBusinessListings { id name author { id } } }
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function analyzeSentiment(reviews) {
  try {
    const reviewText = reviews.map((r, i) => `${i + 1}. [${r.rating}/5 stars] "${r.content}"`).join("\n");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze the sentiment of these customer reviews and provide a brief business feedback summary (3-4 sentences): what customers love, what needs improvement, and an overall sentiment score (Positive/Neutral/Negative).\n\nReviews:\n${reviewText}` }] }]
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not analyze sentiment.";
  } catch {
    return "AI sentiment analysis failed. Please check your Gemini API key.";
  }
}

export default function CustomerReviews() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const params = new URLSearchParams(location.search);
  const { data: listingsData } = useQuery(GET_LISTINGS);
  const [selectedBiz, setSelectedBiz] = useState({ id: params.get("businessId") || "", name: params.get("businessName") || "" });
  const { data, loading, refetch } = useQuery(GET_REVIEWS, { variables: { businessId: selectedBiz.id }, skip: !selectedBiz.id });
  const [createReview, { loading: creating }] = useMutation(CREATE_REVIEW, {
    onCompleted: () => { refetch(); setForm({ content: "", rating: 5 }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [deleteReview] = useMutation(DELETE_REVIEW, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });
  const [addReviewReply] = useMutation(ADD_REVIEW_REPLY, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });

  const [form, setForm] = useState({ content: "", rating: 5 });
  const [showForm, setShowForm] = useState(false);
  const [sentiment, setSentiment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.content.trim()) return alert("Please write a review.");
    if (!selectedBiz.id) return alert("Please select a business.");
    createReview({ variables: { businessId: selectedBiz.id, content: form.content, rating: parseInt(form.rating) } });
  };

  const handleReply = (e, reviewId) => {
    e.preventDefault();
    if (!replyText.trim()) return alert("Please write a reply.");
    addReviewReply({ variables: { reviewId, reply: replyText } });
    setReplyingTo(null);
    setReplyText("");
  };

  const handleAnalyze = async () => {
    if (!data?.getReviews?.length) return alert("No reviews to analyze.");
    setAnalyzing(true);
    setSentiment(await analyzeSentiment(data.getReviews));
    setAnalyzing(false);
  };

  const isBusinessOwner = listingsData?.getBusinessListings?.find(b => b.id === selectedBiz.id)?.author?.id === user?.id;

  const avgRating = data?.getReviews?.length
    ? (data.getReviews.reduce((sum, r) => sum + r.rating, 0) / data.getReviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-yellow-500 text-white px-6 py-5 shadow-lg">
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
        <h1 className="font-headline text-4xl font-extrabold text-gray-900 mb-2">
          ⭐ Customer Reviews & Feedback
        </h1>
        <p className="text-gray-600 mb-8">Read and manage reviews from your community customers</p>

        {/* Business Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-yellow-200">
          <label className="block text-lg font-bold text-gray-900 mb-4">📌 Select a Business</label>
          <select value={selectedBiz.id}
            onChange={(e) => {
              const biz = listingsData?.getBusinessListings?.find(b => b.id === e.target.value);
              setSelectedBiz({ id: e.target.value, name: biz?.name || "" });
              setSentiment("");
            }}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:border-yellow-500 focus:bg-white transition text-gray-700 font-semibold"
          >
            <option value="">-- Choose a business --</option>
            {listingsData?.getBusinessListings?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {selectedBiz.id && (
          <div className="space-y-8">
            {/* Business Info & Rating */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-yellow-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-headline font-bold text-gray-900">{selectedBiz.name}</h2>
                  {avgRating && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={n <= Math.round(avgRating) ? "text-yellow-400 text-2xl" : "text-gray-300 text-2xl"}>★</span>
                        ))}
                      </div>
                      <span className="text-xl font-bold text-gray-900">{avgRating} / 5</span>
                      <span className="text-gray-500">({data?.getReviews?.length} reviews)</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAnalyze} disabled={analyzing}
                    className="bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50 text-yellow-700 font-bold px-4 py-3 rounded-full transition-all text-sm">
                    {analyzing ? "🤖 Analyzing..." : "🤖 AI Sentiment Analysis"}
                  </button>
                  <button onClick={() => setShowForm(!showForm)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-headline font-bold px-6 py-3 rounded-full shadow-lg transition-all">
                    {showForm ? "Cancel" : "+ Write Review"}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Sentiment Analysis */}
            {sentiment && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                <p className="text-sm font-bold text-yellow-700 mb-3">🤖 AI SENTIMENT ANALYSIS</p>
                <p className="text-gray-800 leading-relaxed">{sentiment}</p>
              </div>
            )}

            {/* Write Review Form */}
            {showForm && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-yellow-200">
                <h3 className="text-2xl font-headline font-bold text-gray-900 mb-6">Share Your Experience</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Your Rating</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}
                          className={`w-14 h-14 rounded-full text-2xl transition-all ${form.rating >= n ? "bg-yellow-400 text-white shadow-lg scale-110" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                          ★
                        </button>
                      ))}
                      <span className="self-center text-lg font-bold text-gray-700 ml-4">{form.rating}/5</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review</label>
                    <textarea placeholder="Share your experience with this business..." value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 focus:bg-white transition resize-none"
                    />
                  </div>
                  <button type="submit" disabled={creating} className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all">
                    {creating ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Loading reviews...</p>
              </div>
            )}
            <div className="space-y-4">
              {data?.getReviews?.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className={n <= review.rating ? "text-yellow-400 text-xl" : "text-gray-300 text-xl"}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">{new Date(parseInt(review.createdAt)).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-800 mb-3 leading-relaxed">{review.content}</p>

                  {review.ownerReply && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-2 ml-4">
                      <p className="text-xs font-semibold text-yellow-700 mb-1">🏪 Owner's Reply</p>
                      <p className="text-sm text-gray-700">{review.ownerReply}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <p className="text-sm text-gray-500">by <span className="font-bold text-gray-700">{review.author?.name}</span></p>
                    <div className="flex gap-2">
                      {isBusinessOwner && !review.ownerReply && (
                        <button onClick={() => { setReplyingTo(review.id); setReplyText(""); }}
                          className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-200 transition">
                          💬 Reply
                        </button>
                      )}
                      {isBusinessOwner && review.ownerReply && (
                        <button onClick={() => { setReplyingTo(review.id); setReplyText(review.ownerReply); }}
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition">
                          ✏️ Edit Reply
                        </button>
                      )}
                      {review.author?.id === user?.id && (
                        <button onClick={() => { if (window.confirm("Delete your review?")) deleteReview({ variables: { id: review.id } }); }}
                          className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition">
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {replyingTo === review.id && (
                    <form onSubmit={(e) => handleReply(e, review.id)} className="mt-3 ml-4 space-y-2">
                      <textarea placeholder="Write your reply as the business owner..." value={replyText}
                        onChange={(e) => setReplyText(e.target.value)} rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                      <div className="flex gap-2">
                        <button type="submit" className="text-xs bg-yellow-500 text-white px-4 py-1.5 rounded-lg hover:bg-yellow-600 transition">Post Reply</button>
                        <button type="button" onClick={() => setReplyingTo(null)} className="text-xs bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
              {data?.getReviews?.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-5xl mb-3">📝</p>
                  <p className="text-gray-500 font-semibold">No reviews yet</p>
                  <p className="text-gray-400">Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
