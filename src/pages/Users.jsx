import { useState } from "react";
import AddUserModal from "../components/AddUserModal";
import { Eye, Pencil, Trash2, Search } from "lucide-react";

const users = [
  {
    id: "USR-001",
    name: "John Doe",
    email: "john.doe@carnegie.com",
    initials: "JD",
    role: "Admin",
    department: "Administration",
    category: "CA",
    status: "Completed",
  },
  {
    id: "USR-002",
    name: "Jane Smith",
    email: "jane.smith@carnegie.com",
    initials: "JS",
    role: "Supervisor",
    department: "Production",
    category: "CA",
    status: "Completed",
  },
  {
    id: "USR-003",
    name: "Mike Johnson",
    email: "mike.johnson@carnegie.com",
    initials: "MJ",
    role: "Operator",
    department: "Production",
    category: "NCA",
    status: "Pending",
  },
  {
    id: "USR-004",
    name: "Sarah Williams",
    email: "sarah.williams@carnegie.com",
    initials: "SW",
    role: "Validator",
    department: "QA",
    category: "CA",
    status: "Completed",
  },
  {
    id: "USR-005",
    name: "David Brown",
    email: "david.brown@carnegie.com",
    initials: "DB",
    role: "Trainee",
    department: "R&D",
    category: "NCA",
    status: "Pending",
  },
];

export default function Users() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
        <AddUserModal open={open} onClose={() => setOpen(false)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-sm text-slate-500">
            Manage system users, roles, and permissions
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          + Add New User
        </button>
      </div>

      {/* Search */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name, email, ID, role, or department..."
            className="w-full rounded-lg bg-slate-100 py-3 pl-11 pr-4 text-sm outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-medium">All Users (5)</h2>

        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-3 text-left">ID</th>
              <th className="text-left">Name</th>
              <th className="text-left">Role</th>
              <th className="text-left">Department</th>
              <th className="text-left">Employee Category</th>
              <th className="text-left">Orientation Status</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition"
              >
                <td className="py-4">{u.id}</td>

                {/* Name */}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-600">
                      {u.initials}
                    </div>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                    {u.role}
                  </span>
                </td>

                {/* Department */}
                <td>{u.department}</td>

                {/* Employee Category */}
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.category === "CA"
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.category}
                  </span>
                </td>

                {/* Orientation Status */}
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.status === "Completed"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>

                {/* Actions */}
                <td>
                  <div className="flex items-center gap-4">
                    <Eye className="h-4 w-4 cursor-pointer text-blue-600" />
                    <Pencil className="h-4 w-4 cursor-pointer text-orange-500" />
                    <Trash2 className="h-4 w-4 cursor-pointer text-red-500" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
