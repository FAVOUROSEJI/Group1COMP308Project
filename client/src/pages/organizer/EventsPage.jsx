import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const GET_EVENTS = gql`
  query {
    getEvents {
      id title description date location
      organizer { id name }
      volunteers { id name }
    }
  }
`;
const CREATE_EVENT = gql`
  mutation CreateEvent($title: String!, $description: String!, $date: String!, $location: String!) {
    createEvent(title: $title, description: $description, date: $date, location: $location) {
      id title description date location organizer { id name } volunteers { id name }
    }
  }
`;
const JOIN_EVENT = gql`
  mutation JoinEvent($eventId: ID!) {
    joinEvent(eventId: $eventId) {
      id volunteers { id name }
    }
  }
`;
const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function callGeminiWithRetry(prompt, retries = 3) {
  const models = ["gemini-3-flash-preview"];
  for (const model of models) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        if (res.status === 503) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        if (!res.ok) continue;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  return null;
}

async function predictBestTiming(title, description) {
  const prompt = `You are a community event planning assistant. For this event: "${title} - ${description}", suggest the best day of the week and time of day to maximize community attendance. Explain your reasoning briefly in 2-3 sentences.`;
  const result = await callGeminiWithRetry(prompt);
  return result || "AI timing prediction is temporarily unavailable. Please try again in a moment.";
}


export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, refetch } = useQuery(GET_EVENTS);
  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT, {
    onCompleted: () => { refetch(); setForm({ title: "", description: "", date: "", location: "" }); setShowForm(false); },
    onError: (e) => alert(e.message),
  });
  const [joinEvent] = useMutation(JOIN_EVENT, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    onCompleted: () => refetch(),
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

  const hasJoined = (event) => event.volunteers?.some((v) => v.id === user?.id);
  const isOrganizer = (event) => event.organizer?.id === user?.id;

  const upcoming = data?.getEvents?.filter(e => new Date(e.date) >= new Date()) || [];
  const past = data?.getEvents?.filter(e => new Date(e.date) < new Date()) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-orange-600 text-white px-6 py-5 shadow-lg">
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
              📅 Community Events
            </h1>
            <p className="text-gray-600">Create and manage community events that bring neighbors together</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-orange-600 hover:bg-orange-700 text-white font-headline font-bold px-6 py-3 rounded-full shadow-lg transition-all">
            {showForm ? "Cancel" : "+ Create Event"}
          </button>
        </div>

        {/* AI Timing Predictor */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-8">
          <p className="text-sm font-bold text-orange-700 mb-4">🤖 AI EVENT TIMING PREDICTOR</p>
          <div className="space-y-3">
            <input placeholder="Event title" value={aiForm.title} onChange={(e) => setAiForm({ ...aiForm, title: e.target.value })}
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
            <input placeholder="Brief description (optional)" value={aiForm.description} onChange={(e) => setAiForm({ ...aiForm, description: e.target.value })}
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
            <button onClick={handleAiSuggest} disabled={aiLoading} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2 rounded-full transition-all">
              {aiLoading ? "Predicting..." : "Get Best Timing Suggestion"}
            </button>
          </div>
          {aiSuggestion && <p className="text-sm text-orange-900 mt-4 bg-orange-100 rounded-lg p-4">{aiSuggestion}</p>}
        </div>

        {/* Create Event Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-orange-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">Create Community Event</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
                <input placeholder="Event name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea placeholder="What is this event about?" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:bg-white transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time</label>
                <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location / Venue</label>
                <input placeholder="Where will this happen?" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all">
                {creating ? "Creating..." : "Create Event"}
              </button>
            </form>
          </div>
        )}

        {loading && <div className="text-center py-12"><p className="text-gray-500 text-lg">Loading events...</p></div>}

        {upcoming.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">📅 Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">Upcoming</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">{event.description}</p>
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <p>🗓️ {new Date(event.date).toLocaleString()}</p>
                    <p>📍 {event.location}</p>
                    <p className="text-xs text-gray-500">by {event.organizer?.name}</p>
                  </div>

                  {event.volunteers?.length > 0 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-4">
                      <p className="text-xs text-orange-600 font-semibold mb-1">🙋 Volunteers ({event.volunteers.length})</p>
                      <p className="text-xs text-orange-800">{event.volunteers.map((v) => v.name).join(", ")}</p>
                    </div>
                  )}

                  {timings[event.id] && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <p className="text-xs font-bold text-orange-700 mb-2">🤖 AI TIMING ANALYSIS</p>
                      <p className="text-sm text-orange-900 leading-relaxed">{timings[event.id]}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {!isOrganizer(event) && (
                      <button
                        onClick={() => joinEvent({ variables: { eventId: event.id } })}
                        disabled={hasJoined(event)}
                        className="flex-1 bg-orange-600 text-white font-bold px-4 py-2 rounded-full hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        {hasJoined(event) ? "✅ Joined" : "🙋 Join Event"}
                      </button>
                    )}
                    <button onClick={() => handlePredict(event)} disabled={predicting[event.id]}
                      className="flex-1 bg-orange-100 hover:bg-orange-200 disabled:opacity-50 text-orange-700 font-bold px-4 py-2 rounded-full transition-all text-sm">
                      {predicting[event.id] ? "🤖 Analyzing..." : "🤖 Get Timing Analysis"}
                    </button>
                    {isOrganizer(event) && (
                      <button
                        onClick={() => { if (window.confirm("Delete this event?")) deleteEvent({ variables: { id: event.id } }); }}
                        className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded-full hover:bg-red-200 transition font-bold">
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-headline font-bold text-gray-500 mb-6">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {past.map((event) => (
                <div key={event.id} className="bg-gray-100 rounded-2xl p-6 border border-gray-300 opacity-60">
                  <p className="font-bold text-gray-700">{event.title}</p>
                  <p className="text-xs text-gray-600 mt-2">🗓️ {new Date(event.date).toLocaleDateString()} • 📍 {event.location}</p>
                  <p className="text-xs text-gray-500 mt-1">by {event.organizer?.name}</p>
                  {isOrganizer(event) && (
                    <button
                      onClick={() => { if (window.confirm("Delete this event?")) deleteEvent({ variables: { id: event.id } }); }}
                      className="mt-2 text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition">
                      🗑️ Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.getEvents?.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <p className="text-5xl mb-3">📅</p>
            <p className="text-gray-500 font-semibold text-lg">No events yet</p>
            <p className="text-gray-400 mt-2">Create the first community event to bring neighbors together</p>
          </div>
        )}
      </main>
    </div>
  );
}
