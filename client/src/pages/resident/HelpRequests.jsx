import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const GET_HELP_REQUESTS = gql`
  query {
    getHelpRequests {
      id title description status createdAt
      author { id name }
      volunteers { id name }
    }
  }
`;
const CREATE_HELP_REQUEST = gql`
  mutation CreateHelpRequest($title: String!, $description: String!) {
    createHelpRequest(title: $title, description: $description) {
      id title description status createdAt author { id name } volunteers { id name }
    }
  }
`;
const VOLUNTEER_FOR_HELP = gql`
  mutation VolunteerForHelp($requestId: ID!) {
    volunteerForHelp(requestId: $requestId) {
      id status volunteers { id name }
    }
  }
`;
const FULFILL_HELP_REQUEST = gql`
  mutation FulfillHelpRequest($requestId: ID!) {
    fulfillHelpRequest(requestId: $requestId) {
      id status volunteers { id name }
    }
  }
`;
const DELETE_HELP_REQUEST = gql`
  mutation DeleteHelpRequest($id: ID!) {
    deleteHelpRequest(id: $id)
  }
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function matchVolunteersWithGemini(request) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a community volunteer matching assistant. For this help request: "${request.title} - ${request.description}", suggest what type of volunteer or skill would be ideal to help, and provide 2-3 specific tips for finding the right volunteer in a neighborhood setting. Keep it concise and practical.` }] }]
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate match.";
  } catch {
    return "AI volunteer matching failed. Please check your Gemini API key.";
  }
}

export default function HelpRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(GET_HELP_REQUESTS);
  const [createHelpRequest, { loading: creating }] = useMutation(CREATE_HELP_REQUEST, {
    onCompleted: () => { refetch(); setForm({ title: "", description: "" }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [volunteerForHelp] = useMutation(VOLUNTEER_FOR_HELP, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });
  const [fulfillHelpRequest] = useMutation(FULFILL_HELP_REQUEST, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });
  const [deleteHelpRequest] = useMutation(DELETE_HELP_REQUEST, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });

  const [form, setForm] = useState({ title: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const [matches, setMatches] = useState({});
  const [matching, setMatching] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return alert("Please fill in all fields.");
    createHelpRequest({ variables: form });
  };

  const handleMatch = async (req) => {
    setMatching((s) => ({ ...s, [req.id]: true }));
    const result = await matchVolunteersWithGemini(req);
    setMatches((s) => ({ ...s, [req.id]: result }));
    setMatching((s) => ({ ...s, [req.id]: false }));
  };

  const hasVolunteered = (req) => req.volunteers?.some((v) => v.id === user?.id);
  const isAuthor = (req) => req.author?.id === user?.id;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-blue-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🤝 Neighborhood Help Requests</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
            {showForm ? "Cancel" : "+ Request Help"}
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Post a Help Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="title" placeholder="What do you need help with?" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <textarea name="description" placeholder="Describe your request in detail..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              <button type="submit" disabled={creating} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {creating ? "Posting..." : "Submit Request"}
              </button>
            </form>
          </div>
        )}
        {loading && <p className="text-center text-gray-500 mt-10">Loading requests...</p>}
        {error && <p className="text-center text-red-500 mt-10">Error loading requests.</p>}
        <div className="space-y-4">
          {data?.getHelpRequests?.map((req) => (
            <div key={req.id} className={`bg-white rounded-xl shadow p-6 border ${req.status === "fulfilled" ? "border-green-200 opacity-75" : "border-gray-100"}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{req.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${req.status === "fulfilled" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {req.status === "fulfilled" ? "✅ Fulfilled" : "🔵 Open"}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(parseInt(req.createdAt)).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{req.description}</p>

              {req.volunteers?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-blue-600 font-semibold mb-1">👋 Volunteers ({req.volunteers.length})</p>
                  <p className="text-xs text-blue-800">{req.volunteers.map((v) => v.name).join(", ")}</p>
                </div>
              )}

              {matches[req.id] && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-green-600 mb-1">🤖 AI Volunteer Match Suggestions</p>
                  <p className="text-sm text-green-800 whitespace-pre-wrap">{matches[req.id]}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs text-gray-400">by <span className="font-medium text-gray-600">{req.author?.name}</span></span>
                <div className="flex flex-wrap gap-2">
                  {!isAuthor(req) && req.status === "open" && (
                    <button
                      onClick={() => volunteerForHelp({ variables: { requestId: req.id } })}
                      disabled={hasVolunteered(req)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {hasVolunteered(req) ? "✅ Volunteered" : "🙋 Volunteer"}
                    </button>
                  )}
                  {isAuthor(req) && req.status === "open" && (
                    <button
                      onClick={() => fulfillHelpRequest({ variables: { requestId: req.id } })}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition">
                      ✅ Mark Fulfilled
                    </button>
                  )}
                  <button onClick={() => handleMatch(req)} disabled={matching[req.id]}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition disabled:opacity-50">
                    {matching[req.id] ? "Finding match..." : "🤖 AI Match"}
                  </button>
                  {isAuthor(req) && (
                    <button
                      onClick={() => { if (window.confirm("Delete this request?")) deleteHelpRequest({ variables: { id: req.id } }); }}
                      className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition">
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.getHelpRequests?.length === 0 && <p className="text-center text-gray-400 py-10">No help requests yet.</p>}
        </div>
      </div>
    </div>
  );
}
