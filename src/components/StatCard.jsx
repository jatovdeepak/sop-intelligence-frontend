import {
    BookOpen,
    Clock,
    AlertCircle,
    Flag,
  } from "lucide-react";
  
  const iconMap = {
    "Total SOPs": BookOpen,
    "Pending Reviews": Clock,
    "Expiring SOPs": AlertCircle,
    "Flagged SOPs": Flag,
  };
  
  const bgMap = {
    "Total SOPs": "bg-blue-100 text-blue-600 group-hover:bg-blue-200",
    "Pending Reviews": "bg-purple-100 text-purple-600 group-hover:bg-purple-200",
    "Expiring SOPs": "bg-orange-100 text-orange-600 group-hover:bg-orange-200",
    "Flagged SOPs": "bg-red-100 text-red-600 group-hover:bg-red-200",
  };
  
  export default function StatCard({ title, value, note }) {
    const Icon = iconMap[title];
    const iconStyle = bgMap[title];
  
    return (
      <div className="group flex items-start justify-between rounded-xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:scale-[1.01]">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-2 text-xs text-slate-400">{note}</p>
        </div>
  
        <div
          className={`rounded-lg p-3 transition-colors duration-300 ${iconStyle}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    );
  }
  