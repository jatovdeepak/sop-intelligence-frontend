import { Search, Download } from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between py-4">
      {/* Left */}
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Online
        </span>

        <span className="text-slate-300">|</span>

        <span className="font-medium text-slate-700">
          Intelligent SOP System
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 bg-white" />
          <input
            placeholder="Search SOP name..."
            className="bg-white w-[380px] rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-slate-300"
          />
        </div>

        {/* Export */}
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>
    </div>
  );
}
