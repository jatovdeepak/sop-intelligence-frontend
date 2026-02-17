import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Users from "./pages/Users";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import SOPIntelligence from "./pages/SOPIntelligence";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/users" element={<Users />} />
          <Route path="/sop-intelligence" element={<SOPIntelligence />} />
          <Route path="/account" element={<Account />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
