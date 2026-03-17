import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SessionTimeout from "./components/SessionTimeout";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Users from "./pages/Users";
import Audits from "./pages/Audits";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import SOPIntelligence from "./pages/SOPIntelligence";
import Login from "./pages/Login";
import SystemMonitor from "./pages/SystemMonitor";

// Protect routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      {/* Session handler must be inside router */}
      <SessionTimeout />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/users" element={<Users />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/system-monitor" element={<SystemMonitor />} />
          <Route path="/sop-intelligence" element={<SOPIntelligence />} />
          <Route path="/account" element={<Account />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}