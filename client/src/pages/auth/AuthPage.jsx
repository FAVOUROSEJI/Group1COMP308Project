import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

const roleDescriptions = {
  resident: {
    title: "👤 Resident",
    description: "Connect with neighbors, share news, and participate in community activities",
    icon: "👨‍👩‍👧‍👦"
  },
  business: {
    title: "🏢 Business Owner",
    description: "Showcase your business, post deals, and engage with local customers",
    icon: "🏪"
  },
  organizer: {
    title: "📋 Organizer",
    description: "Manage events, coordinate volunteers, and lead community initiatives",
    icon: "🎯"
  }
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "resident" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginMutation, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_USER, {
    onCompleted: (data) => {
      login(data.login);
      navigate("/dashboard");
    },
    onError: (err) => {
      setErrors({ submit: err.message || "Login failed. Please try again." });
    },
  });

  const [registerMutation, { loading: registerLoading, error: registerError }] = useMutation(REGISTER_USER, {
    onCompleted: (data) => {
      login(data.register);
      navigate("/dashboard");
    },
    onError: (err) => {
      setErrors({ submit: err.message || "Registration failed. Please try again." });
    },
  });

  const loading = loginLoading || registerLoading;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (!isLogin) {
      if (!form.name) newErrors.name = "Full name is required";
      if (!form.role) newErrors.role = "Please select a role";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLogin) {
      loginMutation({ variables: { email: form.email, password: form.password } });
    } else {
      registerMutation({ variables: form });
    }
  };

  const handleGoHome = () => navigate("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl -ml-48 -mb-48"></div>

          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-3 mb-8 bg-white/10 backdrop-blur px-4 py-2 rounded-full w-fit border border-white/20">
              <span className="text-2xl">✨</span>
              <span className="text-white font-headline font-semibold text-sm">Welcome to the Hub</span>
            </div>

            <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Connect with Your <span className="text-yellow-300">Neighborhood</span>
            </h1>

            <p className="text-white/90 text-lg leading-relaxed mb-12">
              Join thousands of neighbors building stronger communities through shared experiences, local events, and meaningful connections.
            </p>

            {/* Feature cards */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all">
                <div className="flex gap-3">
                  <span className="text-2xl">🤝</span>
                  <div>
                    <h3 className="font-headline font-bold text-white">Local Communities</h3>
                    <p className="text-white/70 text-sm">Find your local hub and connect with nearby neighbors</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all">
                <div className="flex gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <h3 className="font-headline font-bold text-white">Community Events</h3>
                    <p className="text-white/70 text-sm">Discover and attend events happening in your area</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all">
                <div className="flex gap-3">
                  <span className="text-2xl">💼</span>
                  <div>
                    <h3 className="font-headline font-bold text-white">Support Local</h3>
                    <p className="text-white/70 text-sm">Discover local businesses and exclusive neighborhood deals</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand anchor */}
            <div className="mt-16 flex items-center gap-2 pt-8 border-t border-white/20">
              <div className="w-10 h-10 bg-yellow-300 rounded-lg flex items-center justify-center font-bold text-blue-600">
                🏘️
              </div>
              <span className="font-headline font-black text-xl text-white tracking-tight">Neighbourhood Hub</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 lg:p-16">
          {/* Mobile header */}
          <div className="lg:hidden w-full mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🏘️</span>
              <span className="font-headline font-black text-xl text-blue-600">Neighbourhood Hub</span>
            </div>
            <button onClick={handleGoHome} className="text-gray-600 hover:text-blue-600 font-semibold text-sm">
              Home
            </button>
          </div>

          <div className="w-full max-w-md">
            {/* Tab Toggle */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setForm({ name: "", email: "", password: "", role: "resident" });
                  setErrors({});
                }}
                className={`flex-1 py-3 rounded-full font-headline font-bold transition-all ${
                  isLogin
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setForm({ name: "", email: "", password: "", role: "resident" });
                  setErrors({});
                }}
                className={`flex-1 py-3 rounded-full font-headline font-bold transition-all ${
                  !isLogin
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Join
              </button>
            </div>

            {/* Header */}
            <header className="mb-8">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {isLogin ? "Welcome Back" : "Create an Account"}
              </h2>
              <p className="text-gray-600">
                {isLogin
                  ? "Sign in to access your neighborhood community"
                  : "Step into a more connected local life today"}
              </p>
            </header>

            {/* Error message */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field (Register only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Alex Johnson"
                    className={`w-full bg-gray-50 border-2 rounded-xl py-3 px-4 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:bg-white focus:border-blue-500 ${
                      errors.name ? "border-red-300 focus:border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className={`w-full bg-gray-50 border-2 rounded-xl py-3 px-4 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:bg-white focus:border-blue-500 ${
                    errors.email ? "border-red-300 focus:border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full bg-gray-50 border-2 rounded-xl py-3 px-4 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:bg-white focus:border-blue-500 ${
                      errors.password ? "border-red-300 focus:border-red-500" : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Role Selection (Register only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">
                    I am a...
                  </label>
                  <div className="space-y-2">
                    {Object.entries(roleDescriptions).map(([roleValue, roleInfo]) => (
                      <label
                        key={roleValue}
                        className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          form.role === roleValue
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={roleValue}
                          checked={form.role === roleValue}
                          onChange={handleChange}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900">{roleInfo.title}</p>
                          <p className="text-sm text-gray-600">{roleInfo.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role}</p>}
                </div>
              )}

              {/* Terms Checkbox (Register only) */}
              {!isLogin && (
                <div className="flex items-start gap-3 py-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-blue-600 font-semibold hover:underline">Terms of Service</a> and{" "}
                    <a href="#" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-headline font-bold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setForm({ name: "", email: "", password: "", role: "resident" });
                    setErrors({});
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {isLogin ? "Join now" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}