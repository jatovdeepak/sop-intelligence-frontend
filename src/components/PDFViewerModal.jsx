import React, { useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

export default function PDFViewerModal({ sop, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(!!sop?.pdfPathBase64);

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const loadPdfAsync = async () => {
      if (sop?.pdfPathBase64) {
        setIsLoading(true);
        setError(null);
        try {
          // Ensure it's formatted as a proper data URI
          const prefix = 'data:application/pdf;base64,';
          const dataUri = sop.pdfPathBase64.startsWith('data:') 
            ? sop.pdfPathBase64 
            : prefix + sop.pdfPathBase64;

          // Process asynchronously off the main thread
          const response = await fetch(dataUri);
          const blob = await response.blob();
          
          if (isMounted) {
            objectUrl = URL.createObjectURL(blob);
            setPdfUrl(objectUrl);
          }
        } catch (err) {
          console.error("Failed to parse PDF Base64 data:", err);
          if (isMounted) setError("Failed to process the PDF document.");
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        if (isMounted) {
          setError("No PDF data available for this SOP.");
          setIsLoading(false);
        }
      }
    };

    loadPdfAsync();

    // Cleanup memory when modal closes
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sop]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-semibold">
                {sop?.sopId || 'SOP'}
              </span>
              {sop?.title || 'Document Viewer'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {pdfUrl && !isLoading && (
              <a 
                href={pdfUrl} 
                download={`${sop?.sopId || 'document'}_${(sop?.title || 'export').replace(/\s+/g, '_')}.pdf`}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* PDF Iframe or Status States */}
        <div className="flex-1 w-full bg-slate-200 relative flex items-center justify-center">
          {error ? (
            <div className="text-slate-500 flex flex-col items-center gap-2">
              <p className="font-medium text-red-500">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="font-medium animate-pulse">Processing document...</p>
            </div>
          ) : pdfUrl && (
            <iframe 
              src={pdfUrl} 
              className="absolute inset-0 w-full h-full border-0" 
              title={`PDF Viewer - ${sop?.title}`} 
            />
          )}
        </div>

      </div>
    </div>
  );
}