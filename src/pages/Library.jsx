import {
  Eye,
  MoreVertical,
  Pencil,
  History,
  MessageSquare,
  ShieldCheck,
  GitBranch,
  Trash2,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import FDAComplianceAnalysis from "../components/FDAComplianceAnalysis";
import ChatWithSOP from "../components/ChatWithSOP";
import AddSOPModal from "../components/AddSOPModal";
import SOPFlowchart from "../components/SOPFlowchart";

export default function Library() {
  const [showCompliance, setShowCompliance] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAddSOP, setShowAddSOP] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [selectedSop, setSelectedSop] = useState(null);

  const rows = [
    {
      id: "SOP-001",
      name: "Tablet Compression PM",
      version: "v1.1",
      department: "Engineering",
      createdBy: "Deepak",
      updated: "2024-06-23",
      status: "active",
      references: ["SOP-004", "SOP-042"], // References Cleaning and Emergency Shutdown
    },
    {
      id: "SOP-004",
      name: "Cleaning Procedures",
      version: "v2.1",
      department: "Production",
      createdBy: "Neha",
      updated: "2025-09-20",
      status: "active",
      references: ["SOP-015"],
    },
    {
      id: "SOP-015",
      name: "Batch Management",
      version: "v1.0",
      department: "Production",
      createdBy: "Rohit",
      updated: "2025-10-01",
      status: "draft",
      references: ["SOP-022", "SOP-035"],
    },
    {
      id: "SOP-022",
      name: "Quality Control",
      version: "v3.2",
      department: "QC",
      createdBy: "Priya",
      updated: "2025-08-10",
      status: "active",
      references: ["SOP-051"],
    },
    {
      id: "SOP-035",
      name: "Material Handling",
      version: "v1.4",
      department: "Warehouse",
      createdBy: "Arjun",
      updated: "2025-11-12",
      status: "active",
      references: ["SOP-015", "SOP-042"],
    },
    {
      id: "SOP-042",
      name: "Emergency Shutdown",
      version: "v5.0",
      department: "Safety",
      createdBy: "Suresh",
      updated: "2026-01-05",
      status: "active",
      references: ["SOP-001"],
    },
    {
      id: "SOP-051",
      name: "Lab Calibration",
      version: "v2.2",
      department: "QC",
      createdBy: "Meera",
      updated: "2025-12-15",
      status: "draft",
      references: ["SOP-022", "SOP-004"],
    },
    {
      id: "SOP-060",
      name: "Waste Disposal",
      version: "v1.0",
      department: "Safety",
      createdBy: "Vikram",
      updated: "2026-02-10",
      status: "active",
      references: ["SOP-004", "SOP-035", "SOP-042"],
    },
  ];

  function ActionsMenu({ onCompliance, onChat, onFlowchart }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
      <div className="relative" ref={ref}>
        <MoreVertical
          className="h-4 w-4 cursor-pointer text-slate-500 hover:text-slate-700"
          onClick={() => setOpen(!open)}
        />

        {open && (
          <div
            className="
            absolute right-0 bottom-6
            w-52
            rounded-xl
            bg-white
            border border-slate-200
            shadow-[0_8px_24px_rgba(0,0,0,0.12)]
            z-50
            py-1
          "
          >
            <MenuItem icon={Pencil} label="Edit" />
            <MenuItem icon={History} label="View Version" />
            <MenuItem
              icon={MessageSquare}
              label="Chat with SOP"
              onClick={() => {
                onChat();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={ShieldCheck}
              label="FDA Compliance Analysis"
              onClick={() => {
                onCompliance();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={GitBranch}
              label="SOP Flow Map"
              onClick={() => {
                onFlowchart();
                setOpen(false);
              }}
            />

            <div className="my-1 h-px bg-slate-200" />

            <MenuItem icon={Trash2} label="Delete" danger />
          </div>
        )}
      </div>
    );
  }

  function MenuItem({ icon: Icon, label, danger, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`
          w-full
          flex items-center gap-3
          px-3 py-2
          text-[13px]
          text-left
          transition
          ${
            danger
              ? "text-red-600 hover:bg-red-50"
              : "text-slate-700 hover:bg-slate-100"
          }
        `}
      >
        <Icon className="h-4 w-4 text-slate-600" />
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">SOP Management</h1>
          <p className="text-sm text-slate-500">
            Manage and organize your Standard Operating Procedures
          </p>
        </div>

        <button
          onClick={() => setShowAddSOP(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
        >
          + Add SOP
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="mb-4 font-medium text-slate-800">Filters</div>

        <div className="grid grid-cols-4 gap-4">
          <input
            className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="Department"
          />
          <input
            className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="Status"
          />
          <input
            className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="SOP ID"
          />
          <input
            className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="mm/dd/yyyy"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-visible">
        <div className="p-6 pb-4">
          <h2 className="font-medium text-slate-800">All SOPs</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-3 px-6 text-left font-medium">SOP ID</th>
              <th className="py-3 px-6 text-left font-medium">SOP Name</th>
              <th className="py-3 px-6 text-left font-medium">Version</th>
              <th className="py-3 px-6 text-left font-medium">Department</th>
              <th className="py-3 px-6 text-left font-medium">Created By</th>
              <th className="py-3 px-6 text-left font-medium">Last Updated</th>
              <th className="py-3 px-6 text-left font-medium">Status</th>
              <th className="py-3 px-6 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/80 transition duration-150"
              >
                <td className="py-4 px-6 font-medium text-slate-700">
                  {row.id}
                </td>
                <td className="py-4 px-6 text-slate-700">{row.name}</td>
                <td className="py-4 px-6 text-slate-500">{row.version}</td>
                <td className="py-4 px-6 text-slate-500">{row.department}</td>
                <td className="py-4 px-6 text-slate-500">{row.createdBy}</td>
                <td className="py-4 px-6 text-slate-500">{row.updated}</td>
                <td className="py-4 px-6">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.status === "active"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <button className="p-1 hover:bg-blue-50 rounded transition">
                      <Eye className="h-4 w-4 cursor-pointer text-slate-400 hover:text-blue-600" />
                    </button>
                    <ActionsMenu
                      onCompliance={() => {
                        setSelectedSop(row);
                        setShowCompliance(true);
                      }}
                      onChat={() => {
                        setSelectedSop(row);
                        setShowChat(true);
                      }}
                      onFlowchart={() => {
                        // ENHANCEMENT: Fetch the full objects for each referenced SOP ID
                        const referenceObjects = (row.references || []).map((refId) => {
                          const foundSop = rows.find((r) => r.id === refId);
                          // Fallback structure in case an ID doesn't exist in the dummy rows
                          return foundSop || { id: refId, name: "Unknown SOP", department: "Unknown", status: "N/A" };
                        });

                        // Create an enriched version of the selected SOP containing both arrays
                        const enrichedSop = {
                          ...row,
                          referenceObjects: referenceObjects,
                        };

                        setSelectedSop(enrichedSop);
                        setShowFlowchart(true);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance Modal */}
      {showCompliance && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <FDAComplianceAnalysis
              sop={selectedSop}
              onClose={() => setShowCompliance(false)}
            />
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <ChatWithSOP sop={selectedSop} onClose={() => setShowChat(false)} />
        </div>
      )}

      {/* Flowchart Modal */}
      {showFlowchart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <SOPFlowchart
            sop={selectedSop}
            onClose={() => setShowFlowchart(false)}
          />
        </div>
      )}

      {showAddSOP && <AddSOPModal onClose={() => setShowAddSOP(false)} />}
    </div>
  );
}