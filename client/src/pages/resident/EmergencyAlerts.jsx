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

const severityColor = (title) => {
  const t = title.toLowerCase();
  if (t.includes("missing") || t.includes("fire") || t.includes("danger")) return "border-red-400 bg-red-50";
  if (t.includes("warning") || t.includes("flood") || t.includes("alert")) return "border-yellow-400 bg-yellow-50";
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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🚨 Emergency Alerts</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-red-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🚨 Emergency Alerts</h2>
            <p className="text-xs text-gray-400 mt-1">Auto-refreshes every 30 seconds</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm">
            {showForm ? "Cancel" : "⚠️ Report Alert"}
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-red-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Report an Emergency</h3>
            <p className="text-xs text-gray-500 mb-4">Please only use this for genuine community safety issues.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="title" placeholder="Alert title (e.g. Missing child, Gas leak)" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
              <textarea name="description" placeholder="Describe the situation..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
              <input name="location" placeholder="Location (e.g. Corner of Main St & 2nd Ave)" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
              <button type="submit" disabled={creating} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition">
                {creating ? "Reporting..." : "Submit Alert"}
              </button>
            </form>
          </div>
        )}
        {loading && <p className="text-center text-gray-500 mt-10">Loading alerts...</p>}
        {error && <p className="text-center text-red-500 mt-10">Error loading alerts.</p>}
        <div className="space-y-4">
          {data?.getEmergencyAlerts?.map((alert) => (
            <div key={alert.id} className={`rounded-xl shadow p-6 border-l-4 ${severityColor(alert.title)}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">🚨 {alert.title}</h3>
                <span className="text-xs text-gray-400">{new Date(parseInt(alert.createdAt)).toLocaleString()}</span>
              </div>
              <p className="text-gray-700 text-sm mb-2">{alert.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>📍 {alert.location}</span>
                <span>Reported by <span className="font-medium">{alert.author?.name}</span></span>
              </div>
            </div>
          ))}
          {data?.getEmergencyAlerts?.length === 0 && (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-500">No active emergency alerts. Stay safe!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}