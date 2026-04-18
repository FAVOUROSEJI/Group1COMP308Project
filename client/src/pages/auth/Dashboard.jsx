import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleMenus = {
  resident: [
    { label: "📰 Local News & Discussions", desc: "Read and post local updates", path: "/news", icon: "📰", color: "bg-blue-50 border-blue-200 hover:border-blue-400" },
    { label: "🤝 Help Requests", desc: "Ask for or offer help in your neighborhood", path: "/help-requests", icon: "🤝", color: "bg-green-50 border-green-200 hover:border-green-400" },
    { label: "🚨 Emergency Alerts", desc: "View and report urgent community issues", path: "/emergency-alerts", icon: "🚨", color: "bg-red-50 border-red-200 hover:border-red-400" },
  ],
  business: [
    { label: "🏪 My Business Listing", desc: "Manage your business profile and deals", path: "/business-listings", icon: "🏪", color: "bg-purple-50 border-purple-200 hover:border-purple-400" },
    { label: "⭐ Customer Reviews", desc: "View and respond to customer feedback", path: "/reviews", icon: "⭐", color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400" },
    { label: "📢 Post a Deal", desc: "Promote special offers to the community", path: "/post-deal", icon: "📢", color: "bg-indigo-50 border-indigo-200 hover:border-indigo-400" },
  ],
  organizer: [
    { label: "📅 Manage Events", desc: "Create and promote community events", path: "/events", icon: "📅", color: "bg-orange-50 border-orange-200 hover:border-orange-400" },
    { label: "🙋 Volunteer Matching", desc: "Find volunteers for your events", path: "/volunteer-matching", icon: "🙋", color: "bg-green-50 border-green-200 hover:border-green-400" },
    { label: "📊 Community Insights", desc: "View engagement trends and analytics", path: "/community-insights", icon: "📊", color: "bg-slate-50 border-slate-200 hover:border-slate-400" },
  ],
};

const roleColors = {
  resident: { bg: "bg-blue-600", badge: "bg-blue-100 text-blue-700" },
  business: { bg: "bg-purple-600", badge: "bg-purple-100 text-purple-700" },
  organizer: { bg: "bg-orange-600", badge: "bg-orange-100 text-orange-700" },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const currentRoleConfig = roleColors[user?.role] || roleColors.resident;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className={`${currentRoleConfig.bg} text-white px-6 py-5 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl">
              🏘️
            </div>
            <span className="font-headline font-black text-xl tracking-tight">Neighbourhood Hub</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-headline font-bold">Hello, {user?.name}!</p>
                <p className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${currentRoleConfig.badge}`}>
                  {user?.role === "business" ? "Business Owner" : user?.role === "organizer" ? "Organizer" : "Resident"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2 rounded-full transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Here's what you can do as a <span className="font-bold capitalize">{user?.role}</span>
          </p>
        </div>

        {/* Role Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {roleMenus[user?.role]?.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`p-8 rounded-2xl border-2 ${item.color} transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer text-left group`}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-headline font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                {item.label}
              </h3>
              <p className="text-gray-600">{item.desc}</p>
            </button>
          ))}
        </div>

        {/* Account Information Card */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">Your Account</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Full Name</span>
                <span className="text-gray-900 font-semibold">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Email Address</span>
                <span className="text-gray-900 font-semibold truncate">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Community Role</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full capitalize ${currentRoleConfig.badge}`}>
                  {user?.role === "business" ? "Business Owner" : user?.role === "organizer" ? "Organizer" : "Resident"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-600 font-medium">User ID</span>
                <span className="text-gray-500 text-sm font-mono">{user?.id?.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">Community Stats</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Members Online</p>
                  <p className="text-2xl font-bold text-gray-900">247</p>
                </div>
                <span className="text-3xl">👥</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">42</p>
                </div>
                <span className="text-3xl">📅</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Listings</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
                <span className="text-3xl">🏪</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}