import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const GET_LISTINGS = gql`
  query { getBusinessListings { id name description category author { id name } } }
`;
const CREATE_LISTING = gql`
  mutation CreateBusinessListing($name: String!, $description: String!, $category: String!) {
    createBusinessListing(name: $name, description: $description, category: $category) {
      id name description category author { id name }
    }
  }
`;

const categoryColors = {
  restaurant: "bg-orange-100 text-orange-700",
  retail: "bg-blue-100 text-blue-700",
  services: "bg-green-100 text-green-700",
  health: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700",
};
const categoryEmoji = { restaurant: "🍽️", retail: "🛍️", services: "🔧", health: "🏥", other: "🏢" };

export default function BusinessListings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(GET_LISTINGS);
  const [createListing, { loading: creating }] = useMutation(CREATE_LISTING, {
    onCompleted: () => { refetch(); setForm({ name: "", description: "", category: "retail" }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [form, setForm] = useState({ name: "", description: "", category: "retail" });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return alert("Please fill in all fields.");
    createListing({ variables: form });
  };

  const filtered = data?.getBusinessListings?.filter(
    (b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-purple-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">🏪 Business Listings</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition text-sm">
            {showForm ? "Cancel" : "+ Add Listing"}
          </button>
        </div>
        <input placeholder="Search by name or category..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Business Listing</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name" placeholder="Business name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <textarea name="description" placeholder="Describe your business..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
              <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="restaurant">🍽️ Restaurant</option>
                <option value="retail">🛍️ Retail</option>
                <option value="services">🔧 Services</option>
                <option value="health">🏥 Health</option>
                <option value="other">🏢 Other</option>
              </select>
              <button type="submit" disabled={creating} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition">
                {creating ? "Creating..." : "Create Listing"}
              </button>
            </form>
          </div>
        )}
        {loading && <p className="text-center text-gray-500 mt-10">Loading listings...</p>}
        {error && <p className="text-center text-red-500 mt-10">Error loading listings.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered?.map((biz) => (
            <div key={biz.id} className="bg-white rounded-xl shadow p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{categoryEmoji[biz.category] || "🏢"} {biz.name}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${categoryColors[biz.category] || categoryColors.other}`}>{biz.category}</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{biz.description}</p>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/reviews?businessId=${biz.id}&businessName=${encodeURIComponent(biz.name)}`)}
                  className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-200 transition">⭐ Reviews</button>
                {user?.id === biz.author?.id && (
                  <button onClick={() => navigate(`/post-deal?businessId=${biz.id}&businessName=${encodeURIComponent(biz.name)}`)}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition">📢 Post Deal</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {filtered?.length === 0 && !loading && <p className="text-center text-gray-400 py-10">No businesses found.</p>}
      </div>
    </div>
  );
}