import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";

export default function BuildRag({ sop, onClose }) {
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    const triggerEmbedding = async () => {
      try {
        // Point this to your FastAPI RAG service port (e.g., 8000)
        const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";
        
        // 1. Sanitize the document ID for ChromaDB (replace spaces with underscores, lowercase it)
        const rawId = sop.sopId || sop._id;
        const safeDocumentId = rawId.toString().replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

        // 2. Safely extract the sections array from the 'data' object
        let sectionsArray = [];
        if (Array.isArray(sop.data)) {
          sectionsArray = sop.data;
        } else if (sop.data && Array.isArray(sop.data.sections)) {
          // If data is an object like {"sections": [...]}, grab the array
          sectionsArray = sop.data.sections;
        } else if (sop.data && typeof sop.data === 'object') {
           // Fallback if the object itself acts as the root node wrapper
           sectionsArray = [sop.data];
        } else if (Array.isArray(sop.sections)) {
           sectionsArray = sop.sections;
        }

        const payload = {
          document_id: safeDocumentId,
          sections: sectionsArray, 
        };

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

        setStatus("success");
        setMessage(data.message || `Successfully embedded SOP ${safeDocumentId}`);
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "An unexpected error occurred.");
      }
    };

    if (sop) {
      triggerEmbedding();
    }
  }, [sop]);

  return (
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center justify-center py-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">Building RAG Database</h3>
            <p className="mt-2 text-sm text-slate-500">
              Chunking, embedding, and saving vectors to ChromaDB. This might take a moment...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">RAG Ready!</h3>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
            >
              Done
            </button>
          </>
        )}

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
      </div>
    </div>
  );
}