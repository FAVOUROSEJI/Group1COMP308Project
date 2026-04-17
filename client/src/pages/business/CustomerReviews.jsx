import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";

const GET_REVIEWS = gql`
  query GetReviews($businessId: ID!) {
    getReviews(businessId: $businessId) { id content rating createdAt author { id name } }
  }
`;
const CREATE_REVIEW = gql`
  mutation CreateReview($businessId: ID!, $content: String!, $rating: Int!) {
    createReview(businessId: $businessId, content: $content, rating: $rating) {
      id content rating createdAt author { id name }
    }
  }
`;
const GET_LISTINGS = gql`
  query { getBusinessListings { id name } }
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
  const params = new URLSearchParams(location.search);
  const { data: listingsData } = useQuery(GET_LISTINGS);
  const [selectedBiz, setSelectedBiz] = useState({ id: params.get("businessId") || "", name: params.get("businessName") || "" });
  const { data, loading, refetch } = useQuery(GET_REVIEWS, { variables: { businessId: selectedBiz.id }, skip: !selectedBiz.id });
  const [createReview, { loading: creating }] = useMutation(CREATE_REVIEW, {
    onCompleted: () => { refetch(); setForm({ content: "", rating: 5 }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [form, setForm] = useState({ content: "", rating: 5 });
  const [showForm, setShowForm] = useState(false);
  const [sentiment, setSentiment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.content.trim()) return alert("Please write a review.");
    if (!selectedBiz.id) return alert("Please select a business.");
    createReview({ variables: { businessId: selectedBiz.id, content: form.content, rating: parseInt(form.rating) } });
  };

  const handleAnalyze = async () => {
    if (!data?.getReviews?.length) return alert("No reviews to analyze.");
    setAnalyzing(true);
    setSentiment(await analyzeSentiment(data.getReviews));
    setAnalyzing(false);
  };

  const avgRating = data?.getReviews?.length
    ? (data.getReviews.reduce((sum, r) => sum + r.rating, 0) / data.getReviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-yellow-500 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-yellow-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⭐ Customer Reviews</h2>
        <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select a Business</label>
          <select value={selectedBiz.id}
            onChange={(e) => {
              const biz = listingsData?.getBusinessListings?.find(b => b.id === e.target.value);
              setSelectedBiz({ id: e.target.value, name: biz?.name || "" });
              setSentiment("");
            }}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400">
            <option value="">-- Choose a business --</option>
            {listingsData?.getBusinessListings?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        {selectedBiz.id && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selectedBiz.name}</h3>
                {avgRating && <p className="text-sm text-gray-500">Average: ⭐ {avgRating} / 5 ({data?.getReviews?.length} reviews)</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="text-xs bg-yellow-100 text-yellow-700 px-3 py-2 rounded-full hover:bg-yellow-200 transition disabled:opacity-50">
                  {analyzing ? "Analyzing..." : "🤖 AI Sentiment Analysis"}
                </button>
                <button onClick={() => setShowForm(!showForm)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition text-sm">
                  {showForm ? "Cancel" : "+ Write Review"}
                </button>
              </div>
            </div>
            {sentiment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-yellow-700 mb-2">🤖 AI Sentiment Analysis</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{sentiment}</p>
              </div>
            )}
            {showForm && (
              <div className="bg-white rounded-xl shadow p-6 mb-6 border border-yellow-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Write a Review</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}
                          className={`w-10 h-10 rounded-full text-lg transition ${form.rating >= n ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-400"}`}>★</button>
                      ))}
                      <span className="self-center text-sm text-gray-500 ml-2">{form.rating}/5</span>
                    </div>
                  </div>
                  <textarea placeholder="Share your experience..." value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                  <button type="submit" disabled={creating} className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 transition">
                    {creating ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            )}
            {loading && <p className="text-center text-gray-500 mt-6">Loading reviews...</p>}
            <div className="space-y-4">
              {data?.getReviews?.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow p-5 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <span key={n} className={n <= review.rating ? "text-yellow-400" : "text-gray-200"}>★</span>)}</div>
                    <span className="text-xs text-gray-400">{new Date(parseInt(review.createdAt)).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{review.content}</p>
                  <span className="text-xs text-gray-400">by {review.author?.name}</span>
                </div>
              ))}
              {data?.getReviews?.length === 0 && <p className="text-center text-gray-400 py-8">No reviews yet. Be the first!</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}