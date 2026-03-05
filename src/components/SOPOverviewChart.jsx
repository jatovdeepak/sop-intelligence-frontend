import { PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
  { name: "Active", value: 72, color: "#3b82f6" },
  { name: "Inactive", value: 19, color: "#ef4444" },
  { name: "Archived", value: 19, color: "#f59e0b" },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="rounded-md border bg-white px-4 py-2 text-sm shadow-md">
        <span className="font-medium">{name}</span>
        <span className="ml-1 text-slate-600">: {value}%</span>
      </div>
    );
  }
  return null;
};

export default function SOPOverviewChart() {
  return (
    /* Changed to flex-row and items-center to align chart and legend horizontally */
    <div className="flex flex-row items-center justify-center gap-8 w-full p-2">
      
      {/* Chart Section */}
      <div className="relative">
        <PieChart width={220} height={220}>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={75}
            outerRadius={105}
            paddingAngle={3}
            isAnimationActive
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.color}
                className="cursor-pointer outline-none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>

        {/* Center text overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
          <span className="text-xl font-bold text-slate-700">110</span>
        </div>
      </div>

      {/* Legend Section moved to the right side */}
      <div className="flex flex-col gap-4">
        {data.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-3 group cursor-default"
          >
            <span
              className="h-3 w-3 rounded-full shadow-sm"
              style={{ backgroundColor: d.color }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700 leading-none">
                {d.name}
              </span>
              <span className="text-[12px] text-slate-400 mt-1">
                {d.value}% of total
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}