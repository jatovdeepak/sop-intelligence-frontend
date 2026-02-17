import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
  } from "recharts";
  
  const data = [
    { month: "Apr", value: 58 },
    { month: "May", value: 82 },
    { month: "Jun", value: 98 },
    { month: "Jul", value: 115 },
    { month: "Oct", value: 104 },
  ];
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border bg-white px-4 py-3 text-sm shadow-md">
          <p className="font-medium text-slate-800">{label}</p>
          <p className="mt-1 text-emerald-600">
            sops : {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };
  
  export default function MonthlySOPChart() {
    return (
      <div className="flex flex-col items-center rounded-xl p-6">
      
        <BarChart width={420} height={260} data={data}>
          <CartesianGrid
            stroke="#e5e7eb"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
  
          {/* 🔥 cursor={false} removes the grey highlight */}
          <Tooltip content={<CustomTooltip />} cursor={false} />
  
          <Bar
            dataKey="value"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
  
        <p className="mt-6 text-sm text-slate-600">
          Monthly SOP Trends
        </p>
      </div>
    );
  }
  