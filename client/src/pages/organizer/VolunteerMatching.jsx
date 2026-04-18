import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_HELP_REQUESTS = gql`
  query { getHelpRequests { id title description author { id name } } }
`;
const GET_EVENTS = gql`
  query { getEvents { id title description date location organizer { id name } } }
`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function matchVolunteersForEvent(event, helpRequests) {
  try {
    const requestList = helpRequests.slice(0, 10).map(r => `- "${r.title}": ${r.description} (by ${r.author?.name})`).join("\n");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a community volunteer coordinator. For this event:\n"${event.title}" - ${event.description}\n\nCommunity members who have shown interest in helping:\n${requestList}\n\nBased on their help requests, suggest which community members might be good volunteers for this event and why. Also suggest what volunteer roles would be needed. Keep it concise (3-4 sentences).` }] }]
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate suggestions.";
  } catch {
    return "AI volunteer matching failed. Please check your Gemini API key.";
  }
}

export default function VolunteerMatching() {
  const navigate = useNavigate();
  const { data: helpData, loading: helpLoading } = useQuery(GET_HELP_REQUESTS);
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_EVENTS);
  const [matches, setMatches] = useState({});
  const [matching, setMatching] = useState({});

  const upcomingEvents = eventsData?.getEvents?.filter(e => new Date(e.date) >= new Date()) || [];

  const handleMatch = async (event) => {
    setMatching((s) => ({ ...s, [event.id]: true }));
    setMatches((s) => ({ ...s, [event.id]: null }));
    const result = await matchVolunteersForEvent(event, helpData?.getHelpRequests || []);
    setMatches((s) => ({ ...s, [event.id]: result }));
    setMatching((s) => ({ ...s, [event.id]: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100">
      {/* Navigation */}
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <h1 className="font-headline text-4xl font-extrabold text-gray-900 mb-2">
          🙋 Volunteer Matching
        </h1>
        <p className="text-gray-600 mb-8">Use AI to match community members to your events based on their help requests</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Help Requests Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200 sticky top-6">
              <h2 className="text-xl font-headline font-bold text-gray-900 mb-4">🤝 Community Help Requests</h2>
              {helpLoading && <p className="text-gray-400">Loading...</p>}
              <div className="space-y-3">
                {helpData?.getHelpRequests?.map(req => (
                  <div key={req.id} className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-sm font-bold text-gray-900">{req.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{req.description}</p>
                    <p className="text-xs text-green-600 font-semibold mt-2">👤 {req.author?.name}</p>
                  </div>
                ))}
                {helpData?.getHelpRequests?.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No help requests yet</p>}
              </div>
            </div>
          </div>

          {/* Events Panel */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">📅 Find Volunteers for Events</h2>
            {eventsLoading && <p className="text-gray-500 text-lg">Loading...</p>}
            {upcomingEvents.length === 0 && !eventsLoading && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
                <p className="text-5xl mb-3">📅</p>
                <p className="text-gray-500 font-semibold text-lg">No upcoming events</p>
                <button onClick={() => navigate("/events")} className="text-green-600 font-bold underline mt-2">Create one first</button>
              </div>
            )}
            <div className="space-y-6">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                    <p className="text-gray-700 mt-2">{event.description}</p>
                    <div className="flex gap-4 text-sm text-gray-600 mt-3">
                      <span>🗓️ {new Date(event.date).toLocaleString()}</span>
                      <span>📍 {event.location}</span>
                    </div>
                  </div>
                  {matches[event.id] && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-bold text-green-700 mb-2">🤖 AI VOLUNTEER MATCH SUGGESTIONS</p>
                      <p className="text-gray-800 text-sm leading-relaxed">{matches[event.id]}</p>
                    </div>
                  )}
                  <button onClick={() => handleMatch(event)} disabled={matching[event.id]}
                    className="w-full bg-green-100 hover:bg-green-200 disabled:opacity-50 text-green-700 font-bold px-4 py-3 rounded-full transition-all">
                    {matching[event.id] ? "🤖 Finding volunteers..." : "🤖 AI Match Volunteers"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}