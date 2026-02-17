import StatCard from "../components/StatCard";
import SOPOverviewChart from "../components/SOPOverviewChart";
import MonthlySOPChart from "../components/MonthlySOPChart";
import DashboardHeader from "../components/DashboardHeader";
export default function Dashboard() {
  return (
    <>
    <DashboardHeader/>
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Total SOPs" value="120" note="+6 this month" />
        <StatCard title="Pending Reviews" value="15" note="+3 today" />
        <StatCard title="Expiring SOPs" value="23" note="Requires attention" />
        <StatCard title="Flagged SOPs" value="5" note="Compliance issues" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium">SOP Overview</h3>
          <SOPOverviewChart />
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium">
            Monthly SOP Trends
          </h3>
          <MonthlySOPChart />
        </div>
      </div>
    </div>
    </>
  );
}
