import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleMenus = {
  resident: [
    { label: "📰 Local News & Discussions", desc: "Read and post local updates", path: "/news" },
    { label: "🤝 Help Requests", desc: "Ask for or offer help in your neighborhood", path: "/help-requests" },
    { label: "🚨 Emergency Alerts", desc: "View and report urgent community issues", path: "/emergency-alerts" },
  ],
  business: [
    { label: "🏪 My Business Listing", desc: "Manage your business profile and deals", path: "/business-listings" },
    { label: "⭐ Customer Reviews", desc: "View and respond to customer feedback", path: "/reviews" },
    { label: "📢 Post a Deal", desc: "Promote special offers to the community", path: "/post-deal" },
  ],
  organizer: [
    { label: "📅 Manage Events", desc: "Create and promote community events", path: "/events" },
    { label: "🙋 Volunteer Matching", desc: "Find volunteers for your events", path: "/volunteer-matching" },
    { label: "📊 Community Insights", desc: "View engagement trends and analytics", path: "/community-insights" },
  ],
};

const roleColors = {
  resident: "bg-green-100 text-green-700",
  business: "bg-purple-100 text-purple-700",
  organizer: "bg-orange-100 text-orange-700",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Hello, <strong>{user.name}</strong>
          </span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${roleColors[user.role]}`}>
            {user.role}
          </span>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-4xl mx-auto mt-10 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {user.name}! 👋
        </h2>
        <p className="text-gray-500 mb-8">
          Here's what you can do as a{" "}
          <span className="font-semibold capitalize">{user.role}</span>:
        </p>

        {/* Role menu cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleMenus[user.role]?.map((item, i) => (
            <div
              key={i}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl shadow p-6 hover:shadow-md transition cursor-pointer border border-gray-100 hover:border-blue-300"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.label}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="mt-10 bg-white rounded-xl shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Account</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Role:</span> <span className="capitalize">{user.role}</span></p>
            <p><span className="font-medium">User ID:</span> {user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}