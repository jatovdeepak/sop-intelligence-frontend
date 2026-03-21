import { useState, useEffect } from "react";
import AddUserModal from "../components/AddUserModal";
import { Eye, Pencil, Trash2, Search } from "lucide-react";

export default function Users() {
  // State Management
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || "";

  // Fetch users from the backend
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("token"); 
      
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      
      const data = await response.json();
      setUsers(data || []); 
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle User Deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers(users.filter((user) => user._id !== userId && user.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Edit Click
  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Open Add Modal
  const handleAddClick = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  // Search Filter Logic
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name || u.username || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query) ||
      (u.role || "").toLowerCase().includes(query) ||
      (u.department || u.system || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <AddUserModal 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          userToEdit={editingUser}
          onSuccess={fetchUsers} 
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-sm text-slate-500">
            Manage system users, roles, and permissions
          </p>
        </div>

        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
        >
          + Add New User
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 border border-red-200">
          Error loading users: {error}
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, role, or department..."
            className="w-full rounded-lg bg-slate-100 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm overflow-x-auto">
        <h2 className="mb-4 font-medium">
          All Users ({filteredUsers.length})
        </h2>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading users...</div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 text-left">Name</th>
                <th className="text-left">Role</th>
                <th className="text-left">Department / System</th>
                <th className="text-left">Employee Category</th>
                <th className="text-left">Status</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const id = u._id || u.id;
                  const name = u.username || u.name || "Unknown";
                  const initials = u.initials || name.substring(0, 2).toUpperCase();
                  
                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition"
                    >
                      {/* Name */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-600">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium">{name}</div>
                            <div className="text-xs text-slate-500">{u.email || "No email provided"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                          {u.role}
                        </span>
                      </td>

                      {/* Department / System */}
                      <td>{u.department || u.system || "N/A"}</td>

                      {/* Employee Category */}
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            u.category === "CA"
                              ? "bg-green-100 text-green-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.category || "Standard"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            u.status === "Pending"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {u.status || "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-4">
                          <Eye 
                            className="h-4 w-4 cursor-pointer text-blue-600 hover:text-blue-800 transition" 
                            title="View" 
                          />
                          <Pencil 
                            className="h-4 w-4 cursor-pointer text-orange-500 hover:text-orange-700 transition" 
                            title="Edit"
                            onClick={() => handleEditClick(u)} 
                          />
                          <Trash2 
                            className="h-4 w-4 cursor-pointer text-red-500 hover:text-red-700 transition" 
                            title="Delete"
                            onClick={() => handleDeleteUser(id)}
                          />
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