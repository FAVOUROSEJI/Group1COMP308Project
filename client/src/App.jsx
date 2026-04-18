import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public
import HomePage from "./pages/public/HomePage";
import AuthPage from "./pages/auth/AuthPage";

function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// Dashboard
import Dashboard from "./pages/auth/Dashboard";

// Resident pages
import NewsFeed from "./pages/resident/NewsFeed";
import HelpRequests from "./pages/resident/HelpRequests";
import EmergencyAlerts from "./pages/resident/EmergencyAlerts";

// Business pages
import BusinessListings from "./pages/business/BusinessListings";
import CustomerReviews from "./pages/business/CustomerReviews";
import PostDeal from "./pages/business/PostDeal";

// Organizer pages
import EventsPage from "./pages/organizer/EventsPage";
import VolunteerMatching from "./pages/organizer/VolunteerMatching";
import CommunityInsights from "./pages/organizer/CommunityInsights";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        {/* Resident */}
        <Route path="/news" element={
          <ProtectedRoute><NewsFeed /></ProtectedRoute>
        } />
        <Route path="/help-requests" element={
          <ProtectedRoute><HelpRequests /></ProtectedRoute>
        } />
        <Route path="/emergency-alerts" element={
          <ProtectedRoute><EmergencyAlerts /></ProtectedRoute>
        } />

        {/* Business */}
        <Route path="/business-listings" element={
          <ProtectedRoute><BusinessListings /></ProtectedRoute>
        } />
        <Route path="/reviews" element={
          <ProtectedRoute><CustomerReviews /></ProtectedRoute>
        } />
        <Route path="/post-deal" element={
          <RoleRoute roles={["business"]}><PostDeal /></RoleRoute>
        } />

        {/* Organizer */}
        <Route path="/events" element={
          <ProtectedRoute><EventsPage /></ProtectedRoute>
        } />
        <Route path="/volunteer-matching" element={
          <RoleRoute roles={["organizer"]}><VolunteerMatching /></RoleRoute>
        } />
        <Route path="/community-insights" element={
          <ProtectedRoute><CommunityInsights /></ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}