import { useState, useEffect } from "react";
import { Search, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export default function Audits() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const API_URL = import.meta.env.VITE_API_BASE_URL || "";

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/audit`, { // Assuming Vite proxy is routing /api to localhost:3000
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch audit logs");
      
      const data = await response.json();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Search Filter Logic
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const userName = log.userId?.username || "System/Unknown";
    
    return (
      userName.toLowerCase().includes(query) ||
      (log.action || "").toLowerCase().includes(query) ||
      (log.system || "").toLowerCase().includes(query) ||
      (log.resourceId || "").toLowerCase().includes(query) ||
      (log.status || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
            System Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor system access, SOP actions, and security events.
          </p>
        </div>
        
        <button 
          onClick={fetchLogs}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition"
        >
          Refresh Logs
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 border border-red-200">
          Error loading logs: {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, action, system, or status..."
            className="w-full rounded-lg bg-slate-100 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm overflow-x-auto">
        <h2 className="mb-4 font-medium">
          Log Entries ({filteredLogs.length})
        </h2>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading audit logs...</div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 text-left">Timestamp</th>
                <th className="text-left">User</th>
                <th className="text-left">Action</th>
                <th className="text-left">System</th>
                <th className="text-left">Resource ID</th>
                <th className="text-left">IP Address</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No logs found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.createdAt);
                  const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                  const userName = log.userId?.username || "Unknown";
                  const initials = userName.substring(0, 2).toUpperCase();
                  const isSuccess = log.status === "SUCCESS";

                  return (
                    <tr
                      key={log._id}
                      className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition"
                    >
                      {/* Timestamp */}
                      <td className="py-4 text-slate-500 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* User */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                            {initials}
                          </div>
                          <span className="font-medium">{userName}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-mono font-medium text-slate-600">
                          {log.action}
                        </span>
                      </td>

                      {/* System */}
                      <td className="font-medium text-slate-700">
                        {log.system || "N/A"}
                      </td>

                      {/* Resource ID */}
                      <td className="font-mono text-xs text-slate-500">
                        {log.resourceId === "N/A" ? "-" : log.resourceId}
                      </td>

                      {/* IP Address */}
                      <td className="font-mono text-xs text-slate-400">
                        {log.ipAddress || "Unknown"}
                      </td>

                      {/* Status */}
                      <td>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                          {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {log.status}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}