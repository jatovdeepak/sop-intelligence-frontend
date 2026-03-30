import { useState, useEffect, useCallback } from "react";
import { X, GitBranch, FileJson, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import SOPFlowchart from "../components/SOPFlowchart";
import DataExtractor from "../sop-data-extractor/DataExtractor";

export default function SOPFlowchartLayout({ sop, onClose, onRefresh }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  
  // Initialize with the prop, but we know .data might be missing/undefined
  const [localSop, setLocalSop] = useState(sop);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("loading"); 

  /**
   * Improved check: Handles missing .data, empty arrays, or skeleton objects
   */
  const checkIsDataEmpty = useCallback((dataToCheck) => {
    if (!dataToCheck) return true;
    
    // If it's an array (unlikely for this schema, but safe)
    if (Array.isArray(dataToCheck)) return dataToCheck.length === 0;
    
    // Check sections inside the data object
    const sections = dataToCheck.sections;
    if (!sections || !Array.isArray(sections) || sections.length === 0) return true;
    
    // Check if the only section is a blank template
    if (sections.length === 1) {
      const s = sections[0];
      const hasNoContent = !s.title && !s.content && (!s.children || s.children.length === 0);
      return hasNoContent;
    }

    return false;
  }, []);

  const fetchFreshData = async (isInitialLoad = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("token");
      // Use _id from the initial prop or local state
      const targetId = sop._id || localSop._id;
      
      const response = await fetch(`${API_URL}/api/sops/${targetId}/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to sync SOP structure");

      const result = await response.json();
      
      /**
       * CRITICAL FIX: 
       * Your backend returns { data: { ... } }. 
       * We merge that into our localSop so all fields (title, id) are preserved.
       */
      const mergedSop = { 
        ...sop, 
        ...localSop, 
        data: result.data || result // Handle both wrapped and unwrapped responses
      };

      setLocalSop(mergedSop);

      // Determine the correct view based on the NEWLY fetched data
      const isEmpty = checkIsDataEmpty(mergedSop.data);
      setView(isEmpty ? "setup" : "flowchart");

    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message);
      // If we can't fetch, default to the setup screen so they can try extracting
      setView("setup"); 
    } finally {
      setLoading(false);
      // Notify parent component (Library table) to refresh its background data
      if (!isInitialLoad && onRefresh) onRefresh();
    }
  };

  useEffect(() => {
    fetchFreshData(true);
  }, []);

  const handleExtractorClose = () => {
    // When the extractor closes, we MUST re-fetch to get the saved data
    fetchFreshData(false);
  };

  // --- RENDERING ---

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-800">Analyzing Document Structure...</h3>
          <p className="text-sm text-slate-500 mt-1">Fetching process nodes</p>
        </div>
      </div>
    );
  }

  if (view === "extractor") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full h-full max-h-screen rounded-2xl bg-white shadow-2xl overflow-hidden">
          <DataExtractor sop={localSop} onClose={handleExtractorClose} />
        </div>
      </div>
    );
  }

  if (view === "flowchart") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <SOPFlowchart sop={localSop} onClose={onClose} />
      </div>
    );
  }

  // Final fallback: Setup / Preparation View
  const isCurrentlyEmpty = checkIsDataEmpty(localSop?.data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[85vh] w-[850px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between bg-white px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <GitBranch className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Flow Map Preparation</h2>
              <p className="text-sm text-slate-500 font-medium">
                {localSop?.sopId || "Document"} <span className="mx-1">•</span> 
                <span className={isCurrentlyEmpty ? "text-amber-600" : "text-emerald-600"}>
                  {isCurrentlyEmpty ? "Data Extraction Required" : "Process Ready"}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          <div className="max-w-md mx-auto text-center mb-10">
             <h3 className="text-2xl font-bold text-slate-800 mb-2">
               {isCurrentlyEmpty ? "Missing Flow Data" : "Structure Synced"}
             </h3>
             <p className="text-slate-500">
               {isCurrentlyEmpty 
                 ? "We couldn't find structured steps for this SOP. Please run the extractor to define the process flow."
                 : "The document data is ready. You can view the generated Flow Map or make further edits."}
             </p>
          </div>

          <div className="max-w-lg mx-auto space-y-4">
            <div className={`p-6 rounded-2xl border-2 transition-all ${!isCurrentlyEmpty ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${!isCurrentlyEmpty ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"}`}>
                    {!isCurrentlyEmpty ? <CheckCircle2 className="w-6 h-6" /> : <FileJson className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Process Extraction</h4>
                    <p className="text-sm text-slate-500">Convert document text into logic nodes.</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded-md border text-[10px] font-black uppercase tracking-tighter">
                      Status: <span className={isCurrentlyEmpty ? "text-amber-600" : "text-emerald-600"}>{isCurrentlyEmpty ? "Pending" : "Ready"}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setView("extractor")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    !isCurrentlyEmpty 
                      ? "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-100" 
                      : "bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200"
                  }`}
                >
                  {isCurrentlyEmpty ? "Open Extractor" : "Refine Steps"}
                </button>
              </div>
            </div>

            {!isCurrentlyEmpty && (
              <button 
                onClick={() => setView("flowchart")} 
                className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl"
              >
                View Flow Map <ArrowRight className="w-5 h-5 text-orange-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}