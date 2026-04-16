import { useState } from "react";
import { gql } from "graphql-request";
import client from "./apollo/client";

const REGISTER_USER = gql`
  mutation Register($name: String!, $email: String!, $password: String!, $role: String) {
    register(name: $name, email: $email, password: $password, role: $role) {
      id name email role token
    }
  }
`;

const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id name email role token
    }
  }
`;

function Dashboard({ user, onLogout }) {
  const roleColors = {
    resident: "bg-green-100 text-green-700",
    business: "bg-purple-100 text-purple-700",
    organizer: "bg-orange-100 text-orange-700",
  };

  const roleMenus = {
    resident: [
      { label: "📰 Local News & Discussions", desc: "Read and post local updates" },
      { label: "🤝 Help Requests", desc: "Ask for or offer help in your neighborhood" },
      { label: "🚨 Emergency Alerts", desc: "View and report urgent community issues" },
    ],
    business: [
      { label: "🏪 My Business Listing", desc: "Manage your business profile and deals" },
      { label: "⭐ Customer Reviews", desc: "View and respond to customer feedback" },
      { label: "📢 Post a Deal", desc: "Promote special offers to the community" },
    ],
    organizer: [
      { label: "📅 Manage Events", desc: "Create and promote community events" },
      { label: "🙋 Volunteer Matching", desc: "Find volunteers for your events" },
      { label: "📊 Community Insights", desc: "View engagement trends and analytics" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🏘️ Neighborhood Hub</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Hello, <strong>{user.name}</strong></span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${roleColors[user.role]}`}>
            {user.role}
          </span>
          <button
            onClick={onLogout}
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
        <p className="text-gray-500 mb-8">Here's what you can do as a <span className="font-semibold capitalize">{user.role}</span>:</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleMenus[user.role]?.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-6 hover:shadow-md transition cursor-pointer border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.label}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* User info card */}
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

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "resident" });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const data = await client.request(LOGIN_USER, {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", data.login.token);
        localStorage.setItem("user", JSON.stringify(data.login));
        setUser(data.login);
      } else {
        const data = await client.request(REGISTER_USER, form);
        localStorage.setItem("token", data.register.token);
        localStorage.setItem("user", JSON.stringify(data.register));
        setUser(data.register);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Dashboard user={user} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Neighborhood Hub</h1>
        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-l-lg font-semibold ${isLogin ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-r-lg font-semibold ${!isLogin ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input name="name" placeholder="Full Name" onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          )}
          <input name="email" type="email" placeholder="Email" onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input name="password" type="password" placeholder="Password" onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          {!isLogin && (
            <select name="role" onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="resident">Resident</option>
              <option value="business">Business Owner</option>
              <option value="organizer">Community Organizer</option>
            </select>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}