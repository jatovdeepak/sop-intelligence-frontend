import {
    User,
    Mail,
    Phone,
    Building2,
    Shield,
    Users,
    Lock,
    FileText,
    Bell,
  } from "lucide-react";
  
  export default function Account() {
    return (
      <div className="max-w-3xl space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Account Settings
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your account details and preferences
          </p>
        </div>
  
        {/* Profile Information */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-slate-900">
            Profile Information
          </h2>
  
          {/* Avatar Row */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white">
                <User className="h-6 w-6" />
              </div>
  
              <div>
                <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium">
                  Upload Photo
                </button>
                <p className="mt-0.5 text-xs text-slate-500">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>
  
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <FileText className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs font-medium">Orientation Status</p>
                <p className="text-[11px] text-slate-500">
                  Toggle to upload orientation evidence
                </p>
              </div>
              <input type="checkbox" className="h-4 w-8 rounded-full" />
            </div>
          </div>
  
          <hr className="mb-5 border-slate-200" />
  
          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "First Name *", value: "Admin", icon: User },
              { label: "Last Name *", value: "User", icon: User },
              { label: "Email Address *", value: "admin@stem.com", icon: Mail },
              { label: "Phone Number", value: "+1 (555) 000-0000", icon: Phone },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium">{f.label}</label>
                <div className="relative mt-1">
                  <f.icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    disabled
                    value={f.value}
                    className="w-full rounded-lg bg-slate-100 pl-10 pr-3 py-1.5 text-sm text-slate-800"
                  />
                </div>
              </div>
            ))}
  
            <div>
              <label className="text-xs font-medium">Department *</label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select className="w-full rounded-lg bg-slate-100 pl-10 pr-3 py-1.5 text-sm text-slate-800">
                  <option>Administration</option>
                </select>
              </div>
            </div>
  
            <div>
              <label className="text-xs font-medium">Role *</label>
              <div className="relative mt-1">
                <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select className="w-full rounded-lg bg-slate-100 pl-10 pr-3 py-1.5 text-sm text-slate-800">
                  <option>Administrator</option>
                </select>
              </div>
            </div>
  
            <div className="col-span-2">
              <label className="text-xs font-medium">Employee Category</label>
              <div className="relative mt-1">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select className="w-full rounded-lg bg-slate-100 pl-10 pr-3 py-1.5 text-sm text-slate-800">
                  <option>CA</option>
                </select>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Select employee category
              </p>
            </div>
          </div>
  
          <div className="mt-5 flex justify-end">
            <button className="rounded-md bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600">
              Save Changes
            </button>
          </div>
        </div>
  
        {/* Change Password */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm">
          <h2 className="mb-4 text-sm font-medium">Change Password</h2>
  
          <div className="grid grid-cols-2 gap-3">
            {[
              { placeholder: "Enter current password", span: "col-span-2" },
              { placeholder: "Enter new password" },
              { placeholder: "Confirm new password" },
            ].map((f, i) => (
              <div key={i} className={`relative ${f.span || ""}`}>
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder={f.placeholder}
                  className="w-full rounded-lg bg-slate-100 pl-10 pr-3 py-1.5 text-sm text-slate-800"
                />
              </div>
            ))}
          </div>
  
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Password must be at least 8 characters long and include uppercase,
            lowercase, numbers, and special characters.
          </div>
  
          <div className="mt-4 flex justify-end">
            <button className="rounded-md bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600">
              Update Password
            </button>
          </div>
        </div>
  
        {/* Notification Preferences */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm">
          <h2 className="mb-4 text-sm font-medium">Notification Preferences</h2>
  
          {[
            {
              title: "Email Notifications",
              desc: "Receive email updates for training assignments",
              icon: Mail,
              checked: true,
            },
            {
              title: "Training Reminders",
              desc: "Get reminders for upcoming training deadlines",
              icon: Bell,
              checked: true,
            },
            {
              title: "SOP Updates",
              desc: "Notify when SOPs are updated or modified",
              icon: FileText,
              checked: false,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2"
            >
              <div className="flex items-start gap-3">
                <item.icon className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="h-4 w-4"
              />
            </div>
          ))}
  
          <div className="mt-4 flex justify-end">
            <button className="rounded-md bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }
  