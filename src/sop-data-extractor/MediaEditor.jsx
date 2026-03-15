import React, { useState } from 'react';

// --- Icons ---
const TrashIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const MediaIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function MediaEditor({ nodeId, media = [], onUpdate }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const API_URL = import.meta.env.VITE_API_STORAGE_SERVER || "http://localhost:5001";

  const handleMediaChange = (index, field, value) => {
    onUpdate(nodeId, (n) => {
      const newMedia = [...(n.media || [])];
      newMedia[index] = { ...newMedia[index], [field]: value };
      return { ...n, media: newMedia };
    });
  };

  const handleDeleteMedia = (index) => {
    onUpdate(nodeId, (n) => ({
      ...n,
      media: (n.media || []).filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;

    setUploadingIndex(index);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        body: formData, 
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      const uploadedUrl = data.url || data.fileUrl; 

      if (uploadedUrl) {
        handleMediaChange(index, 'url', uploadedUrl);
      } else {
        console.warn("Upload succeeded, but no URL was returned from the server.");
      }

    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media. Please try again.");
    } finally {
      setUploadingIndex(null);
    }
  };

  // --- New handler to catch pasted images ---
  const handlePaste = (e, index) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        // Prevent the default paste behavior (avoids pasting base64 text)
        e.preventDefault(); 
        
        // Extract the image file from the clipboard
        const file = items[i].getAsFile();
        
        // Push it to the existing upload function
        handleFileUpload(index, file);
        break; // Stop after finding the first image
      }
    }
  };

  if (!media || media.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 bg-blue-50 p-3 rounded border border-blue-200">
      <label className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2 flex items-center gap-1">
        <MediaIcon /> Section Media
      </label>
      {media.map((m, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select 
            className="border border-gray-300 p-1.5 rounded text-sm focus:outline-blue-500 bg-white"
            value={m.type}
            onChange={(e) => handleMediaChange(i, 'type', e.target.value)}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          
          {/* URL Input + Hidden File Input Wrapper */}
          <div className="flex flex-1 items-center gap-1 border border-gray-300 rounded focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden bg-white pr-1 transition-all">
            <input 
              className="p-1.5 flex-1 text-sm outline-none w-full" 
              placeholder="Media URL, Upload, or Paste Image Here" 
              value={m.url} 
              onChange={(e) => handleMediaChange(i, 'url', e.target.value)} 
              onPaste={(e) => handlePaste(e, i)} // Attach the paste handler here
              disabled={uploadingIndex === i}
            />
            
            <input
              type="file"
              accept={m.type === 'image' ? 'image/*' : 'video/*'}
              className="hidden"
              id={`media-upload-${nodeId}-${i}`}
              onChange={(e) => handleFileUpload(i, e.target.files[0])}
              disabled={uploadingIndex === i}
            />
            
            <label
              htmlFor={`media-upload-${nodeId}-${i}`}
              className={`cursor-pointer p-1 rounded transition-colors ${uploadingIndex === i ? 'text-gray-400' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
              title="Upload File"
            >
              {uploadingIndex === i ? <SpinnerIcon /> : <UploadIcon />}
            </label>
          </div>

          <input 
            className="border border-gray-300 p-1.5 flex-1 rounded text-sm focus:outline-blue-500" 
            placeholder="Caption (Optional)" 
            value={m.caption} 
            onChange={(e) => handleMediaChange(i, 'caption', e.target.value)} 
          />
          <button onClick={() => handleDeleteMedia(i)} className="text-red-400 hover:text-red-600 p-1 rounded">
            <TrashIcon />
          </button>
        </div>
      ))}
    </div>
  );
}