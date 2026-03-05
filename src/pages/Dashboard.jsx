import { useState } from "react";
import { 
  FileText, 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Search, 
  Download 
} from "lucide-react";

import StatCard from "../components/StatCard";
import SOPOverviewChart from "../components/SOPOverviewChart";
import MonthlySOPChart from "../components/MonthlySOPChart";

export default function Dashboard() {
  // Merged Header State
  const [searchQuery, setSearchQuery] = useState("");

  const topStats = [
    { title: "Total SOPs", value: "120", note: "+6 this month" },
    { title: "Pending Reviews", value: "15", note: "+3 today" },
    { title: "Expiring SOPs", value: "23", note: "Requires attention" },
    { title: "Flagged SOPs", value: "5", note: "Compliance issues" }
  ];

  return (
    <div >
      
      {/* --- MERGED & IMPROVED HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-slate-200/60 mb-6">
        
        {/* Left: Title & Status */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
          <h1 className="text-xl font-semibold text-slate-800">
            Intelligent SOP System
          </h1>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100/50 text-emerald-600 border border-emerald-200 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </span>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search SOP name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm whitespace-nowrap">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>
      {/* --- END HEADER --- */}

      <main className="space-y-6">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topStats.map((stat, i) => (
            <StatCard key={i} title={stat.title} value={stat.value} note={stat.note} />
          ))}
        </div>

        {/* --- SOP Complexity & Production Impact --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SOP Composition */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 lg:col-span-1">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400"/> SOP Composition
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Complex (Multi-Step)</span>
                  <span className="text-slate-500">45%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{width: '45%'}}></div></div>
                <p className="text-xs text-slate-400 mt-1.5">Impacts onboarding time</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Long (Detailed Manuals)</span>
                  <span className="text-slate-500">30%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: '30%'}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Short (Quick Guides)</span>
                  <span className="text-slate-500">25%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width: '25%'}}></div></div>
                <p className="text-xs text-slate-400 mt-1.5">Highest daily usage rate</p>
              </div>
            </div>
          </div>

          {/* Production Impact Metrics */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 lg:col-span-2">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500"/> Estimated Production Impact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-[calc(100%-2.5rem)] pb-2">
              <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col justify-center transition-transform hover:-translate-y-1">
                <TrendingUp className="h-6 w-6 text-emerald-600 mb-3" />
                <p className="text-3xl font-bold text-emerald-700">14%</p>
                <p className="text-sm font-medium text-emerald-900 mt-1">Error Reduction</p>
                <p className="text-xs text-emerald-600/80 mt-1">Since updated SOP rollout</p>
              </div>
              <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-center transition-transform hover:-translate-y-1">
                <Clock className="h-6 w-6 text-blue-600 mb-3" />
                <p className="text-3xl font-bold text-blue-700">1.2 hrs</p>
                <p className="text-sm font-medium text-blue-900 mt-1">Time Saved / Shift</p>
                <p className="text-xs text-blue-600/80 mt-1">Due to "Short" quick-guides</p>
              </div>
              <div className="p-5 bg-purple-50 rounded-xl border border-purple-100 flex flex-col justify-center transition-transform hover:-translate-y-1">
                <CheckCircle className="h-6 w-6 text-purple-600 mb-3" />
                <p className="text-3xl font-bold text-purple-700">89%</p>
                <p className="text-sm font-medium text-purple-900 mt-1">Adoption Rate</p>
                <p className="text-xs text-purple-600/80 mt-1">Operator compliance logging</p>
              </div>
            </div>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="border-b border-slate-50 px-6 pt-6 pb-2">
              <h3 className="text-[15px] font-semibold text-slate-800">SOP Overview</h3>
            </div>
            <div className="flex-grow flex items-center justify-center p-4">
               <SOPOverviewChart />
            </div>
          </div>
          
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="border-b border-slate-50 px-6 pt-6 pb-2">
              <h3 className="text-[15px] font-semibold text-slate-800">Monthly SOP Trends</h3>
            </div>
            <div className="flex-grow flex items-end justify-center p-4">
              <MonthlySOPChart />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}