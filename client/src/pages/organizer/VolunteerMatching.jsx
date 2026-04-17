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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-orange-500 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-orange-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🙋 Volunteer Matching</h2>
        <p className="text-gray-500 text-sm mb-6">Use AI to match community members to your events based on their help requests.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Help Requests Panel */}
          <div className="md:col-span-1">
            <h3 className="text-base font-semibold text-gray-700 mb-3">🤝 Community Help Requests</h3>
            {helpLoading && <p className="text-gray-400 text-sm">Loading...</p>}
            <div className="space-y-2">
              {helpData?.getHelpRequests?.map(req => (
                <div key={req.id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-800">{req.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{req.description}</p>
                  <p className="text-xs text-blue-500 mt-1">👤 {req.author?.name}</p>
                </div>
              ))}
              {helpData?.getHelpRequests?.length === 0 && <p className="text-xs text-gray-400">No help requests yet.</p>}
            </div>
          </div>
          {/* Events + AI Matching */}
          <div className="md:col-span-2">
            <h3 className="text-base font-semibold text-gray-700 mb-3">📅 Find Volunteers for Events</h3>
            {eventsLoading && <p className="text-gray-400 text-sm">Loading...</p>}
            {upcomingEvents.length === 0 && !eventsLoading && (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
                <p className="text-gray-400">No upcoming events. <button onClick={() => navigate("/events")} className="text-orange-500 underline">Create one first.</button></p>
              </div>
            )}
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white rounded-xl shadow p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-1">{event.title}</h4>
                  <p className="text-sm text-gray-500 mb-1">{event.description}</p>
                  <p className="text-xs text-gray-400 mb-3">🗓️ {new Date(event.date).toLocaleString()} · 📍 {event.location}</p>
                  {matches[event.id] && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">🤖 AI Volunteer Match Suggestions</p>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">{matches[event.id]}</p>
                    </div>
                  )}
                  <button onClick={() => handleMatch(event)} disabled={matching[event.id]}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-200 transition disabled:opacity-50">
                    {matching[event.id] ? "🤖 Finding volunteers..." : "🤖 AI Match Volunteers"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}