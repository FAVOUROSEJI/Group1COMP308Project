import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const GET_LISTINGS = gql`
  query { getBusinessListings { id name author { id } } }
`;
const GET_DEALS = gql`
  query GetDeals($businessId: ID!) {
    getDeals(businessId: $businessId) { id title description }
  }
`;
const CREATE_DEAL = gql`
  mutation CreateDeal($businessId: ID!, $title: String!, $description: String!) {
    createDeal(businessId: $businessId, title: $title, description: $description) { id title description }
  }
`;
const DELETE_DEAL = gql`
  mutation DeleteDeal($id: ID!) {
    deleteDeal(id: $id)
  }
`;

export default function PostDeal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const params = new URLSearchParams(useLocation().search);
  const { data: listingsData } = useQuery(GET_LISTINGS);
  const myListings = listingsData?.getBusinessListings?.filter(b => b.author?.id === user?.id) || [];
  const [selectedBizId, setSelectedBizId] = useState(params.get("businessId") || "");
  const { data: dealsData, loading: dealsLoading, refetch } = useQuery(GET_DEALS, { variables: { businessId: selectedBizId }, skip: !selectedBizId });
  const [createDeal, { loading: creating }] = useMutation(CREATE_DEAL, {
    onCompleted: () => { refetch(); setForm({ title: "", description: "" }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [deleteDeal] = useMutation(DELETE_DEAL, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });
  const [form, setForm] = useState({ title: "", description: "" });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return alert("Please fill in all fields.");
    if (!selectedBizId) return alert("Please select a business.");
    createDeal({ variables: { businessId: selectedBizId, ...form } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-purple-600 text-white px-6 py-5 shadow-lg">
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
          📢 Post Special Deals
        </h1>
        <p className="text-gray-600 mb-8">Share exclusive offers with your community members</p>

        {myListings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <p className="text-6xl mb-4">🏪</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">No Business Listing</p>
            <p className="text-gray-600 mb-6 text-lg">You need to create a business listing before posting deals.</p>
            <button onClick={() => navigate("/business-listings")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-full shadow-lg transition-all">
              Create Business Listing
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Business Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-200">
              <label className="block text-lg font-bold text-gray-900 mb-4">📌 Select Your Business</label>
              <select value={selectedBizId} onChange={(e) => setSelectedBizId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:border-purple-500 focus:bg-white transition text-gray-700 font-semibold"
              >
                <option value="">-- Choose your business --</option>
                {myListings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Deals Section */}
            {selectedBizId && (
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-headline font-bold text-gray-900">Active Deals</h2>
                  <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700 text-white font-headline font-bold px-6 py-3 rounded-full shadow-lg transition-all">
                    {showForm ? "Cancel" : "+ New Deal"}
                  </button>
                </div>

                {/* Create Deal Form */}
                {showForm && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-purple-200">
                    <h3 className="text-2xl font-headline font-bold text-gray-900 mb-6">Create a Special Deal</h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Title</label>
                        <input placeholder="e.g., 20% Off This Weekend!" value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Details</label>
                        <textarea placeholder="Describe the deal, terms, expiry date, and how to redeem..." value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
                          className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-white transition resize-none"
                        />
                      </div>
                      <button type="submit" disabled={creating} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all">
                        {creating ? "Posting..." : "Post Deal"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Deals List */}
                {dealsLoading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Loading deals...</p>
                  </div>
                )}
                <div className="space-y-4">
                  {dealsData?.getDeals?.map((deal) => (
                    <div key={deal.id} className="bg-white rounded-2xl shadow p-6 border-l-4 border-purple-400 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <span className="text-4xl">🏷️</span>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">{deal.title}</h3>
                            <p className="text-gray-700 mt-2 leading-relaxed">{deal.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { if (window.confirm("Delete this deal?")) deleteDeal({ variables: { id: deal.id } }); }}
                          className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition shrink-0">
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {dealsData?.getDeals?.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-5xl mb-3">🤷</p>
                      <p className="text-gray-500 font-semibold">No active deals</p>
                      <p className="text-gray-400">Post your first special offer to attract customers!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}