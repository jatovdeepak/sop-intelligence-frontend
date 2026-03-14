import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

// Reuse the same helper from the DataExtractor
const base64toBlob = (base64Data, contentType = 'application/pdf') => {
  const base64WithoutPrefix = base64Data.replace(/^data:[^;]+;base64,/, '');
  const byteCharacters = atob(base64WithoutPrefix);
  const byteArrays = [];
  const sliceSize = 512;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

export default function PDFViewerModal({ sop, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let objectUrl = null;

    if (sop?.pdfPathBase64) {
      try {
        const blob = base64toBlob(sop.pdfPathBase64);
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err) {
        console.error("Failed to parse PDF Base64 data:", err);
        setError("Failed to process the PDF document.");
      }
    } else {
      setError("No PDF data available for this SOP.");
    }

    // Cleanup memory when modal closes
    return () => {
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
                {sop.sopId}
              </span>
              {sop.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {pdfUrl && (
              <a 
                href={pdfUrl} 
                download={`${sop.sopId}_${sop.title.replace(/\s+/g, '_')}.pdf`}
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
          ) : !pdfUrl ? (
            <div className="text-slate-500 animate-pulse font-medium">Loading document...</div>
          ) : (
            <iframe 
              src={pdfUrl} 
              className="absolute inset-0 w-full h-full border-0" 
              title={`PDF Viewer - ${sop.title}`} 
            />
          )}
        </div>

      </div>
    </div>
  );
}