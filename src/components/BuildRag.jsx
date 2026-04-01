import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, X, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { useServiceStatus } from "../context/ServiceStatusContext";
import { SOP_API } from "../services/api-service"; 
import useStore from "../services/useStore"; 

export default function BuildRag({ sop, onClose, onSuccess, forceRebuild = false }) {
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error', 'offline'
  const [message, setMessage] = useState("");
  
  const hasTriggered = useRef(false);

  const { rag } = useServiceStatus();
  const isRagOffline = rag.status !== "online" && rag.status !== "connecting";

  const fetchSOPMetadata = useStore((state) => state.fetchSOPMetadata);

  useEffect(() => {
    const triggerEmbedding = async () => {
      try {
        const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";
        
        const rawId = sop.sopId || sop._id;
        let safeDocumentId = rawId.toString().replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

        const payload = {
          document_id: safeDocumentId,
          jsonData: sop.data, 
        };

        // --- STEP 1: Embed in ChromaDB ---
        const response = await fetch(`${RAG_API_URL}/api/embed-sop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to embed SOP data.");
        }

        // --- STEP 2: Update MongoDB ---
        const newRagBuildTime = data.lastRagBuildTime || new Date().toISOString();
        const newEmbeddingStatus = data.embeddingStatus || "completed";

        try {
          await SOP_API.updateSOP(sop._id, {
            embeddingId: data.id || safeDocumentId, 
            embeddingStatus: newEmbeddingStatus, 
            lastRagBuildTime: newRagBuildTime
          });

          // --- STEP 2.5: FORCE GLOBAL METADATA REFRESH ---
          await fetchSOPMetadata();

        } catch (dbError) {
          console.error("Error updating MongoDB:", dbError);
          setStatus("error");
          setMessage("RAG embedded successfully, but saving to your database failed. Stopping to prevent loop.");
          toast.error("Database sync failed.");
          return; 
        }

        // --- STEP 3: Finish and execute plain onSuccess ---
        const successMsg = data.message || `Successfully embedded SOP ${safeDocumentId}`;
        setStatus("success");
        setMessage(successMsg);
        toast.success("RAG database updated successfully!"); 
        
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(); // Clean, payload-free execution 
          } else {
            onClose();
          }
        }, 1500);

      } catch (err) {
        const errorMsg = err.message || "An unexpected error occurred.";
        setStatus("error");
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    if (sop && !hasTriggered.current) {
      if (isRagOffline) {
        setStatus("offline");
        toast.error("Cannot build: RAG Service is offline.");
        return; 
      }

      hasTriggered.current = true;

      const extractedTime = new Date(sop.lastExtractedTime || 0).getTime();
      const ragTime = new Date(sop.lastRagBuildTime || 0).getTime();

      if (
        sop.embeddingStatus === "Pending" || 
        sop.embeddingStatus === "Not Embedded" || 
        sop.embeddingStatus === "Failed" || 
        sop.embeddingStatus !== "completed" || 
        forceRebuild || 
        extractedTime > ragTime
      ) {
        triggerEmbedding();
      } else {
        setStatus("success");
        setMessage("RAG memory is already up to date!");
        toast.success("RAG memory is up to date!"); 
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(); 
          } else {
            onClose();
          }
        }, 1000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sop, onClose, onSuccess, isRagOffline, forceRebuild]); 

  return (
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center justify-center py-6 text-center">
        {/* LOADING STATE */}
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">Building RAG Database</h3>
            <p className="mt-2 text-sm text-slate-500">
              Chunking, embedding, and saving vectors to ChromaDB. This might take a moment...
            </p>
          </>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">RAG Ready!</h3>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <p className="mt-4 text-xs font-medium text-emerald-600 animate-pulse">
              Opening chat...
            </p>
          </>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">Embedding Failed</h3>
            <p className="mt-2 text-sm text-red-500">{message}</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              Close
            </button>
          </>
        )}

        {/* OFFLINE STATE */}
        {status === "offline" && (
          <>
            <WifiOff className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">Service Offline</h3>
            <p className="mt-2 text-sm text-slate-500">
              The RAG AI Service is currently disconnected. We cannot process or embed this document right now.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-200 transition"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}