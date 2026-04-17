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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "resident" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_USER, {
    onCompleted: (data) => {
      login(data.login);
      navigate("/dashboard");
    },
    onError: (err) => alert(err.message),
  });

  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER_USER, {
    onCompleted: (data) => {
      login(data.register);
      navigate("/dashboard");
    },
    onError: (err) => alert(err.message),
  });

  const loading = loginLoading || registerLoading;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation({ variables: { email: form.email, password: form.password } });
    } else {
      registerMutation({ variables: form });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          🏘️ Neighborhood Hub
        </h1>

        {/* Toggle */}
        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-l-lg font-semibold ${
              isLogin ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-r-lg font-semibold ${
              !isLogin ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {!isLogin && (
            <select
              name="role"
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="resident">Resident</option>
              <option value="business">Business Owner</option>
              <option value="organizer">Community Organizer</option>
            </select>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}