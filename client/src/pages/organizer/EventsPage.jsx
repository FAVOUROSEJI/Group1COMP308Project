import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_EVENTS = gql`
  query { getEvents { id title description date location organizer { id name } } }
`;
const CREATE_EVENT = gql`
  mutation CreateEvent($title: String!, $description: String!, $date: String!, $location: String!) {
    createEvent(title: $title, description: $description, date: $date, location: $location) {
      id title description date location organizer { id name }
    }
  }
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function predictBestTiming(title, description) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a community event planning assistant. For this event: "${title} - ${description}", suggest the best day of the week and time of day to maximize community attendance. Explain your reasoning briefly in 2-3 sentences.` }] }]
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not predict timing.";
  } catch {
    return "AI timing prediction failed. Please check your Gemini API key.";
  }
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useQuery(GET_EVENTS);
  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT, {
    onCompleted: () => { refetch(); setForm({ title: "", description: "", date: "", location: "" }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });
  const [showForm, setShowForm] = useState(false);
  const [timings, setTimings] = useState({});
  const [predicting, setPredicting] = useState({});
  const [aiForm, setAiForm] = useState({ title: "", description: "" });
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.date || !form.location.trim()) return alert("Please fill in all fields.");
    createEvent({ variables: form });
  };

  const handlePredict = async (event) => {
    setPredicting((s) => ({ ...s, [event.id]: true }));
    const result = await predictBestTiming(event.title, event.description);
    setTimings((s) => ({ ...s, [event.id]: result }));
    setPredicting((s) => ({ ...s, [event.id]: false }));
  };

  const handleAiSuggest = async () => {
    if (!aiForm.title.trim()) return alert("Enter an event title first.");
    setAiLoading(true);
    const result = await predictBestTiming(aiForm.title, aiForm.description);
    setAiSuggestion(result);
    setAiLoading(false);
  };

  const upcoming = data?.getEvents?.filter(e => new Date(e.date) >= new Date()) || [];
  const past = data?.getEvents?.filter(e => new Date(e.date) < new Date()) || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-orange-500 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-orange-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📅 Community Events</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition text-sm">
            {showForm ? "Cancel" : "+ Create Event"}
          </button>
        </div>

        {/* AI Timing Helper */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-orange-700 mb-3">🤖 AI Event Timing Predictor</p>
          <div className="space-y-2">
            <input placeholder="Event title" value={aiForm.title} onChange={(e) => setAiForm({ ...aiForm, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input placeholder="Brief description (optional)" value={aiForm.description} onChange={(e) => setAiForm({ ...aiForm, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button onClick={handleAiSuggest} disabled={aiLoading} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition">
              {aiLoading ? "Predicting..." : "Get Best Timing Suggestion"}
            </button>
          </div>
          {aiSuggestion && <p className="text-sm text-orange-900 mt-3 bg-orange-100 rounded-lg p-3 whitespace-pre-wrap">{aiSuggestion}</p>}
        </div>

        {/* Create Event Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-orange-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create an Event</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <textarea placeholder="Describe the event..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input placeholder="Location / venue" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <button type="submit" disabled={creating} className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition">
                {creating ? "Creating..." : "Create Event"}
              </button>
            </form>
          </div>
        )}

        {loading && <p className="text-center text-gray-500 mt-10">Loading events...</p>}

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">📅 Upcoming</h3>
            <div className="space-y-4 mb-8">
              {upcoming.map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow p-5 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-semibold text-gray-800">{event.title}</h3>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Upcoming</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>🗓️ {new Date(event.date).toLocaleString()}</span>
                    <span>📍 {event.location}</span>
                  </div>
                  {timings[event.id] && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                      <p className="text-xs font-semibold text-orange-600 mb-1">🤖 AI Timing Analysis</p>
                      <p className="text-xs text-orange-800 whitespace-pre-wrap">{timings[event.id]}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">by {event.organizer?.name}</span>
                    <button onClick={() => handlePredict(event)} disabled={predicting[event.id]}
                      className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition disabled:opacity-50">
                      {predicting[event.id] ? "Analyzing..." : "🤖 Predict Best Timing"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-500 mb-3">Past Events</h3>
            <div className="space-y-3">
              {past.map((event) => (
                <div key={event.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 opacity-70">
                  <p className="text-sm font-semibold text-gray-600">{event.title}</p>
                  <p className="text-xs text-gray-400">{new Date(event.date).toLocaleDateString()} · {event.location}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {data?.getEvents?.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-10">No events yet. Create the first one!</p>
        )}
      </div>
    </div>
  );
}