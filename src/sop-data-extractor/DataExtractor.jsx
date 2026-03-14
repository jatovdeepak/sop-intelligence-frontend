import React, { useState, useEffect, useRef } from 'react';
import TableEditor from './TableEditor';
import FlowchartEditor from './FlowchartEditor';
import MediaEditor from './MediaEditor';

// --- Icons ---
const TrashIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ImportIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const COLOR_OPTIONS = ['blue', 'purple', 'amber', 'emerald', 'rose', 'cyan', 'indigo', 'orange', 'gray'];

// Add this above your DataExtractor component
const base64toBlob = (base64Data, contentType = 'application/pdf') => {
  // Strip out the data:application/pdf;base64, prefix if it exists
  const base64WithoutPrefix = base64Data.replace(/^data:[^;]+;base64,/, '');
  
  const byteCharacters = atob(base64WithoutPrefix);
  const byteArrays = [];
  const sliceSize = 512; // Process in chunks to avoid memory spikes

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

// --- Helpers to update deeply nested nodes immutably ---
const updateTree = (nodes, targetId, updater) => {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return updater(node);
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateTree(node.children, targetId, updater) };
    }
    return node;
  });
};

const deleteTree = (nodes, targetId) => {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      children: node.children ? deleteTree(node.children, targetId) : []
    }));
};

// --- Recursive Form Component (Internal) ---
const RecursiveNode = ({ node, onUpdate, onDelete }) => {
  const handleChange = (field, value) => {
    onUpdate(node.id, (n) => ({ ...n, [field]: value }));
  };

  const handleAddChild = () => {
    const newChild = {
      id: `${node.id}.${node.children.length + 1}`,
      title: '',
      content: '',
      pageNumbers: '',
      metadata: [],
      flowcharts: [],
      tables: [],
      media: [],
      children: [],
    };
    onUpdate(node.id, (n) => ({ ...n, children: [...n.children, newChild] }));
  };

  const handleAddMetadata = () => {
    onUpdate(node.id, (n) => ({
      ...n,
      metadata: [...(n.metadata || []), { key: '', value: '' }]
    }));
  };

  const handleMetadataChange = (index, field, value) => {
    onUpdate(node.id, (n) => {
      const newMeta = [...(n.metadata || [])];
      newMeta[index] = { ...newMeta[index], [field]: value };
      return { ...n, metadata: newMeta };
    });
  };

  const handleDeleteMetadata = (index) => {
    onUpdate(node.id, (n) => ({
      ...n,
      metadata: (n.metadata || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddFlowchart = () => {
    onUpdate(node.id, (n) => ({
      ...n,
      flowcharts: [...(n.flowcharts || []), { nodes: [], edges: [] }]
    }));
  };

  const handleAddTable = () => {
    onUpdate(node.id, (n) => ({
      ...n,
      tables: [...(n.tables || []), [['', ''], ['', '']]] 
    }));
  };

  const handleAddMedia = () => {
    onUpdate(node.id, (n) => ({
      ...n,
      media: [...(n.media || []), { type: 'image', url: '', caption: '' }]
    }));
  };

  return (
    <div className="border border-gray-300 rounded p-4 mb-4 ml-4 bg-white shadow-sm relative group">
      <div className="flex gap-2 mb-3 items-center">
        <input
          className="border border-gray-300 p-2 w-24 rounded focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
          placeholder="ID (1.0)"
          value={node.id}
          onChange={(e) => handleChange('id', e.target.value)}
        />
        <input
          className="border border-gray-300 p-2 w-32 rounded focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          placeholder="Pg (e.g., 3-5)"
          value={node.pageNumbers || ''}
          onChange={(e) => handleChange('pageNumbers', e.target.value)}
          title="Page Numbers"
        />
        <input
          className="border border-gray-300 p-2 flex-1 rounded focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
          placeholder="Section Title"
          value={node.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
        <button
          onClick={() => onDelete(node.id)}
          className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors p-2 rounded"
          title="Delete Entire Section"
        >
          <TrashIcon />
        </button>
      </div>

      {(node.metadata || []).length > 0 && (
        <div className="mb-3 space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Section Metadata</label>
          {(node.metadata || []).map((meta, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input 
                className="border border-gray-300 p-1.5 w-1/3 rounded text-sm focus:outline-blue-500" 
                placeholder="Key (e.g., Sub-system Code)" 
                value={meta.key} 
                onChange={(e) => handleMetadataChange(i, 'key', e.target.value)} 
              />
              <input 
                className="border border-gray-300 p-1.5 flex-1 rounded text-sm focus:outline-blue-500" 
                placeholder="Value" 
                value={meta.value} 
                onChange={(e) => handleMetadataChange(i, 'value', e.target.value)} 
              />
              <button onClick={() => handleDeleteMetadata(i)} className="text-red-400 hover:text-red-600 p-1 rounded">
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Replaced Inline Media Block with the newly imported Component */}
      <MediaEditor nodeId={node.id} media={node.media || []} onUpdate={onUpdate} />

      <textarea
        className="border border-gray-300 p-2 w-full rounded mb-3 h-24 focus:outline-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder="Text Content..."
        value={node.content}
        onChange={(e) => handleChange('content', e.target.value)}
      />

      <FlowchartEditor nodeId={node.id} flowcharts={node.flowcharts || []} onUpdate={onUpdate} />
      <TableEditor nodeId={node.id} tables={node.tables || []} onUpdate={onUpdate} />

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <button onClick={handleAddChild} className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 shadow-sm transition-colors">
          + Add Sub-section
        </button>
        <button onClick={handleAddMetadata} className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 shadow-sm transition-colors">
          + Add Metadata
        </button>
        <button onClick={handleAddFlowchart} className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-600 shadow-sm transition-colors">
          + Add Flowchart
        </button>
        <button onClick={handleAddTable} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 shadow-sm transition-colors">
          + Add Table
        </button>
        <button onClick={handleAddMedia} className="bg-teal-500 text-white px-3 py-1.5 rounded text-sm hover:bg-teal-600 shadow-sm transition-colors">
          + Add Media
        </button>
      </div>

      <div className="mt-4 border-l-2 border-blue-200 pl-3">
        {node.children.map((child) => (
          <RecursiveNode 
            key={child.id} 
            node={child} 
            onUpdate={onUpdate} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Layout Component (Exported) ---
export default function DataExtractor({ sop, onClose }) {
  const [pdfFile, setPdfFile] = useState(sop?.pdfPathBase64 || null);
  const [showJson, setShowJson] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const fileInputRef = useRef(null); 
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    let objectUrl = null;

    if (sop?.pdfPathBase64) {
      try {
        // Convert the base64 string to a Blob
        const blob = base64toBlob(sop.pdfPathBase64);
        // Create an optimized local URL for the iframe
        objectUrl = URL.createObjectURL(blob);
        setPdfFile(objectUrl);
      } catch (error) {
        console.error("Failed to parse PDF Base64 data:", error);
      }
    }

    // Cleanup function: Revoke the URL when the component unmounts 
    // or when the SOP changes to prevent memory leaks.
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sop]);
  
  // Initialize purely from sop.data or use the default structure
  const [documentData, setDocumentData] = useState(() => {
    if (sop?.data?.sections) {
      return sop.data;
    }

    return {
      metadata: [],
      filters: [],
      sections: [
        { id: '1.0', title: '', content: '', pageNumbers: '', metadata: [], flowcharts: [], tables: [], media: [], children: [] }
      ]
    };
  });

  useEffect(() => {
    if (!documentData.filters) {
      setDocumentData(prev => ({ ...prev, filters: [] }));
    }
  }, []);

  // Auto-Save Effect (Debounced 1.5 seconds directly to the backend)
  useEffect(() => {
    // Prevent auto-save if this is a purely new/unsaved SOP without an ID
    if (!sop?._id) return;

    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/sops/${sop._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ data: documentData }) 
        });

        if (response.ok) {
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [documentData, sop, API_URL]);

  const handlePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(URL.createObjectURL(file));
    }
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        setDocumentData({
          metadata: importedData.metadata || [],
          filters: importedData.filters || [],
          sections: importedData.sections || [
            { id: '1.0', title: '', content: '', pageNumbers: '', metadata: [], flowcharts: [], tables: [], media: [], children: [] }
          ]
        });
        
      } catch (error) {
        console.error("Error parsing imported JSON:", error);
        alert("Failed to import. The file might not be valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleAddFilter = () => {
    setDocumentData((prev) => ({
      ...prev,
      filters: [...(prev.filters || []), { label: '', keywords: [], color: 'blue' }]
    }));
  };

  const handleFilterChange = (index, field, value) => {
    setDocumentData((prev) => {
      const newFilters = [...(prev.filters || [])];
      if (field === 'keywords' && typeof value === 'string') {
        newFilters[index] = { ...newFilters[index], keywords: value.split(',').map(s => s.trim()).filter(s => s) };
      } else {
        newFilters[index] = { ...newFilters[index], [field]: value };
      }
      return { ...prev, filters: newFilters };
    });
  };

  const handleDeleteFilter = (index) => {
    setDocumentData((prev) => ({
      ...prev,
      filters: (prev.filters || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddRootMetadata = () => {
    setDocumentData((prev) => ({
      ...prev,
      metadata: [...prev.metadata, { key: '', value: '' }]
    }));
  };

  const handleRootMetadataChange = (index, field, value) => {
    setDocumentData((prev) => {
      const newMeta = [...prev.metadata];
      newMeta[index] = { ...newMeta[index], [field]: value };
      return { ...prev, metadata: newMeta };
    });
  };

  const handleDeleteRootMetadata = (index) => {
    setDocumentData((prev) => ({
      ...prev,
      metadata: prev.metadata.filter((_, i) => i !== index)
    }));
  };

  const handleNodeUpdate = (id, updater) => {
    setDocumentData((prev) => ({
      ...prev,
      sections: updateTree(prev.sections, id, updater)
    }));
  };

  const handleNodeDelete = (id) => {
    setDocumentData((prev) => ({
      ...prev,
      sections: deleteTree(prev.sections, id)
    }));
  };

  const addRootSection = () => {
    setDocumentData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: `${prev.sections.length + 1}.0`, title: '', content: '', pageNumbers: '', metadata: [], flowcharts: [], tables: [], media: [], children: [] }
      ]
    }));
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(documentData, null, 2));
    alert('JSON copied to clipboard!');
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documentData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    const sopIdMeta = documentData.metadata.find(m => m.key.toLowerCase().includes('id') || m.key.toLowerCase().includes('sop'));
    const fileName = sopIdMeta?.value ? `${sopIdMeta.value.replace(/[^a-z0-9]/gi, '_')}_extraction.json` : "sop_extraction.json";
    
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex h-full w-full bg-gray-100 overflow-hidden text-gray-800 font-sans relative" style={{ zoom: '80%' }}>
      {/* Left side: PDF Viewer */}
      <div className="w-1/2 p-4 flex flex-col border-r border-gray-300 bg-gray-50">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {sop ? `SOP Viewer: ${sop.sopId || 'Document'}` : "SOP Viewer"}
        </h2>
        {!pdfFile ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm">
            <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="p-4 cursor-pointer" />
          </div>
        ) : (
          <iframe src={pdfFile} className="w-full h-full rounded border border-gray-300 bg-white shadow-sm" title="PDF Viewer" />
        )}
      </div>

      {/* Right side: Editor & Output */}
      <div className="w-1/2 p-4 flex flex-col h-full overflow-y-auto bg-gray-200 relative">
        <div className="flex justify-between items-center mb-4 bg-white p-4 rounded border border-gray-300 shadow-sm shrink-0">
          <h2 className="text-xl font-bold">Data Extraction</h2>
          
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-emerald-600 mr-2 font-medium bg-emerald-50 px-2 py-1 rounded">
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            
            <button 
              onClick={() => setShowJson(!showJson)} 
              className={`px-4 py-2 rounded transition-colors shadow-sm font-semibold flex items-center justify-center min-w-[120px] ${showJson ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {showJson ? 'View Form' : 'View JSON'}
            </button>
            
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleImportJson}
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors shadow-sm font-semibold"
            >
              <ImportIcon /> Import
            </button>

            <button 
              onClick={copyJsonToClipboard} 
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm font-semibold"
            >
              <CopyIcon /> Copy
            </button>
            <button 
              onClick={downloadJson} 
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors shadow-sm font-semibold"
            >
              <DownloadIcon /> Download
            </button>

            {onClose && (
               <button 
                 onClick={onClose} 
                 className="ml-2 flex items-center bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 transition-colors shadow-sm font-semibold"
               >
                 Close
               </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          {showJson ? (
            <div className="bg-gray-900 text-green-400 p-4 rounded shadow-inner overflow-auto h-full font-mono text-sm whitespace-pre-wrap">
              {JSON.stringify(documentData, null, 2)}
            </div>
          ) : (
            <>
              {/* Document Root Metadata UI */}
              <div className="bg-white p-4 rounded border border-gray-300 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-gray-700">Document Root Metadata</h3>
                  <button onClick={handleAddRootMetadata} className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 shadow-sm transition-colors">
                    + Add Root Metadata
                  </button>
                </div>
                
                {documentData.metadata.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No root metadata added (e.g. Doc ID, Author, Effective Date).</p>
                ) : (
                  <div className="space-y-2">
                    {documentData.metadata.map((meta, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input 
                          className="border border-gray-300 p-2 w-1/3 rounded focus:outline-blue-500" 
                          placeholder="Key (e.g., SOP ID)" 
                          value={meta.key} 
                          onChange={(e) => handleRootMetadataChange(i, 'key', e.target.value)} 
                        />
                        <input 
                          className="border border-gray-300 p-2 flex-1 rounded focus:outline-blue-500" 
                          placeholder="Value" 
                          value={meta.value} 
                          onChange={(e) => handleRootMetadataChange(i, 'value', e.target.value)} 
                        />
                        <button onClick={() => handleDeleteRootMetadata(i)} className="text-red-400 hover:text-red-600 p-2 rounded">
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles / Filters UI */}
              <div className="bg-white p-4 rounded border border-gray-300 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-gray-700">Roles / Flowchart Lenses</h3>
                  <button onClick={handleAddFilter} className="bg-indigo-500 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-600 shadow-sm transition-colors">
                    + Add Role/Filter
                  </button>
                </div>
                
                {(documentData.filters || []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No lenses defined. (e.g. Technician, Executive, IPQA)</p>
                ) : (
                  <div className="space-y-3">
                    {(documentData.filters || []).map((filter, i) => (
                      <div key={i} className="flex gap-2 items-start bg-gray-50 p-2 rounded border border-gray-200">
                        <input 
                          className="border border-gray-300 p-2 w-1/4 rounded focus:outline-indigo-500 text-sm" 
                          placeholder="Label (e.g., IPQA)" 
                          value={filter.label} 
                          onChange={(e) => handleFilterChange(i, 'label', e.target.value)} 
                        />
                        <input 
                          className="border border-gray-300 p-2 flex-1 rounded focus:outline-indigo-500 text-sm" 
                          placeholder="Keywords (comma separated)" 
                          value={filter.keywords.join(', ')} 
                          onChange={(e) => handleFilterChange(i, 'keywords', e.target.value)} 
                          title="Keywords that trigger this role in a section"
                        />
                        <select 
                          className="border border-gray-300 p-2 rounded focus:outline-indigo-500 text-sm bg-white capitalize"
                          value={filter.color}
                          onChange={(e) => handleFilterChange(i, 'color', e.target.value)}
                        >
                          {COLOR_OPTIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <button onClick={() => handleDeleteFilter(i)} className="text-red-400 hover:text-red-600 p-2 rounded mt-0.5">
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sections Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">SOP Sections</h3>
                <button onClick={addRootSection} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors shadow-sm">
                  + Add Root Section
                </button>
              </div>

              {/* Sections Form Tree */}
              {documentData.sections.map((rootNode) => (
                <RecursiveNode 
                  key={rootNode.id} 
                  node={rootNode} 
                  onUpdate={handleNodeUpdate} 
                  onDelete={handleNodeDelete} 
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}