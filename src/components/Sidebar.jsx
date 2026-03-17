import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  Users,
  User,
  Settings,
  BotIcon,
  ChevronLeft,
  Activity,
  Server
} from "lucide-react";
import { useState, useEffect } from "react";

// 2. ADD THE AUDIT LOGS LINK
const topLinks = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/library", label: "Library", icon: FileText },
  { to: "/users", label: "Users", icon: Users, requiredRole: "Admin" },
  { to: "/audits", label: "Audit Logs", icon: Activity, requiredRole: "Admin" }, 
  { to: "/system-monitor", label: "System Monitor", icon: Server, requiredRole: "Admin" },
  { to: "/sop-intelligence", label: "SOP Intelligence AI", icon: BotIcon },
];

const bottomLinks = [
  { to: "/account", label: "Account", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Fetch the user's role from localStorage when the sidebar mounts
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  // Filter the links based on the user's role
  const filteredTopLinks = topLinks.filter((link) => {
    if (link.requiredRole && link.requiredRole !== userRole) {
      return false; 
    }
    return true; 
  });

  return (
    <aside
      className={`
        ${collapsed ? "w-20" : "w-64"}
        relative flex flex-col text-white transition-all duration-300
        bg-gradient-to-b from-[#2b3f55] via-[#1a2b44] to-[#0b1629]
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow hover:bg-slate-100"
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Logo */}
      <div className="h-28 flex flex-col items-center justify-center gap-3 px-4">
        <div className="h-10 w-15 rounded-2xl bg-white flex items-center justify-center shadow-md">
          <img src="/logo.png" alt="Arizon logo" className="h-8 w-12 object-fill" />
        </div>
        {!collapsed && (
          <div className="text-ls font-medium tracking-wide text-center">
            SOP Intelligence System
          </div>
        )}
      </div>

      <div className="mx-4 h-px bg-white/10" />

      {/* Top Navigation */}
      <nav className="px-3 py-6 space-y-1">
        {filteredTopLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-4"} py-3 rounded-xl text-sm font-medium transition-all ${
                isActive ? "bg-orange-500 text-white shadow-[0_6px_20px_rgba(249,115,22,0.45)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />
      <div className="mx-4 h-px bg-white/10" />

      {/* Bottom Navigation */}
      <nav className="px-3 py-4 space-y-1">
        {bottomLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-4"} py-3 rounded-xl text-sm font-medium transition-all ${
                isActive ? "bg-orange-500 text-white shadow-[0_6px_20px_rgba(249,115,22,0.45)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-6 py-4 text-xs text-slate-400 text-center">
          SOP Intelligence v1.0
        </div>
      )}
    </aside>
  );
}