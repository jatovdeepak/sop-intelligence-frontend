import { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Download 
} from "lucide-react";
import { io } from "socket.io-client";

import StatCard from "../components/StatCard";
import SOPOverviewChart from "../components/SOPOverviewChart";
import MonthlySOPChart from "../components/MonthlySOPChart";

export default function Dashboard() {

  const [searchQuery, setSearchQuery] = useState("");

  // 🔥 SERVER STATUS STATE
  const [serverStatus, setServerStatus] = useState("checking");
  const API_URL = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    const socket = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000
    });

    socket.on("connect", () => {
      setServerStatus("online");
    });

    socket.on("server_status", (data) => {
      if (data?.status === "online") {
        setServerStatus("online");
      } else {
        setServerStatus("degraded");
      }
    });

    socket.on("disconnect", () => {
      setServerStatus("offline");
    });

    socket.on("connect_error", () => {
      setServerStatus("reconnecting");
    });

    return () => socket.disconnect();
  }, []);

  const topStats = [
    { title: "Total SOPs", value: "120", note: "+6 this month" },
    { title: "Pending Reviews", value: "15", note: "+3 today" },
    { title: "Expiring SOPs", value: "23", note: "Requires attention" },
    { title: "Flagged SOPs", value: "5", note: "Compliance issues" }
  ];

  // 🎯 STATUS UI CONFIG
  const statusConfig = {
    online: {
      text: "System Online",
      color: "emerald",
      pulse: true
    },
    offline: {
      text: "Server Offline",
      color: "red",
      pulse: false
    },
    reconnecting: {
      text: "Reconnecting...",
      color: "amber",
      pulse: true
    },
    checking: {
      text: "Checking...",
      color: "slate",
      pulse: true
    },
    degraded: {
      text: "Degraded",
      color: "orange",
      pulse: true
    }
  };

  const currentStatus = statusConfig[serverStatus];

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-slate-200/60 mb-6">
        
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 bg-blue-600 rounded-full"></div>

          <h1 className="text-xl font-semibold text-slate-800">
            Intelligent SOP System
          </h1>

          {/* 🔥 LIVE STATUS BADGE */}
          <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full 
            bg-${currentStatus.color}-100/50 text-${currentStatus.color}-600 border border-${currentStatus.color}-200 ml-2`}>

            <span className={`h-1.5 w-1.5 rounded-full bg-${currentStatus.color}-500 
              ${currentStatus.pulse ? "animate-pulse" : ""}`}>
            </span>

            {currentStatus.text}
          </span>
        </div>

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


      <main className="space-y-6">

        {/* TOP STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topStats.map((stat, i) => (
            <StatCard
              key={i}
              title={stat.title}
              value={stat.value}
              note={stat.note}
            />
          ))}
        </div>


        {/* SOP COMPOSITION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 lg:col-span-3">

            <h3 className="text-[15px] font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400"/>
              SOP Composition
            </h3>

            <div className="space-y-5">

              {[
                { label: "Complex (Multi-Step)", value: 45, color: "purple", note: "Impacts onboarding time" },
                { label: "Long (Detailed Manuals)", value: 30, color: "blue" },
                { label: "Short (Quick Guides)", value: 25, color: "emerald", note: "Highest daily usage rate" }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{item.value}%</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`bg-${item.color}-500 h-2 rounded-full`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>

                  {item.note && (
                    <p className="text-xs text-slate-400 mt-1.5">{item.note}</p>
                  )}
                </div>
              ))}

            </div>

          </div>

        </div>


        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="border-b border-slate-50 px-6 pt-6 pb-2">
              <h3 className="text-[15px] font-semibold text-slate-800">
                SOP Overview
              </h3>
            </div>
            <div className="flex-grow flex items-center justify-center p-4">
              <SOPOverviewChart />
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="border-b border-slate-50 px-6 pt-6 pb-2">
              <h3 className="text-[15px] font-semibold text-slate-800">
                Monthly SOP Trends
              </h3>
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