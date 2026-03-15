import { useState, useEffect } from "react";
import { X, GitBranch, FileJson, ArrowRight, CheckCircle2 } from "lucide-react";
import SOPFlowchart from "../components/SOPFlowchart";
import DataExtractor from "../sop-data-extractor/DataExtractor";

export default function SOPFlowchartLayout({ sop, onClose, onRefresh }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  
  // 1. Keep a local copy of the SOP so we can update it without closing the modal
  const [localSop, setLocalSop] = useState(sop);

  // 2. A smarter check to see if the data is TRULY empty 
  // (handles cases where the extractor saves a blank default section)
  const checkIsDataEmpty = (dataToCheck) => {
    if (!dataToCheck) return true;
    if (Array.isArray(dataToCheck) && dataToCheck.length === 0) return true;
    
    if (typeof dataToCheck === "object" && !Array.isArray(dataToCheck)) {
      if (Object.keys(dataToCheck).length === 0 && !dataToCheck.sections) return true;
      
      // If sections exist, check if the first one is just a blank default skeleton
      if (dataToCheck.sections && Array.isArray(dataToCheck.sections)) {
        if (dataToCheck.sections.length === 0) return true;
        if (dataToCheck.sections.length === 1) {
          const firstSection = dataToCheck.sections[0];
          if (!firstSection.title && !firstSection.content && (!firstSection.children || firstSection.children.length === 0)) {
            return true; // It's just an empty default section
          }
        }
      }
    }
    return false;
  };

  const isDataEmpty = checkIsDataEmpty(localSop?.data);

  // If data is missing, default to "setup", otherwise jump straight to "flowchart"
  const [view, setView] = useState(isDataEmpty ? "setup" : "flowchart");

  // Keep view updated if localSop updates
  useEffect(() => {
    if (!isDataEmpty && view === "setup") {
      setView("flowchart");
    }
  }, [isDataEmpty, view]);

  // 3. Function to pull the freshest data from your DB when the extractor closes
  const handleExtractorClose = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/sops/${localSop._id || localSop.sopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const updatedSop = await res.json();
        setLocalSop(updatedSop); // Update our local state with the fresh DB data
        
        // Decide where to go next based on the fresh data
        if (checkIsDataEmpty(updatedSop.data)) {
          setView("setup"); // Still empty, stay on setup
        } else {
          setView("flowchart"); // Data exists now, jump to flowchart!
        }
      } else {
        setView("setup");
      }
    } catch (err) {
      console.error("Failed to fetch updated SOP:", err);
      setView("setup");
    }

    if (onRefresh) onRefresh(); // Quietly update the background Library table too
  };

  // --- RENDER VIEWS ---

  // 1. Render Data Extractor
  if (view === "extractor") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full h-full max-h-screen rounded-2xl bg-white shadow-2xl overflow-hidden">
          <DataExtractor
            sop={localSop}
            onClose={handleExtractorClose} // <-- Call our new fetch function here
          />
        </div>
      </div>
    );
  }

  // 2. Render Flowchart Modal
  if (view === "flowchart") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <SOPFlowchart sop={localSop} onClose={onClose} />
      </div>
    );
  }

  // 3. Render Setup Dashboard
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[90vh] w-[900px] flex-col rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between bg-orange-50 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">✨</div>
            <div>
              <h2 className="text-base font-semibold">Flow Map Preparation</h2>
              <p className="text-sm text-slate-500">{localSop?.sopId ?? "SOP"} · Setup Required</p>
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

            {/* Jump to Flowchart Button */}
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