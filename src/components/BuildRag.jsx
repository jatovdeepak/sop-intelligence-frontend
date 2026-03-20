import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, X, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { useServiceStatus } from "../context/ServiceStatusContext"; // 👈 Added context import

export default function BuildRag({ sop, onClose }) {
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error', 'offline'
  const [message, setMessage] = useState("");
  
  // Use a ref to prevent double-firing in React StrictMode
  const hasTriggered = useRef(false);

  // 🔥 RAG SERVICE STATUS
  const { rag } = useServiceStatus();
  const isRagOffline = rag.status !== "online" && rag.status !== "connecting";

  // Point to your Express Backend (Node.js) to update MongoDB
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  useEffect(() => {
    const triggerEmbedding = async () => {
      try {
        // Point this to your FastAPI RAG service port
        const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";
        
        // 1. Sanitize the document ID for ChromaDB (replace spaces with underscores, lowercase it)
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

        // --- STEP 2: Update MongoDB via Node.js Backend ---
        try {
          const token = localStorage.getItem("token");
          const dbUpdateResponse = await fetch(`${API_URL}/api/sops/${sop._id}`, {
            method: "PUT", 
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              embeddingId: data.id || safeDocumentId, 
              embeddingStatus: data.embeddingStatus || "completed", 
              lastRagBuildTime: data.lastRagBuildTime || new Date().toISOString()
            }),
          });

          if (!dbUpdateResponse.ok) {
            console.warn("RAG embedded successfully, but MongoDB update failed.");
            toast.error("RAG built, but failed to sync status with database.");
          }
        } catch (dbError) {
          console.error("Error updating MongoDB:", dbError);
          toast.error("Database sync failed.");
        }

        const successMsg = data.message || `Successfully embedded SOP ${safeDocumentId}`;
        setStatus("success");
        setMessage(successMsg);
        toast.success("RAG database updated successfully!"); 
        
        // --- Auto-close and open chat after success ---
        setTimeout(() => {
          onClose();
        }, 1500);

      } catch (err) {
        const errorMsg = err.message || "An unexpected error occurred.";
        setStatus("error");
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    if (sop && !hasTriggered.current) {
      // 🔥 INTERCEPT IF OFFLINE
      if (isRagOffline) {
        setStatus("offline");
        toast.error("Cannot build: RAG Service is offline.");
        return; 
      }

      hasTriggered.current = true;

      // --- Time Comparison Logic ---
      const extractedTime = new Date(sop.lastExtractedTime || 0).getTime();
      const ragTime = new Date(sop.lastRagBuildTime || 0).getTime();

      // If extraction is newer than the last build (or it's never been built), build it
      if (extractedTime > ragTime) {
        triggerEmbedding();
      } else {
        // Already up to date! Skip building and just open the chat
        setStatus("success");
        setMessage("RAG memory is already up to date!");
        toast.success("RAG memory is up to date!"); 
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    }
  }, [sop, onClose, isRagOffline]); // Added isRagOffline to dependencies

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

        {/* 🔥 NEW: OFFLINE STATE */}
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