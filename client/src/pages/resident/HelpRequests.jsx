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
    volunteerForHelp(requestId: $requestId) { id status volunteers { id name } }
  }
`;
const FULFILL_HELP_REQUEST = gql`
  mutation FulfillHelpRequest($requestId: ID!) {
    fulfillHelpRequest(requestId: $requestId) { id status volunteers { id name } }
  }
`;
const DELETE_HELP_REQUEST = gql`
  mutation DeleteHelpRequest($id: ID!) { deleteHelpRequest(id: $id) }
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100">
      <nav className="bg-green-600 text-white px-6 py-5 shadow-lg">
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
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-headline text-4xl font-extrabold text-gray-900 mb-2">🤝 Neighborhood Help Requests</h1>
            <p className="text-gray-600">Ask for or offer help to neighbors in need</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 text-white font-headline font-bold px-6 py-3 rounded-full shadow-lg transition-all">
            {showForm ? "Cancel" : "+ Request Help"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-green-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">Post a Help Request</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">What do you need help with?</label>
                <input name="title" placeholder="e.g., Need help moving boxes, Car repair needed" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Describe your request</label>
                <textarea name="description" placeholder="Provide details about what you need..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:bg-white transition resize-none" />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all">
                {creating ? "Posting..." : "Submit Request"}
              </button>
            </form>
          </div>
        )}

        {loading && <div className="text-center py-12"><p className="text-gray-500 text-lg">Loading requests...</p></div>}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold">Error loading requests</p></div>}

        <div className="space-y-5">
          {data?.getHelpRequests?.map((req) => (
            <div key={req.id} className={`bg-white rounded-2xl shadow p-6 border hover:shadow-lg transition-all ${req.status === "fulfilled" ? "border-green-200 opacity-75" : "border-gray-200"}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{req.title}</h3>
                  <p className="text-gray-600 mt-2">{req.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${req.status === "fulfilled" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {req.status === "fulfilled" ? "✅ Fulfilled" : "🔵 Open"}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(parseInt(req.createdAt)).toLocaleDateString()}</span>
                </div>
              </div>

              {req.volunteers?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-blue-600 font-semibold mb-1">👋 Volunteers ({req.volunteers.length})</p>
                  <p className="text-xs text-blue-800">{req.volunteers.map((v) => v.name).join(", ")}</p>
                </div>
              )}

              {matches[req.id] && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-bold text-green-700 mb-2">🤖 AI Volunteer Match Suggestions</p>
                  <p className="text-sm text-green-800">{matches[req.id]}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">Posted by <span className="font-semibold text-gray-700">{req.author?.name}</span></span>
                <div className="flex flex-wrap gap-2">
                  {!isAuthor(req) && req.status === "open" && (
                    <button onClick={() => volunteerForHelp({ variables: { requestId: req.id } })} disabled={hasVolunteered(req)}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition disabled:opacity-50">
                      {hasVolunteered(req) ? "✅ Volunteered" : "🙋 Volunteer"}
                    </button>
                  )}
                  {isAuthor(req) && req.status === "open" && (
                    <button onClick={() => fulfillHelpRequest({ variables: { requestId: req.id } })}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition">
                      ✅ Mark Fulfilled
                    </button>
                  )}
                  <button onClick={() => handleMatch(req)} disabled={matching[req.id]}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition disabled:opacity-50">
                    {matching[req.id] ? "🤖 Finding..." : "🤖 AI Match"}
                  </button>
                  {isAuthor(req) && (
                    <button onClick={() => { if (window.confirm("Delete this request?")) deleteHelpRequest({ variables: { id: req.id } }); }}
                      className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-200 transition">
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.getHelpRequests?.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-3">🆘</p>
              <p className="text-gray-500 font-semibold">No help requests yet</p>
              <p className="text-gray-400">Be the first to ask for help in your community</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
