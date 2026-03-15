import { useState, useEffect } from "react";
import { X, GitBranch, FileJson, ArrowRight, CheckCircle2 } from "lucide-react";
import SOPFlowchart from "../components/SOPFlowchart";
import DataExtractor from "../sop-data-extractor/DataExtractor";

export default function SOPFlowchartLayout({ sop, onClose, onRefresh }) {
  // Check if data is missing/empty
  const isDataEmpty =
    !sop?.data ||
    (Array.isArray(sop?.data) && sop.data.length === 0) ||
    (typeof sop?.data === "object" && !Array.isArray(sop.data) && Object.keys(sop.data).length === 0 && !sop.data.sections);

  // If data is missing, default to "setup", otherwise jump straight to "flowchart"
  const [view, setView] = useState(isDataEmpty ? "setup" : "flowchart");

  // Keep view updated if SOP prop updates (e.g., after running extractor)
  useEffect(() => {
    if (!isDataEmpty && view === "setup") {
      setView("flowchart");
    }
  }, [isDataEmpty, view]);

  // 1. Render Data Extractor
  if (view === "extractor") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full h-full max-h-screen rounded-2xl bg-white shadow-2xl overflow-hidden">
          <DataExtractor
            sop={sop}
            onClose={() => {
              setView("setup");
              if (onRefresh) onRefresh(); // Trigger a refetch in the Library
            }}
          />
        </div>
      </div>
    );
  }

  // 2. Render Flowchart Modal
  if (view === "flowchart") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <SOPFlowchart sop={sop} onClose={onClose} />
      </div>
    );
  }

  // 3. Render Setup Dashboard (Fallback when data is missing)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[90vh] w-[900px] flex-col rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between bg-orange-50 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">✨</div>
            <div>
              <h2 className="text-base font-semibold">Flow Map Preparation</h2>
              <p className="text-sm text-slate-500">{sop?.sopId ?? "SOP"} · Setup Required</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-orange-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-6">
            <GitBranch className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">SOP Data Missing</h3>
          <p className="text-slate-500 mb-8 max-w-md text-center">
            You need to extract and structure the document data before the system can generate a Flow Map.
          </p>

          <div className="w-full max-w-lg space-y-4">
            
            {/* Step 1: Data Extractor */}
            <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${!isDataEmpty ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${!isDataEmpty ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>
                  {!isDataEmpty ? <CheckCircle2 className="w-6 h-6" /> : <FileJson className="w-6 h-6" />}
                </div>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${!isDataEmpty ? "text-emerald-600" : "text-orange-500"}`}>Step 1</div>
                  <div className="font-semibold text-slate-800 text-lg">Extract Data</div>
                  <div className="text-xs flex items-center gap-2 mt-1">
                    <span className="text-slate-500">Status:</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide ${isDataEmpty ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {isDataEmpty ? "Pending" : "Completed"}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setView("extractor")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${!isDataEmpty ? "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50" : "bg-orange-100 text-orange-600 hover:bg-orange-200"}`}
              >
                {!isDataEmpty ? "Edit Data" : "Open Extractor"}
              </button>
            </div>

            {/* Jump to Flowchart Button (Appears if user completes extraction but stays on screen) */}
            {!isDataEmpty && (
              <button 
                onClick={() => setView("flowchart")} 
                className="w-full mt-6 flex items-center justify-center gap-2 bg-emerald-500 text-white p-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm"
              >
                View Flow Map <ArrowRight className="w-5 h-5" />
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}