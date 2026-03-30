import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, AlertCircle } from 'lucide-react';

export default function PDFViewerModal({ sop, onClose }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const fetchAndLoadPdf = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = sessionStorage.getItem("token");
        const targetId = sop._id || sop.sopId;

        // 1. Fetch only the base64 data from the optimized endpoint
        const response = await fetch(`${API_URL}/api/sops/${targetId}/pdf-base64`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(response.status === 403 
            ? "Unauthorized: You don't have access to this PDF." 
            : "Failed to fetch PDF from server.");
        }

        const result = await response.json();
        const base64Data = result.pdfPathBase64;

        if (!base64Data) {
          throw new Error("No PDF document found for this SOP.");
        }

        // 2. Format as proper data URI
        const prefix = 'data:application/pdf;base64,';
        const dataUri = base64Data.startsWith('data:') 
          ? base64Data 
          : prefix + base64Data;

        // 3. Convert to Blob for better performance & memory management
        const blobResponse = await fetch(dataUri);
        const blob = await blobResponse.blob();
        
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        }
      } catch (err) {
        console.error("PDF Viewer Error:", err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAndLoadPdf();

    // Cleanup memory when modal closes or sop changes
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sop, API_URL]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {sop?.title || 'Document Viewer'}
              </h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                {sop?.sopId || 'Reference'} • PDF View
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pdfUrl && !isLoading && (
              <a 
                href={pdfUrl} 
                download={`${sop?.sopId || 'document'}.pdf`}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 w-full bg-slate-100 relative flex items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center gap-4 text-center p-6">
              <div className="bg-red-50 p-4 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-800 font-bold text-lg">Unable to display PDF</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
              >
                Close Viewer
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <div className="text-center">
                <p className="font-bold text-slate-700">Fetching Document...</p>
                <p className="text-xs">Preparing high-resolution preview</p>
              </div>
            </div>
          ) : pdfUrl && (
            <iframe 
              src={`${pdfUrl}#toolbar=1&navpanes=0`} 
              className="absolute inset-0 w-full h-full border-0" 
              title={`PDF Viewer - ${sop?.title}`} 
            />
          )}
        </div>
      </div>
    </div>
  );
}