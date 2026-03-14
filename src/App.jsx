import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Users from "./pages/Users";
import Audits from "./pages/Audits";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import SOPIntelligence from "./pages/SOPIntelligence";
import Login from "./pages/Login"; // Import the new Login page

// Protect routes by checking for a token
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
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Wrap the DashboardLayout with ProtectedRoute */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/users" element={<Users />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/sop-intelligence" element={<SOPIntelligence />} />
          <Route path="/account" element={<Account />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
