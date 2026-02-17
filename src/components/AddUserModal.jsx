import {
    X,
    User,
    Mail,
    Phone,
    Key,
    RefreshCcw,
    Shield,
    Building2,
    ChevronDown,
  } from "lucide-react";
  
  export default function AddUserModal({ open, onClose }) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />
  
        {/* Modal */}
        <div className="relative w-full max-w-xl rounded-lg bg-white p-5 shadow-lg">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold">Add New User</h2>
              <p className="text-xs text-slate-500">
                Create a new user account with the details below
              </p>
            </div>
  
            <button onClick={onClose}>
              <X className="h-4 w-4 text-slate-500 hover:text-slate-700" />
            </button>
          </div>
  
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-slate-600">
              Personal Information
            </h3>
  
            <div className="grid grid-cols-2 gap-3">
              <Input icon={User} label="Full Name *" placeholder="John Doe" />
              <Input
                icon={Mail}
                label="Email Address *"
                placeholder="john.doe@carnegie.com"
              />
  
              <Input
                icon={Phone}
                label="Phone Number"
                placeholder="+1 (555) 000-0000"
              />
  
              {/* Password */}
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Password *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Enter password"
                    className="w-full rounded-md bg-slate-100 py-2 pl-9 pr-9 text-sm outline-none"
                  />
                  <RefreshCcw className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600" />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Click the refresh icon to auto-generate a secure password
                </p>
              </div>
            </div>
          </div>
  
          {/* Divider */}
          <div className="my-4 h-px bg-slate-200" />
  
          {/* Role & Department */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-slate-600">
              Role & Department
            </h3>
  
            <div className="grid grid-cols-2 gap-3">
              <Select
                icon={Shield}
                label="Role *"
                placeholder="Select role"
              />
              <Select
                icon={Building2}
                label="Department *"
                placeholder="Select department"
              />
            </div>
  
            <Select
              icon={User}
              label="Employee Category *"
              placeholder="CA"
            />
          </div>
  
          {/* Footer */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md border px-3 py-1.5 text-xs font-medium"
            >
              Cancel
            </button>
  
            <button className="rounded-md bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600">
              Create User
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  /* ---------- Helpers ---------- */
  
  function Input({ label, icon: Icon, placeholder }) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium">{label}</label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            placeholder={placeholder}
            className="w-full rounded-md bg-slate-100 py-2 pl-9 pr-3 text-sm outline-none"
          />
        </div>
      </div>
    );
  }
  
  function Select({ label, icon: Icon, placeholder }) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium">{label}</label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select className="w-full appearance-none rounded-md bg-slate-100 py-2 pl-9 pr-8 text-sm outline-none">
            <option>{placeholder}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    );
  }
  