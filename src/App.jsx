import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ServiceStatusProvider } from './context/ServiceStatusContext';
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

// Optional: Import your global alert component if you created it
// import GlobalServiceAlert from "./components/GlobalServiceAlert"; 

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
    /* Wrap the entire router in the Provider so sockets stay connected across route changes */
    <ServiceStatusProvider>
      <BrowserRouter>
        {/* Session handler must be inside router */}
        <SessionTimeout />

        {/* If you want the offline alert to show up on EVERY page, place it here. 
          If you only want it inside the dashboard, move it inside DashboardLayout instead.
        */}
        {/* <GlobalServiceAlert /> */}

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
    </ServiceStatusProvider>
  );
}