import { gql, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_POSTS = gql`query { getPosts { id title createdAt author { id name } } }`;
const GET_HELP_REQUESTS = gql`query { getHelpRequests { id createdAt } }`;
const GET_ALERTS = gql`query { getEmergencyAlerts { id title createdAt } }`;
const GET_EVENTS = gql`query { getEvents { id title date location } }`;
const GET_LISTINGS = gql`query { getBusinessListings { id name category } }`;

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${color}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold text-gray-600">{label}</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

export default function CommunityInsights() {
  const navigate = useNavigate();
  const { data: postsData } = useQuery(GET_POSTS);
  const { data: helpData } = useQuery(GET_HELP_REQUESTS);
  const { data: alertsData } = useQuery(GET_ALERTS);
  const { data: eventsData } = useQuery(GET_EVENTS);
  const { data: listingsData } = useQuery(GET_LISTINGS);

  const posts = postsData?.getPosts || [];
  const helpRequests = helpData?.getHelpRequests || [];
  const alerts = alertsData?.getEmergencyAlerts || [];
  const events = eventsData?.getEvents || [];
  const listings = listingsData?.getBusinessListings || [];

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentPosts = posts.filter(p => parseInt(p.createdAt) > oneWeekAgo);
  const recentHelp = helpRequests.filter(h => parseInt(h.createdAt) > oneWeekAgo);
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());

  const categoryCount = listings.reduce((acc, b) => { acc[b.category] = (acc[b.category] || 0) + 1; return acc; }, {});

  const authorCount = posts.reduce((acc, p) => {
    if (p.author?.name) acc[p.author.name] = (acc[p.author.name] || 0) + 1;
    return acc;
  }, {});
  const topContributors = Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-slate-700 text-white px-6 py-5 shadow-lg">
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

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <h1 className="font-headline text-4xl font-extrabold text-gray-900 mb-2">
          📊 Community Insights
        </h1>
        <p className="text-gray-600 mb-8">Overview of community engagement and activity metrics</p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <StatCard icon="📰" label="Total Posts" value={posts.length} color="border-blue-400" />
          <StatCard icon="🤝" label="Help Requests" value={helpRequests.length} color="border-green-400" />
          <StatCard icon="🚨" label="Alerts" value={alerts.length} color="border-red-400" />
          <StatCard icon="📅" label="Events" value={events.length} color="border-orange-400" />
          <StatCard icon="🏪" label="Businesses" value={listings.length} color="border-purple-400" />
        </div>

        {/* Two-Column Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Activity This Week */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">📈 Activity This Week</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700 font-semibold">📰 New Posts</span>
                <span className="text-2xl font-bold text-blue-600">{recentPosts.length}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700 font-semibold">🤝 Help Requests</span>
                <span className="text-2xl font-bold text-green-600">{recentHelp.length}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700 font-semibold">📅 Upcoming Events</span>
                <span className="text-2xl font-bold text-orange-600">{upcomingEvents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">🚨 Active Alerts</span>
                <span className="text-2xl font-bold text-red-600">{alerts.length}</span>
              </div>
            </div>
          </div>

          {/* Business Categories */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">🏪 Business Categories</h2>
            {Object.keys(categoryCount).length === 0 ? (
              <p className="text-gray-400">No businesses listed yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(categoryCount).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold capitalize">{cat}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 bg-purple-200 rounded-full" style={{ width: "100px" }}>
                        <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${(count / listings.length) * 100}%` }} />
                      </div>
                      <span className="font-bold text-purple-700 min-w-fit">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Contributors */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">🏆 Top Contributors</h2>
            {topContributors.length === 0 ? (
              <p className="text-gray-400">No posts yet</p>
            ) : (
              <div className="space-y-3">
                {topContributors.map(([name, count], i) => (
                  <div key={name} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "✨"}
                      </span>
                      <span className="font-semibold text-gray-900">{name}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">📅 Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-400">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="pb-3 border-b border-gray-200 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full whitespace-nowrap ml-2">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}