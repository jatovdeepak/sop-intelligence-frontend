import { PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
  { name: "Active", value: 72, color: "#3b82f6" },
  { name: "Inactive", value: 19, color: "#ef4444" },
  { name: "Archived", value: 19, color: "#f59e0b" },
];

// Custom tooltip styled like the screenshot
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];

    return (
      <div className="rounded-md border bg-white px-4 py-2 text-sm shadow-md">
        <span className="font-medium">{name}</span>
        <span className="ml-1 text-slate-600">: {value}</span>
      </div>
    );
  }
  return null;
};

export default function SOPOverviewChart() {
  return (
    <div className="flex flex-col items-center rounded-xl p-6 ">

      <div className="relative">
        <PieChart width={260} height={260}>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={85}
            outerRadius={115}
            paddingAngle={2}
            isAnimationActive
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.color}
                className="cursor-pointer"
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
        </PieChart>

        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-600">
          SOP Overview
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 w-full space-y-3 text-sm">
        {data.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-slate-50"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-slate-600">
              {d.name}: {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
