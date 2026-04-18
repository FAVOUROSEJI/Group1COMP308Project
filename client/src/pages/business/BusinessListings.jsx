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
const UPDATE_LISTING = gql`
  mutation UpdateBusinessListing($id: ID!, $name: String, $description: String, $category: String) {
    updateBusinessListing(id: $id, name: $name, description: $description, category: $category) {
      id name description category author { id name }
    }
  }
`;
const DELETE_LISTING = gql`
  mutation DeleteBusinessListing($id: ID!) {
    deleteBusinessListing(id: $id)
  }
`;

const categoryColors = {
  restaurant: "bg-orange-50 border-orange-200 hover:border-orange-400",
  retail: "bg-blue-50 border-blue-200 hover:border-blue-400",
  services: "bg-green-50 border-green-200 hover:border-green-400",
  health: "bg-pink-50 border-pink-200 hover:border-pink-400",
  other: "bg-gray-50 border-gray-200 hover:border-gray-400",
};
const categoryBadge = {
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
  const [updateListing, { loading: updating }] = useMutation(UPDATE_LISTING, {
    onCompleted: () => { refetch(); setEditingId(null); },
    onError: (e) => alert(e.message),
  });
  const [deleteListing] = useMutation(DELETE_LISTING, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });

  const [form, setForm] = useState({ name: "", description: "", category: "retail" });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", category: "retail" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return alert("Please fill in all fields.");
    createListing({ variables: form });
  };

  const startEdit = (biz) => {
    setEditingId(biz.id);
    setEditForm({ name: biz.name, description: biz.description, category: biz.category });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.description.trim()) return alert("Please fill in all fields.");
    updateListing({ variables: { id: editingId, ...editForm } });
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this listing? All its reviews and deals will also be removed.")) {
      deleteListing({ variables: { id } });
    }
  };

  const filtered = data?.getBusinessListings?.filter(
    (b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
  );

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

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-headline text-4xl font-extrabold text-gray-900 mb-2">
              🏪 Business Listings
            </h1>
            <p className="text-gray-600">Discover and manage local businesses in your community</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700 text-white font-headline font-bold px-6 py-3 rounded-full shadow-lg transition-all">
            {showForm ? "Cancel" : "+ Add Listing"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input placeholder="🔍 Search by name or category..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:border-purple-500 transition text-gray-700"
          />
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-purple-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">Create Business Listing</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                <input name="name" placeholder="Your business name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea name="description" placeholder="What does your business offer?" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-white transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-white transition">
                  <option value="restaurant">🍽️ Restaurant</option>
                  <option value="retail">🛍️ Retail</option>
                  <option value="services">🔧 Services</option>
                  <option value="health">🏥 Health</option>
                  <option value="other">🏢 Other</option>
                </select>
              </div>
              <button type="submit" disabled={creating} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all">
                {creating ? "Creating..." : "Create Listing"}
              </button>
            </form>
          </div>
        )}

        {/* Listings Grid */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading listings...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Error loading listings</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered?.map((biz) => (
            <div key={biz.id} className={`rounded-2xl shadow p-6 border-2 transition-all hover:shadow-lg ${categoryColors[biz.category] || categoryColors.other}`}>
              {editingId === biz.id ? (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none" />
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
                    <option value="restaurant">🍽️ Restaurant</option>
                    <option value="retail">🛍️ Retail</option>
                    <option value="services">🔧 Services</option>
                    <option value="health">🏥 Health</option>
                    <option value="other">🏢 Other</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" disabled={updating} className="text-xs bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">
                      {updating ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{categoryEmoji[biz.category] || "🏢"}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{biz.name}</h3>
                        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full capitalize mt-1 ${categoryBadge[biz.category] || categoryBadge.other}`}>
                          {biz.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">{biz.description}</p>
                  <p className="text-xs text-gray-500 mb-4">by <span className="font-bold text-gray-700">{biz.author?.name}</span></p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate(`/reviews?businessId=${biz.id}&businessName=${encodeURIComponent(biz.name)}`)}
                      className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold px-4 py-2 rounded-lg transition-all text-sm">
                      ⭐ Reviews
                    </button>
                    {user?.id === biz.author?.id && (
                      <>
                        <button onClick={() => navigate(`/post-deal?businessId=${biz.id}&businessName=${encodeURIComponent(biz.name)}`)}
                          className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-4 py-2 rounded-lg transition-all text-sm">
                          📢 Deal
                        </button>
                        <button onClick={() => startEdit(biz)}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition font-bold">✏️</button>
                        <button onClick={() => handleDelete(biz.id)}
                          className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition font-bold">🗑️</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {filtered?.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-5xl mb-3">🏪</p>
            <p className="text-gray-500 font-semibold text-lg">No businesses found</p>
            <p className="text-gray-400">Try a different search or add your own listing</p>
          </div>
        )}
      </main>
    </div>
  );
}
