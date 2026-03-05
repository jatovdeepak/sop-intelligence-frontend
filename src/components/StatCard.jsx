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

// Matched the exact pastel backgrounds and vibrant icon colors from your screenshot
const bgMap = {
  "Total SOPs": "bg-blue-50 text-blue-500 group-hover:bg-blue-100",
  "Pending Reviews": "bg-purple-50 text-purple-500 group-hover:bg-purple-100",
  "Expiring SOPs": "bg-orange-50 text-orange-500 group-hover:bg-orange-100",
  "Flagged SOPs": "bg-red-50 text-red-500 group-hover:bg-red-100",
};

export default function StatCard({ title, value, note }) {
  const Icon = iconMap[title];
  const iconStyle = bgMap[title];

  return (
    <div className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[15px] font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
        </div>

        <div className={`rounded-xl p-3 transition-colors duration-300 ${iconStyle}`}>
          {Icon && <Icon className="h-6 w-6 stroke-[1.5]" />}
        </div>
      </div>
      
      <p className="mt-4 text-[13px] font-medium text-slate-400">{note}</p>
    </div>
  );
}