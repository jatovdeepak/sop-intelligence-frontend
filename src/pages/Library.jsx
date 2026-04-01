import {
  Eye,
  MoreVertical,
  Pencil,
  History,
  MessageSquare,
  ShieldCheck,
  GitBranch,
  Trash2,
  FileJson,
  Database, // <-- NEW ICON FOR BUILD RAG
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import FDAComplianceAnalysis from "../components/FDAComplianceAnalysis";
import AddSOPModal from "../components/AddSOPModal";
import EditSOPModal from "../components/EditSOPModal";
import DataExtractor from "../sop-data-extractor/DataExtractor";
import PDFViewerModal from "../components/PDFViewerModal";
import BuildRag from "../components/BuildRag"; 
import SOPChatLayout from "../layouts/SOPChatLayout";
import SOPFlowchartLayout from "../layouts/SOPFlowchartLayout";

// Import your Zustand store (Adjust path if necessary)
import useStore from "../services/useStore"; 

export default function Library() {
  // UI State (Modals)
  const [showCompliance, setShowCompliance] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAddSOP, setShowAddSOP] = useState(false);
  const [showEditSOP, setShowEditSOP] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);
  const [showBuildRag, setShowBuildRag] = useState(false); 
  const [selectedSop, setSelectedSop] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  // =========================
  // ZUSTAND GLOBAL STATE
  // =========================
  // We alias sopMetadata to "sops" to keep your existing render logic unchanged
  const { 
    sopMetadata: sops, 
    isLoading, 
    error, 
    fetchSOPMetadata, 
    deleteSOP 
  } = useStore();

  // Fetch SOP metadata on mount
  useEffect(() => {
    fetchSOPMetadata();
  }, [fetchSOPMetadata]);

  // Handle Delete via Zustand Store
  const handleDeleteSOP = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this SOP? This action cannot be undone."
      )
    )
      return;
    
    // The store automatically handles the API call and updates the UI instantly
    await deleteSOP(id);
  };

  function ActionsMenu({
    onCompliance,
    onChat,
    onFlowchart,
    onEdit,
    onDelete,
    onExtract,
    onBuildRag, 
  }) {
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
          <div className="absolute right-0 bottom-6 w-52 rounded-xl bg-white border border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 py-1">
            <MenuItem
              icon={Pencil}
              label="Edit"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
            />
            
            <MenuItem
              icon={FileJson}
              label="Data Extractor"
              onClick={() => {
                onExtract();
                setOpen(false);
              }}
            />

            {/* <MenuItem
              icon={Database}
              label="Build RAG Context"
              onClick={() => {
                onBuildRag();
                setOpen(false);
              }}
            /> */}

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

            <MenuItem
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  function MenuItem({ icon: Icon, label, danger, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] text-left transition ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : "text-slate-700 hover:bg-slate-100"
        }`}
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

      {/* Filters (Visual Only) */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="mb-4 font-medium text-slate-800">Filters</div>
        <div className="grid grid-cols-4 gap-4">
          <input
            className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="Type/Department"
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

        {error && (
          <div className="px-6 pb-4 text-sm text-red-500">
            Error loading SOPs: {error}
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-3 px-6 text-left font-medium">SOP ID</th>
              <th className="py-3 px-6 text-left font-medium">SOP Name</th>
              <th className="py-3 px-6 text-left font-medium">Version</th>
              <th className="py-3 px-6 text-left font-medium">Type</th>
              <th className="py-3 px-6 text-left font-medium">Last Updated</th>
              <th className="py-3 px-6 text-left font-medium">Status</th>
              <th className="py-3 px-6 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  Loading SOPs...
                </td>
              </tr>
            ) : sops.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No SOPs found. Add one to get started!
                </td>
              </tr>
            ) : (
              sops.map((row) => (
                <tr
                  key={row._id || row.sopId}
                  className="hover:bg-slate-50/80 transition duration-150"
                >
                  <td className="py-4 px-6 font-medium text-slate-700">
                    {row.sopId}
                  </td>
                  <td className="py-4 px-6 text-slate-700">{row.title}</td>
                  <td className="py-4 px-6 text-slate-500">
                    {row.version || "v1.0"}
                  </td>
                  <td className="py-4 px-6 text-slate-500">{row.type}</td>
                  <td className="py-4 px-6 text-slate-500">
                    {row.updatedAt
                      ? new Date(row.updatedAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        row.status?.toLowerCase() === "active"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : row.status?.toLowerCase() === "archived"
                          ? "bg-slate-100 text-slate-700 border border-slate-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {row.status || "Draft"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setSelectedSop(row);
                          setShowPdfViewer(true);
                        }}
                        className="p-1 hover:bg-blue-50 rounded transition"
                        title="View PDF"
                      >
                        <Eye className="h-4 w-4 cursor-pointer text-slate-400 hover:text-blue-600" />
                      </button>
                      <ActionsMenu
                        onEdit={() => {
                          setSelectedSop(row);
                          setShowEditSOP(true);
                        }}
                        onDelete={() => handleDeleteSOP(row._id)}
                        onExtract={() => {
                          setSelectedSop(row);
                          setShowExtractor(true);
                        }}
                        onBuildRag={() => {
                          setSelectedSop(row);
                          setShowBuildRag(true);
                        }}
                        onCompliance={() => {
                          setSelectedSop(row);
                          setShowCompliance(true);
                        }}
                        onChat={() => {
                          setSelectedSop(row);
                          setShowChat(true);
                        }}
                        onFlowchart={() => {
                          const referenceObjects = (row.references || []).map(
                            (refId) => {
                              const foundSop = sops.find(
                                (r) => r.sopId === refId
                              );
                              return (
                                foundSop || {
                                  sopId: refId,
                                  title: "Unknown SOP",
                                  type: "Unknown",
                                  status: "N/A",
                                }
                              );
                            }
                          );

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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showBuildRag && selectedSop && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <BuildRag
            sop={selectedSop}
            onClose={() => setShowBuildRag(false)}
          />
        </div>
      )}

      {showExtractor && selectedSop && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full h-full max-h-screen rounded-2xl bg-white shadow-2xl overflow-hidden">
            <DataExtractor
              sop={selectedSop}
              onClose={() => {
                setShowExtractor(false);
                fetchSOPMetadata(); // Refresh global state after extraction
              }}
            />
          </div>
        </div>
      )}

      {showCompliance && selectedSop && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <FDAComplianceAnalysis
              sop={selectedSop}
              onClose={() => setShowCompliance(false)}
            />
          </div>
        </div>
      )}

      {showChat && selectedSop && (
        <SOPChatLayout 
          sop={selectedSop} 
          onClose={() => setShowChat(false)}
          onRefresh={fetchSOPMetadata} // Pass Zustand fetch directly
        />
      )}

      {showFlowchart && selectedSop && (
        <SOPFlowchartLayout
          sop={selectedSop}
          onClose={() => setShowFlowchart(false)}
          onRefresh={fetchSOPMetadata} // Pass Zustand fetch directly
        />
      )}

      {showAddSOP && (
        <AddSOPModal
          onClose={() => setShowAddSOP(false)}
          onSOPAdded={fetchSOPMetadata} // Triggers Zustand to pull fresh list
        />
      )}

      {showEditSOP && selectedSop && (
        <EditSOPModal
          sop={selectedSop}
          onClose={() => setShowEditSOP(false)}
          onSOPEdited={fetchSOPMetadata} // Triggers Zustand to pull fresh list
        />
      )}

      {showPdfViewer && selectedSop && (
        <PDFViewerModal
          sop={selectedSop}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
    </div>
  );
}