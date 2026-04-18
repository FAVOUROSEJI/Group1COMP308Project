import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_ALERTS = gql`
  query { getEmergencyAlerts { id title description location createdAt author { id name } } }
`;
const CREATE_ALERT = gql`
  mutation CreateEmergencyAlert($title: String!, $description: String!, $location: String!) {
    createEmergencyAlert(title: $title, description: $description, location: $location) {
      id title description location createdAt author { id name }
    }
  }
`;

const severityClass = (title) => {
  const t = title.toLowerCase();
  if (t.includes("missing") || t.includes("fire") || t.includes("danger") || t.includes("critical")) return "border-red-300 bg-red-50";
  if (t.includes("warning") || t.includes("flood") || t.includes("alert")) return "border-yellow-300 bg-yellow-50";
  return "border-orange-300 bg-orange-50";
};

export default function EmergencyAlerts() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(GET_ALERTS, { pollInterval: 30000 });
  const [createAlert, { loading: creating }] = useMutation(CREATE_ALERT, {
    onCompleted: () => { refetch(); setForm({ title: "", description: "", location: "" }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [form, setForm] = useState({ title: "", description: "", location: "" });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) return alert("Please fill in all fields.");
    createAlert({ variables: form });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-red-600 text-white px-6 py-5 shadow-lg">
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
              🚨 Emergency Alerts
            </h1>
            <p className="text-gray-600">Report and view urgent neighborhood safety issues</p>
            <p className="text-xs text-gray-400 mt-2">Auto-refreshes every 30 seconds</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-headline font-bold px-6 py-3 rounded-full shadow-lg transition-all">
            {showForm ? "Cancel" : "⚠️ Report Alert"}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-red-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-2">Report an Emergency</h2>
            <p className="text-sm text-gray-600 mb-6">Please only use this for genuine community safety issues.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alert Title</label>
                <input name="title" placeholder="e.g., Missing child, Gas leak, Fire nearby" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea name="description" placeholder="Describe the situation in detail..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:bg-white transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input name="location" placeholder="e.g., Corner of Main St & 2nd Ave" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:bg-white transition"
                />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all">
                {creating ? "Reporting..." : "Submit Alert"}
              </button>
            </form>
          </div>
        )}

        {/* Alerts List */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading alerts...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Error loading alerts</p>
          </div>
        )}
        <div className="space-y-4">
          {data?.getEmergencyAlerts?.map((alert) => (
            <div key={alert.id} className={`rounded-2xl shadow p-6 border-l-4 ${severityClass(alert.title)} hover:shadow-lg transition-all`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900">🚨 {alert.title}</h3>
                <span className="text-xs font-semibold text-gray-400 whitespace-nowrap ml-4">
                  {new Date(parseInt(alert.createdAt)).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{alert.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-600 pt-3 border-t border-gray-200">
                <span className="font-semibold">📍 {alert.location}</span>
                <span>Reported by <span className="font-bold text-gray-800">{alert.author?.name}</span></span>
              </div>
            </div>
          ))}
          {data?.getEmergencyAlerts?.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <p className="text-5xl mb-3">✅</p>
              <p className="text-gray-500 font-semibold text-lg">No active emergency alerts</p>
              <p className="text-gray-400">Stay safe and remain vigilant!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}