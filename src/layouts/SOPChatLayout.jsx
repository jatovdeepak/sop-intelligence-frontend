import { useState, useEffect } from "react";
import { X, Database, FileJson, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import ChatWithSOP from "../components/ChatWithSOP";
import DataExtractor from "../sop-data-extractor/DataExtractor";
import BuildRag from "../components/BuildRag";

export default function SOPChatLayout({ sop, onClose, onRefresh }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const [localSop, setLocalSop] = useState(sop);

  // 1. Determine if we are still waiting for the real data to arrive from the API
  const [isLoading, setIsLoading] = useState(!sop || (!sop._id && !sop.sopId));

  // 2. Sync late-arriving prop data and turn off loading state
  useEffect(() => {
    if (sop && (sop._id || sop.sopId)) {
      setLocalSop(sop);
      setIsLoading(false);
    }
  }, [sop]);

  const checkIsDataEmpty = (dataToCheck) => {
    if (!dataToCheck) return true;
    if (Array.isArray(dataToCheck) && dataToCheck.length === 0) return true;
    
    if (typeof dataToCheck === "object" && !Array.isArray(dataToCheck)) {
      if (Object.keys(dataToCheck).length === 0 && !dataToCheck.sections) return true;
      
      if (dataToCheck.sections && Array.isArray(dataToCheck.sections)) {
        if (dataToCheck.sections.length === 0) return true;
        if (dataToCheck.sections.length === 1) {
          const firstSection = dataToCheck.sections[0];
          if (!firstSection.title && !firstSection.content && (!firstSection.children || firstSection.children.length === 0)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const isDataEmpty = checkIsDataEmpty(localSop?.data);
  const isRagReady = localSop?.embeddingStatus === "completed";
  
  // Compare timestamps for initial load
  const extractedTime = new Date(localSop?.lastExtractedTime || 0).getTime();
  const ragTime = new Date(localSop?.lastRagBuildTime || 0).getTime();
  const needsRebuild = extractedTime > ragTime;

  // 3. Start with a "loading" view if data isn't here yet
  const [view, setView] = useState(() => {
    if (isLoading) return "loading";
    if (isDataEmpty) return "setup";
    if (needsRebuild || !isRagReady) return "rag";
    return "chat";
  });

  // 4. Once loading is done (or data changes), route to the correct view automatically
  useEffect(() => {
    if (!isLoading) {
      if (isDataEmpty) {
        setView(prev => (prev === "extractor" ? "extractor" : "setup"));
      } else if (needsRebuild || !isRagReady) {
        setView(prev => (prev === "extractor" || prev === "rag" ? prev : "rag"));
      } else {
        setView("chat");
      }
    }
  }, [isLoading, isDataEmpty, needsRebuild, isRagReady]);

  // Pull the freshest data when Extractor or RAG closes
  const handleUpdateClose = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/sops/${localSop._id || localSop.sopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const updatedSop = await res.json();
        setLocalSop(updatedSop); 
        // Note: The useEffect above will handle moving the user to the correct view!
      } else {
        setView("setup");
      }
    } catch (err) {
      console.error("Failed to fetch updated SOP:", err);
      setView("setup");
    }

    if (onRefresh) onRefresh(); 
  };

  // --- RENDER VIEWS ---

  // 5. Render Loading Screen while waiting for API
  if (isLoading || view === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl shadow-xl min-w-[300px]" onClick={e => e.stopPropagation()}>
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Loading SOP...</h2>
          <p className="text-sm text-slate-500 mt-1">Fetching latest data</p>
        </div>
      </div>
    );
  }

  if (view === "extractor") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full h-full max-h-screen rounded-2xl bg-white shadow-2xl overflow-hidden">
          <DataExtractor sop={localSop} onClose={handleUpdateClose} />
        </div>
      </div>
    );
  }

  if (view === "rag") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <BuildRag sop={localSop} onClose={handleUpdateClose} />
      </div>
    );
  }

  if (view === "chat") {
    return <ChatWithSOP sop={localSop} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[90vh] w-[900px] flex-col rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between bg-orange-50 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">✨</div>
            <div>
              <h2 className="text-base font-semibold">SOP Preparation</h2>
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
            <Database className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">SOP Context Missing</h3>
          <p className="text-slate-500 mb-8 max-w-md text-center">
            You need to structure the data and build the vector embeddings before you can chat with this document.
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

            {/* Step 2: Build RAG */}
            <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${!needsRebuild && isRagReady ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${!needsRebuild && isRagReady ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                  {!needsRebuild && isRagReady ? <CheckCircle2 className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                </div>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${!needsRebuild && isRagReady ? "text-emerald-600" : "text-blue-500"}`}>Step 2</div>
                  <div className="font-semibold text-slate-800 text-lg">Build RAG</div>
                  <div className="text-xs flex items-center gap-2 mt-1">
                    <span className="text-slate-500">Status:</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                      needsRebuild ? "bg-amber-100 text-amber-700" :
                      isRagReady ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {needsRebuild ? "Out of Date" : (localSop?.embeddingStatus || "Not Embedded")}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setView("rag")}
                disabled={isDataEmpty}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                  isDataEmpty ? "bg-slate-100 text-slate-400 cursor-not-allowed" : 
                  !needsRebuild && isRagReady ? "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50" :
                  "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                {!needsRebuild && isRagReady ? "Re-Build RAG" : "Run Build"}
              </button>
            </div>

            {/* Jump to Chat Button */}
            {!isDataEmpty && isRagReady && !needsRebuild && (
              <button 
                onClick={() => setView("chat")} 
                className="w-full mt-6 flex items-center justify-center gap-2 bg-emerald-500 text-white p-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm"
              >
                Launch Chat <ArrowRight className="w-5 h-5" />
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}