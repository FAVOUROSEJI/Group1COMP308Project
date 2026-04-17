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
  const [form, setForm] = useState({ title: "", description: "" });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return alert("Please fill in all fields.");
    if (!selectedBizId) return alert("Please select a business.");
    createDeal({ variables: { businessId: selectedBizId, ...form } });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-purple-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📢 Post a Deal</h2>
        {myListings.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
            <p className="text-4xl mb-3">🏪</p>
            <p className="text-gray-600 font-semibold mb-2">No Business Listing Found</p>
            <p className="text-gray-400 text-sm mb-4">You need to create a business listing before posting deals.</p>
            <button onClick={() => navigate("/business-listings")} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">Create a Listing</button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Business</label>
              <select value={selectedBizId} onChange={(e) => setSelectedBizId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="">-- Choose your business --</option>
                {myListings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {selectedBizId && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Active Deals</h3>
                  <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition text-sm">
                    {showForm ? "Cancel" : "+ New Deal"}
                  </button>
                </div>
                {showForm && (
                  <div className="bg-white rounded-xl shadow p-6 mb-6 border border-purple-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input placeholder="Deal title (e.g. 20% off this weekend!)" value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      <textarea placeholder="Describe the deal, terms, and expiry..." value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                      <button type="submit" disabled={creating} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition">
                        {creating ? "Posting..." : "Post Deal"}
                      </button>
                    </form>
                  </div>
                )}
                {dealsLoading && <p className="text-center text-gray-500">Loading deals...</p>}
                <div className="space-y-4">
                  {dealsData?.getDeals?.map((deal) => (
                    <div key={deal.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-400">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🏷️</span>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">{deal.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{deal.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dealsData?.getDeals?.length === 0 && <p className="text-center text-gray-400 py-8">No active deals. Post your first one!</p>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}