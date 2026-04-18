import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: "📰",
      title: "Local News Feed",
      description: "Read community posts, news, and updates with AI-powered summaries for quick insights",
      path: user ? "/news" : "/auth",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-600"
    },
    {
      icon: "🆘",
      title: "Help Requests",
      description: "Request assistance from neighbors or help someone in need in your community",
      path: user ? "/help-requests" : "/auth",
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-600"
    },
    {
      icon: "🚨",
      title: "Emergency Alerts",
      description: "Stay informed about critical neighborhood emergencies and safety updates",
      path: user ? "/emergency-alerts" : "/auth",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-600"
    },
    {
      icon: "🏪",
      title: "Business Listings",
      description: "Discover local businesses, exclusive deals, and shop local with your neighbors",
      path: user ? "/business-listings" : "/auth",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-600"
    },
    {
      icon: "🎉",
      title: "Community Events",
      description: "Organize and attend local events, workshops, and community gatherings",
      path: user ? "/events" : "/auth",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-600"
    },
    {
      icon: "🤝",
      title: "Volunteer Matching",
      description: "AI-powered matching to connect volunteers with community needs",
      path: user ? "/volunteer-matching" : "/auth",
      color: "bg-indigo-50 border-indigo-200",
      textColor: "text-indigo-600"
    },
  ];

  const userRoles = [
    {
      role: "👤 Residents",
      description: "Connect with neighbors, stay updated, request help, and participate in community activities",
      features: ["News Feed", "Help Requests", "Emergency Alerts", "Events"]
    },
    {
      role: "🏢 Business Owners",
      description: "Showcase your business, post exclusive deals, and connect with local customers",
      features: ["Business Listings", "Post Deals", "Customer Reviews", "Analytics"]
    },
    {
      role: "📋 Organizers",
      description: "Manage community events, volunteer programs, and gather community insights",
      features: ["Events", "Volunteer Matching", "Community Insights", "Analytics"]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 font-headline">
            🏘️ Neighbourhood Hub
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/auth")}
                  className="px-6 py-2 rounded-full text-blue-600 border border-blue-600 font-semibold hover:bg-blue-50 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md"
                >
                  Join
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold font-headline text-gray-900 mb-6">
            Connect with your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Neighborhood</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            The ultimate platform for residents, business owners, and community organizers to share news, post deals, request help, and manage local events. Build a vibrant community where everyone belongs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight * 1.2, behavior: 'smooth' })}
              className="px-8 py-4 rounded-full border-2 border-gray-300 text-gray-700 font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              Learn More
            </button>
          </div>
        </section>

        {/* User Roles Section */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-16 font-headline">
              For Every Role in the Community
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {userRoles.map((item, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 font-headline">{item.role}</h3>
                  <p className="text-gray-600 mb-6">{item.description}</p>
                  <div className="space-y-2">
                    {item.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-700">
                        <span className="text-blue-600">✓</span> {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-16 font-headline">
            Explore All Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <button
                key={idx}
                onClick={() => navigate(feature.path)}
                className={`p-6 rounded-2xl border-2 hover:shadow-lg transition-all transform hover:scale-105 text-left ${feature.color}`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-headline">{feature.title}</h3>
                <p className="text-gray-700 text-sm">{feature.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Key Stats Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 px-6 text-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center mb-16 font-headline">
              Join Thousands of Neighbors
            </h2>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-black mb-2">10K+</div>
                <p className="text-lg opacity-90">Active Members</p>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">500+</div>
                <p className="text-lg opacity-90">Local Businesses</p>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">1K+</div>
                <p className="text-lg opacity-90">Monthly Events</p>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">4.8★</div>
                <p className="text-lg opacity-90">Community Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-16 font-headline">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Sign Up", desc: "Create your account and choose your role" },
              { num: "2", title: "Explore", desc: "Browse events, news, and community needs" },
              { num: "3", title: "Connect", desc: "Engage with neighbors and local businesses" },
              { num: "4", title: "Impact", desc: "Make a difference in your community" },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-4 font-headline">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-headline">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-1 bg-gradient-to-r from-blue-400 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-900 text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold mb-6 font-headline">
              Ready to Connect?
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Join your neighborhood community today and start making an impact where you live.
            </p>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="px-10 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              {user ? "Go to Dashboard" : "Get Started for Free"}
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 font-headline">Neighbourhood Hub</h3>
              <p className="text-gray-600">Connecting communities, one neighborhood at a time.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" onClick={() => navigate(user ? "/news" : "/auth")} className="hover:text-blue-600">News Feed</a></li>
                <li><a href="#" onClick={() => navigate(user ? "/events" : "/auth")} className="hover:text-blue-600">Events</a></li>
                <li><a href="#" onClick={() => navigate(user ? "/help-requests" : "/auth")} className="hover:text-blue-600">Help Requests</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">For Business</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" onClick={() => navigate(user ? "/business-listings" : "/auth")} className="hover:text-blue-600">Business Listings</a></li>
                <li><a href="#" onClick={() => navigate(user ? "/post-deal" : "/auth")} className="hover:text-blue-600">Post Deals</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Community</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-600">About</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-8 text-center text-gray-600">
            <p>&copy; 2026 Neighbourhood Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
