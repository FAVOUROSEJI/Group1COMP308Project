import { gql, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_POSTS = gql`query { getPosts { id title createdAt author { id name } } }`;
const GET_HELP_REQUESTS = gql`query { getHelpRequests { id createdAt } }`;
const GET_ALERTS = gql`query { getEmergencyAlerts { id title createdAt } }`;
const GET_EVENTS = gql`query { getEvents { id title date location } }`;
const GET_LISTINGS = gql`query { getBusinessListings { id name category } }`;

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-orange-500 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-white text-orange-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100">← Dashboard</button>
      </nav>
      <div className="max-w-5xl mx-auto mt-8 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Community Insights</h2>
        <p className="text-gray-500 text-sm mb-6">Overview of community engagement and activity.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon="📰" label="Total Posts" value={posts.length} color="border-blue-400" />
          <StatCard icon="🤝" label="Help Requests" value={helpRequests.length} color="border-green-400" />
          <StatCard icon="🚨" label="Alerts" value={alerts.length} color="border-red-400" />
          <StatCard icon="📅" label="Events" value={events.length} color="border-orange-400" />
          <StatCard icon="🏪" label="Businesses" value={listings.length} color="border-purple-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4">📈 Activity This Week</h3>
            <div className="space-y-3">
              {[["📰 New Posts", recentPosts.length, "text-blue-600"],
              ["🤝 New Help Requests", recentHelp.length, "text-green-600"],
              ["📅 Upcoming Events", upcomingEvents.length, "text-orange-600"],
              ["🚨 Active Alerts", alerts.length, "text-red-600"]
              ].map(([label, val, color]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`font-bold ${color}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4">🏪 Business Categories</h3>
            {Object.keys(categoryCount).length === 0 ? <p className="text-gray-400 text-sm">No businesses listed yet.</p> : (
              <div className="space-y-2">
                {Object.entries(categoryCount).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-purple-200" style={{ width: `${(count / listings.length) * 80}px` }}>
                        <div className="h-2 bg-purple-500 rounded-full w-full" />
                      </div>
                      <span className="text-sm font-semibold text-purple-700">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4">🏆 Top Contributors</h3>
            {topContributors.length === 0 ? <p className="text-gray-400 text-sm">No posts yet.</p> : (
              <div className="space-y-2">
                {topContributors.map(([name, count], i) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{["🥇", "🥈", "🥉"][i] || `${i + 1}.`} {name}</span>
                    <span className="text-sm font-semibold text-blue-600">{count} post{count !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4">📅 Upcoming Events</h3>
            {upcomingEvents.length === 0 ? <p className="text-gray-400 text-sm">No upcoming events.</p> : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 4).map(event => (
                  <div key={event.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{event.title}</p>
                      <p className="text-xs text-gray-400">{event.location}</p>
                    </div>
                    <span className="text-xs text-orange-600 font-semibold">{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}