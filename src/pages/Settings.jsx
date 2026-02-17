import {
    Sun,
    Moon,
    Monitor,
    Bell,
    Globe,
    Shield,
    Database,
  } from "lucide-react";
  import { useState } from "react";
  
  export default function Settings() {
    return (
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Settings
          </h1>
          <p className="text-sm text-slate-500">
            Manage application preferences and configurations
          </p>
        </div>
  
        {/* Appearance */}
        <Section title="Appearance & Theme" icon={Sun}>
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-medium">Theme Mode</p>
              <div className="grid grid-cols-3 gap-4">
                <ThemeCard icon={Sun} label="Light" active />
                <ThemeCard icon={Moon} label="Dark" />
                <ThemeCard icon={Monitor} label="System" />
              </div>
            </div>
  
            <Divider />
  
            <SelectField label="Color Scheme" value="Orange (Default)" />
  
            <ToggleRow
              title="Compact Mode"
              desc="Reduce spacing for more content density"
            />
          </div>
        </Section>
  
        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          <div className="space-y-2">
            <ToggleRow
              title="Email Notifications"
              desc="Receive email updates for training assignments"
              defaultOn
            />
            <ToggleRow
              title="Push Notifications"
              desc="Browser notifications for important updates"
              defaultOn
            />
            <ToggleRow
              title="Training Reminders"
              desc="Get reminders for upcoming training deadlines"
              defaultOn
            />
            <ToggleRow
              title="SOP Updates"
              desc="Notify when SOPs are updated or modified"
            />
          </div>
  
          <Divider />
  
          <SelectField
            label="Notification Frequency"
            value="Instant"
          />
        </Section>
  
        {/* Regional */}
        <Section title="Regional Settings" icon={Globe}>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Language" value="English" />
            <SelectField label="Timezone" value="UTC" />
            <SelectField label="Date Format" value="DD-MM-YYYY" />
            <SelectField label="Time Format" value="24-hour" />
          </div>
        </Section>
  
        {/* Security */}
        <Section title="Security & Privacy" icon={Shield}>
          <div className="space-y-2">
            <ToggleRow
              title="Two-Factor Authentication"
              desc="Add an extra layer of security to your account"
            />
            <ToggleRow
              title="Session Timeout"
              desc="Auto logout after period of inactivity"
              defaultOn
            />
          </div>
  
          <Divider />
  
          <SelectField
            label="Session Duration"
            value="30 minutes"
          />
        </Section>
  
        {/* Data */}
        <Section title="Data Management" icon={Database}>
          <SelectField
            label="Data Retention Period"
            value="1 year"
          />
  
          <Divider />
  
          <ToggleRow
            title="Auto-Backup"
            desc="Automatically backup data daily"
            defaultOn
          />
  
          <div className="mt-4 flex gap-3">
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">
              Export All Data
            </button>
            <button className="rounded-lg border border-red-300 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50">
              Clear Cache
            </button>
          </div>
        </Section>
  
        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">
            Reset to Defaults
          </button>
          <button className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600">
            Save All Settings
          </button>
        </div>
      </div>
    );
  }
  
  /* ---------------- Components ---------------- */
  
  function Section({ title, icon: Icon, children }) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        {children}
      </div>
    );
  }
  
  function Divider() {
    return <div className="my-4 h-px bg-slate-200" />;
  }
  
  function ToggleRow({ title, desc, defaultOn }) {
    const [on, setOn] = useState(!!defaultOn);
  
    return (
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
  
        <Toggle on={on} setOn={setOn} />
      </div>
    );
  }
  
  function Toggle({ on, setOn }) {
    return (
      <button
        onClick={() => setOn(!on)}
        className={`relative h-6 w-11 rounded-full transition ${
          on ? "bg-black" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            on ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    );
  }
  
  function SelectField({ label, value }) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium">
          {label}
        </label>
        <select className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm">
          <option>{value}</option>
        </select>
      </div>
    );
  }
  
  function ThemeCard({ icon: Icon, label, active }) {
    return (
      <div
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-6 py-5 text-sm ${
          active
            ? "border-orange-500 bg-orange-50"
            : "border-slate-200"
        }`}
      >
        <Icon className="h-5 w-5" />
        {label}
      </div>
    );
  }
  