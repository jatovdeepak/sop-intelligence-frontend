import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TableEditor from "./TableEditor";
import FlowchartEditor from "./FlowchartEditor";
import MediaEditor from "./MediaEditor";

// --- Icons ---
const TrashIcon = () => (
  <svg
    className="w-3 h-3"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const CopyIcon = () => (
  <svg
    className="w-3 h-3 mr-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    className="w-3 h-3 mr-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const ImportIcon = () => (
  <svg
    className="w-3 h-3 mr-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-3 h-3"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const GripIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

const COLOR_OPTIONS = [
  "blue",
  "purple",
  "amber",
  "emerald",
  "rose",
  "cyan",
  "indigo",
  "orange",
  "gray",
];

// --- UID Generator for stable React mapping ---
const generateUid = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// Ensures all incoming data has stable internal IDs
const ensureUids = (nodes) => {
  return nodes.map((node) => ({
    ...node,
    uid: node.uid || generateUid(),
    children: node.children ? ensureUids(node.children) : [],
  }));
};

// --- Helpers to update deeply nested nodes immutably using `uid` ---
const updateTree = (nodes, targetUid, updater) => {
  return nodes.map((node) => {
    if (node.uid === targetUid) {
      return updater(node);
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateTree(node.children, targetUid, updater),
      };
    }
    return node;
  });
};

const deleteTree = (nodes, targetUid) => {
  return nodes
    .filter((node) => node.uid !== targetUid)
    .map((node) => ({
      ...node,
      children: node.children ? deleteTree(node.children, targetUid) : [],
    }));
};

const insertAfter = (nodes, targetUid) => {
  let result = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.uid === targetUid) {
      result.push(node);

      const parts = node.id.split(".");
      let newId = "";
      const lastPart = parseInt(parts[parts.length - 1], 10);

      if (!isNaN(lastPart)) {
        if (lastPart === 0 && parts.length >= 2) {
          const prevPart = parseInt(parts[parts.length - 2], 10);
          if (!isNaN(prevPart)) {
            parts[parts.length - 2] = (prevPart + 1).toString();
            newId = parts.join(".");
          } else {
            parts[parts.length - 1] = (lastPart + 1).toString();
            newId = parts.join(".");
          }
        } else {
          parts[parts.length - 1] = (lastPart + 1).toString();
          newId = parts.join(".");
        }
      } else {
        newId = `${node.id}-new`;
      }

      result.push({
        uid: generateUid(),
        id: newId,
        title: "",
        content: "",
        pageNumbers: "",
        metadata: [],
        flowcharts: [],
        tables: [],
        media: [],
        children: [],
      });
    } else {
      result.push({
        ...node,
        children: node.children ? insertAfter(node.children, targetUid) : [],
      });
    }
  }
  return result;
};

// --- Helper for Drag & Drop Validation ---
const findNode = (nodes, uid) => {
  for (const node of nodes) {
    if (node.uid === uid) return node;
    if (node.children) {
      const found = findNode(node.children, uid);
      if (found) return found;
    }
  }
  return null;
};

const isDescendant = (nodes, parentUid, childUid) => {
  const parent = findNode(nodes, parentUid);
  if (!parent) return false;
  const checkChildren = (children) => {
    for (const child of children) {
      if (child.uid === childUid) return true;
      if (child.children && checkChildren(child.children)) return true;
    }
    return false;
  };
  return checkChildren(parent.children || []);
};

// --- Recursive Form Component (Internal) ---
const RecursiveNode = ({ node, index, onUpdate, onDelete, onAddSibling }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (field, value) => {
    onUpdate(node.uid, (n) => ({ ...n, [field]: value }));
  };

  const handleAddChild = () => {
    const newChild = {
      uid: generateUid(),
      id: `${node.id}.${(node.children || []).length + 1}`,
      title: "",
      content: "",
      pageNumbers: "",
      metadata: [],
      flowcharts: [],
      tables: [],
      media: [],
      children: [],
    };
    onUpdate(node.uid, (n) => ({
      ...n,
      children: [...(n.children || []), newChild],
    }));
    setIsCollapsed(false);
  };

  const handleAddMetadata = () => {
    onUpdate(node.uid, (n) => ({
      ...n,
      metadata: [...(n.metadata || []), { key: "", value: "" }],
    }));
  };

  const handleMetadataChange = (metaIndex, field, value) => {
    onUpdate(node.uid, (n) => {
      const newMeta = [...(n.metadata || [])];
      newMeta[metaIndex] = { ...newMeta[metaIndex], [field]: value };
      return { ...n, metadata: newMeta };
    });
  };

  const handleDeleteMetadata = (metaIndex) => {
    onUpdate(node.uid, (n) => ({
      ...n,
      metadata: (n.metadata || []).filter((_, i) => i !== metaIndex),
    }));
  };

  const handleAddFlowchart = () => {
    onUpdate(node.uid, (n) => ({
      ...n,
      flowcharts: [...(n.flowcharts || []), { nodes: [], edges: [] }],
    }));
  };

  const handleAddTable = () => {
    onUpdate(node.uid, (n) => ({
      ...n,
      tables: [
        ...(n.tables || []),
        [
          ["", ""],
          ["", ""],
        ],
      ],
    }));
  };

  const handleAddMedia = () => {
    onUpdate(node.uid, (n) => ({
      ...n,
      media: [...(n.media || []), { type: "image", url: "", caption: "" }],
    }));
  };

  return (
    <Draggable draggableId={node.uid} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-6 bg-white relative group text-xs flex flex-col transition-all duration-200 
            ${
              snapshot.isDragging
                ? "shadow-2xl ring-2 ring-indigo-500 opacity-95 scale-[1.02] z-50 rounded"
                : "shadow-sm border border-gray-300 rounded"
            }
          `}
        >
          {/* STICKY HEADER & ACTION BAR */}
          <div
            className={`top-0 z-10 bg-white transition-all ${
              isCollapsed ? "rounded" : "rounded-t border-b border-gray-200"
            }`}
          >
            <div
              className={`flex gap-1 p-2 items-center bg-gray-50 ${
                isCollapsed ? "rounded" : "rounded-t"
              }`}
            >
              {/* Drag Handle Area */}
              <div
                {...provided.dragHandleProps}
                className="flex items-center justify-center p-1 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                title="Drag to move section"
              >
                <GripIcon />
              </div>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-0.5 rounded transition-colors"
                title={isCollapsed ? "Expand Section" : "Collapse Section"}
              >
                {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
              </button>

              <input
                className="border border-gray-300 p-1 w-16 rounded focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold text-xs"
                placeholder="ID (1.0)"
                value={node.id}
                onChange={(e) => handleChange("id", e.target.value)}
              />
              <input
                className="border border-gray-300 p-1 w-20 rounded focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                placeholder="Pg (3-5)"
                value={node.pageNumbers || ""}
                onChange={(e) => handleChange("pageNumbers", e.target.value)}
                title="Page Numbers"
              />
              <input
                className="border border-gray-300 p-1 flex-1 rounded focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold text-xs"
                placeholder="Section Title"
                value={node.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
              <button
                onClick={() => onDelete(node.uid)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors p-1 rounded"
                title="Delete Entire Section"
              >
                <TrashIcon />
              </button>
            </div>

            {!isCollapsed && (
              <div className="flex flex-wrap gap-1 p-2 bg-white">
                <button
                  onClick={handleAddChild}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] hover:bg-blue-600 shadow-sm transition-colors"
                >
                  + Add Sub-section
                </button>
                <button
                  onClick={() => onAddSibling(node.uid)}
                  className="bg-slate-600 text-white px-2 py-1 rounded text-[10px] hover:bg-slate-700 shadow-sm transition-colors"
                >
                  + Add Sibling Section
                </button>
                <button
                  onClick={handleAddMetadata}
                  className="bg-orange-500 text-white px-2 py-1 rounded text-[10px] hover:bg-orange-600 shadow-sm transition-colors"
                >
                  + Add Metadata
                </button>
                <button
                  onClick={handleAddFlowchart}
                  className="bg-purple-500 text-white px-2 py-1 rounded text-[10px] hover:bg-purple-600 shadow-sm transition-colors"
                >
                  + Add Flowchart
                </button>
                <button
                  onClick={handleAddTable}
                  className="bg-green-600 text-white px-2 py-1 rounded text-[10px] hover:bg-green-700 shadow-sm transition-colors"
                >
                  + Add Table
                </button>
                <button
                  onClick={handleAddMedia}
                  className="bg-teal-500 text-white px-2 py-1 rounded text-[10px] hover:bg-teal-600 shadow-sm transition-colors"
                >
                  + Add Media
                </button>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col relative h-full">
              <div className="p-2 pb-0">
                {(node.metadata || []).length > 0 && (
                  <div className="mb-1.5 space-y-1 bg-gray-50 p-1.5 rounded border border-gray-200">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Section Metadata
                    </label>
                    {(node.metadata || []).map((meta, i) => (
                      <div key={i} className="flex gap-1 items-center">
                        <input
                          className="border border-gray-300 p-1 w-1/3 rounded text-xs focus:outline-blue-500"
                          placeholder="Key (e.g., Sub-system Code)"
                          value={meta.key}
                          onChange={(e) =>
                            handleMetadataChange(i, "key", e.target.value)
                          }
                        />
                        <input
                          className="border border-gray-300 p-1 flex-1 rounded text-xs focus:outline-blue-500"
                          placeholder="Value"
                          value={meta.value}
                          onChange={(e) =>
                            handleMetadataChange(i, "value", e.target.value)
                          }
                        />
                        <button
                          onClick={() => handleDeleteMetadata(i)}
                          className="text-red-400 hover:text-red-600 p-1 rounded"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <MediaEditor
                  nodeId={node.id}
                  media={node.media || []}
                  onUpdate={(id, updater) => onUpdate(node.uid, updater)}
                />

                <textarea
                  className="border border-gray-300 p-1.5 w-full rounded mb-1.5 h-16 text-xs focus:outline-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Text Content..."
                  value={node.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                />

                <FlowchartEditor
                  nodeId={node.id}
                  flowcharts={node.flowcharts || []}
                  onUpdate={(id, updater) => onUpdate(node.uid, updater)}
                />
                <TableEditor
                  nodeId={node.id}
                  tables={node.tables || []}
                  onUpdate={(id, updater) => onUpdate(node.uid, updater)}
                />
              </div>

              {/* DROPPABLE ZONE FOR CHILDREN */}
              <Droppable droppableId={`drop-${node.uid}`} type="SECTION">
                {(provided, dropSnapshot) => {
                  const hasChildren = node.children && node.children.length > 0;
                  return (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`mx-2 rounded transition-all duration-200
          ${hasChildren ? "mt-2 mb-2 border-l-2 pl-2 border-blue-200" : ""}
          ${
            dropSnapshot.isDraggingOver
              ? "min-h-[50px] mt-2 mb-2 border-l-2 pl-2 border-indigo-400 bg-indigo-50/50"
              : "min-h-[8px] pb-1" // Shrinks to almost nothing when not dragging
          }
        `}
                    >
                      {(node.children || []).map((child, i) => (
                        <RecursiveNode
                          key={child.uid}
                          index={i}
                          node={child}
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                          onAddSibling={onAddSibling}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  );
                }}
              </Droppable>
            </div>
          )}

          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10 opacity-70 hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddSibling(node.uid)}
              className="bg-white border border-gray-300 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 rounded-full flex items-center justify-center shadow-sm transition-all h-6 w-6"
              title="Add Section Below (Same Level)"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

// --- Main Layout Component (Exported) ---
export default function DataExtractor({ sop, onClose }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(!!sop?.pdfPathBase64);
  const [showJson, setShowJson] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const loadPdfAsync = async () => {
      if (sop?.pdfPathBase64) {
        setIsPdfLoading(true);
        try {
          const prefix = "data:application/pdf;base64,";
          const dataUri = sop.pdfPathBase64.startsWith("data:")
            ? sop.pdfPathBase64
            : prefix + sop.pdfPathBase64;

          const response = await fetch(dataUri);
          const blob = await response.blob();

          if (isMounted) {
            objectUrl = URL.createObjectURL(blob);
            setPdfFile(objectUrl);
          }
        } catch (error) {
          console.error("Failed to parse PDF Base64 data:", error);
        } finally {
          if (isMounted) {
            setIsPdfLoading(false);
          }
        }
      }
    };

    loadPdfAsync();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sop]);

  const [documentData, setDocumentData] = useState(() => {
    if (sop?.data?.sections) {
      return {
        ...sop.data,
        sections: ensureUids(sop.data.sections),
      };
    }

    return {
      metadata: [],
      filters: [],
      sections: [
        {
          uid: generateUid(),
          id: "1.0",
          title: "",
          content: "",
          pageNumbers: "",
          metadata: [],
          flowcharts: [],
          tables: [],
          media: [],
          children: [],
        },
      ],
    };
  });

  useEffect(() => {
    if (!documentData.filters) {
      setDocumentData((prev) => ({ ...prev, filters: [] }));
    }
  }, []);

  useEffect(() => {
    if (!sop?._id) return;

    const timer = setTimeout(async () => {
      setSaveStatus("saving");

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/sops/${sop._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: documentData,
            lastExtractedTime: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          setLastSaved(new Date());
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus("error");
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
          sections: ensureUids(
            importedData.sections || [
              {
                uid: generateUid(),
                id: "1.0",
                title: "",
                content: "",
                pageNumbers: "",
                metadata: [],
                flowcharts: [],
                tables: [],
                media: [],
                children: [],
              },
            ]
          ),
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
      filters: [
        ...(prev.filters || []),
        { label: "", keywords: [], color: "blue" },
      ],
    }));
  };

  const handleFilterChange = (index, field, value) => {
    setDocumentData((prev) => {
      const newFilters = [...(prev.filters || [])];
      if (field === "keywords" && typeof value === "string") {
        newFilters[index] = {
          ...newFilters[index],
          keywords: value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
        };
      } else {
        newFilters[index] = { ...newFilters[index], [field]: value };
      }
      return { ...prev, filters: newFilters };
    });
  };

  const handleDeleteFilter = (index) => {
    setDocumentData((prev) => ({
      ...prev,
      filters: (prev.filters || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddRootMetadata = () => {
    setDocumentData((prev) => ({
      ...prev,
      metadata: [...prev.metadata, { key: "", value: "" }],
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
      metadata: prev.metadata.filter((_, i) => i !== index),
    }));
  };

  const handleNodeUpdate = (uid, updater) => {
    setDocumentData((prev) => ({
      ...prev,
      sections: updateTree(prev.sections, uid, updater),
    }));
  };

  const handleNodeDelete = (uid) => {
    setDocumentData((prev) => ({
      ...prev,
      sections: deleteTree(prev.sections, uid),
    }));
  };

  const handleAddSibling = (uid) => {
    setDocumentData((prev) => ({
      ...prev,
      sections: insertAfter(prev.sections, uid),
    }));
  };

  // --- NEW: Atlassian Drag Context Handler ---
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const dropUid = destination.droppableId.replace("drop-", "");

    setDocumentData((prev) => {
      if (
        dropUid !== "root" &&
        isDescendant(prev.sections, draggableId, dropUid)
      ) {
        alert("Cannot drop a section into its own sub-section.");
        return prev;
      }

      let draggedNode = null;

      const removeNodeDeep = (nodes) => {
        let filtered = [];
        for (const node of nodes) {
          if (node.uid === draggableId) {
            draggedNode = { ...node };
          } else {
            filtered.push({
              ...node,
              children: node.children ? removeNodeDeep(node.children) : [],
            });
          }
        }
        return filtered;
      };

      const treeWithoutNode = removeNodeDeep(prev.sections);
      if (!draggedNode) return prev;

      const insertNodeDeep = (nodes, targetDropUid, index) => {
        if (targetDropUid === "root") {
          const newNodes = [...nodes];
          newNodes.splice(index, 0, draggedNode);
          return newNodes;
        }

        return nodes.map((node) => {
          if (node.uid === targetDropUid) {
            const newChildren = [...(node.children || [])];
            newChildren.splice(index, 0, draggedNode);
            return { ...node, children: newChildren };
          }
          if (node.children) {
            return {
              ...node,
              children: insertNodeDeep(node.children, targetDropUid, index),
            };
          }
          return node;
        });
      };

      return {
        ...prev,
        sections: insertNodeDeep(treeWithoutNode, dropUid, destination.index),
      };
    });
  };

  const addRootSection = () => {
    setDocumentData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          uid: generateUid(),
          id: `${prev.sections.length + 1}.0`,
          title: "",
          content: "",
          pageNumbers: "",
          metadata: [],
          flowcharts: [],
          tables: [],
          media: [],
          children: [],
        },
      ],
    }));
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(documentData, null, 2));
    alert("JSON copied to clipboard!");
  };

  const downloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(documentData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);

    const sopIdMeta = documentData.metadata.find(
      (m) =>
        m.key.toLowerCase().includes("id") ||
        m.key.toLowerCase().includes("sop")
    );
    const fileName = sopIdMeta?.value
      ? `${sopIdMeta.value.replace(/[^a-z0-9]/gi, "_")}_extraction.json`
      : "sop_extraction.json";

    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex h-full w-full bg-gray-100 overflow-hidden text-gray-800 font-sans relative">
      {/* Left side: PDF Viewer */}
      <div className="w-1/2 p-2 flex flex-col border-r border-gray-300 bg-gray-50">
        <h2 className="text-base font-bold mb-2 flex items-center gap-2">
          {sop ? `SOP Viewer: ${sop.sopId || "Document"}` : "SOP Viewer"}
        </h2>
        {!pdfFile ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm">
            {isPdfLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="text-sm text-gray-500 font-medium">
                  Processing large document...
                </span>
              </div>
            ) : (
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="p-2 cursor-pointer text-sm"
              />
            )}
          </div>
        ) : (
          <iframe
            src={pdfFile}
            className="w-full h-full rounded border border-gray-300 bg-white shadow-sm"
            title="PDF Viewer"
          />
        )}
      </div>

      {/* Right side: Editor & Output */}
      <div className="w-1/2 p-2 flex flex-col h-full overflow-y-auto bg-gray-200 relative">
        <div className="flex justify-between items-center mb-2 bg-white p-2 rounded border border-gray-300 shadow-sm shrink-0">
          <h2 className="text-base font-bold">Data Extraction</h2>

          <div className="flex items-center gap-1">
            {saveStatus === "saving" && (
              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded animate-pulse mr-1">
                Saving...
              </span>
            )}

            {saveStatus === "error" && (
              <span className="text-[10px] text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1 border border-red-300 mr-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Save Failed!
              </span>
            )}

            {saveStatus === "saved" && lastSaved && (
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded mr-1">
                Saved{" "}
                {lastSaved.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}

            <button
              onClick={() => setShowJson(!showJson)}
              className={`px-2 py-1 text-xs rounded transition-colors shadow-sm font-semibold flex items-center justify-center min-w-[80px] ${
                showJson
                  ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {showJson ? "View Form" : "View JSON"}
            </button>

            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleImportJson}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center bg-purple-600 text-white px-2 py-1 text-xs rounded hover:bg-purple-700 transition-colors shadow-sm font-semibold"
            >
              <ImportIcon /> Import
            </button>

            <button
              onClick={copyJsonToClipboard}
              className="flex items-center bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 transition-colors shadow-sm font-semibold"
            >
              <CopyIcon /> Copy
            </button>
            <button
              onClick={downloadJson}
              className="flex items-center bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 transition-colors shadow-sm font-semibold"
            >
              <DownloadIcon /> Download
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="ml-1 flex items-center bg-slate-800 text-white px-2 py-1 text-xs rounded hover:bg-slate-900 transition-colors shadow-sm font-semibold"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 relative">
          {showJson ? (
            <div className="bg-gray-900 text-green-400 p-3 rounded shadow-inner overflow-auto h-full font-mono text-xs whitespace-pre-wrap">
              {JSON.stringify(documentData, null, 2)}
            </div>
          ) : (
            <>
              {/* Document Root Metadata UI */}
              <div className="bg-white p-2 rounded border border-gray-300 shadow-sm mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-gray-700">
                    Document Root Metadata
                  </h3>
                  <button
                    onClick={handleAddRootMetadata}
                    className="bg-orange-500 text-white px-2 py-1 rounded text-[10px] hover:bg-orange-600 shadow-sm transition-colors"
                  >
                    + Add Root Metadata
                  </button>
                </div>

                {documentData.metadata.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">
                    No root metadata added (e.g. Doc ID, Author, Effective
                    Date).
                  </p>
                ) : (
                  <div className="space-y-1">
                    {documentData.metadata.map((meta, i) => (
                      <div key={i} className="flex gap-1 items-center">
                        <input
                          className="border border-gray-300 p-1 w-1/3 rounded text-xs focus:outline-blue-500"
                          placeholder="Key (e.g., SOP ID)"
                          value={meta.key}
                          onChange={(e) =>
                            handleRootMetadataChange(i, "key", e.target.value)
                          }
                        />
                        <input
                          className="border border-gray-300 p-1 flex-1 rounded text-xs focus:outline-blue-500"
                          placeholder="Value"
                          value={meta.value}
                          onChange={(e) =>
                            handleRootMetadataChange(i, "value", e.target.value)
                          }
                        />
                        <button
                          onClick={() => handleDeleteRootMetadata(i)}
                          className="text-red-400 hover:text-red-600 p-1 rounded"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles / Filters UI */}
              <div className="bg-white p-2 rounded border border-gray-300 shadow-sm mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-gray-700">
                    Roles / Flowchart Lenses
                  </h3>
                  <button
                    onClick={handleAddFilter}
                    className="bg-indigo-500 text-white px-2 py-1 rounded text-[10px] hover:bg-indigo-600 shadow-sm transition-colors"
                  >
                    + Add Role/Filter
                  </button>
                </div>

                {(documentData.filters || []).length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">
                    No lenses defined. (e.g. Technician, Executive, IPQA)
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {(documentData.filters || []).map((filter, i) => (
                      <div
                        key={i}
                        className="flex gap-1 items-start bg-gray-50 p-1.5 rounded border border-gray-200"
                      >
                        <input
                          className="border border-gray-300 p-1 w-1/4 rounded focus:outline-indigo-500 text-xs"
                          placeholder="Label (e.g., IPQA)"
                          value={filter.label}
                          onChange={(e) =>
                            handleFilterChange(i, "label", e.target.value)
                          }
                        />
                        <input
                          className="border border-gray-300 p-1 flex-1 rounded focus:outline-indigo-500 text-xs"
                          placeholder="Keywords (comma separated)"
                          value={filter.keywords.join(", ")}
                          onChange={(e) =>
                            handleFilterChange(i, "keywords", e.target.value)
                          }
                          title="Keywords that trigger this role in a section"
                        />
                        <select
                          className="border border-gray-300 p-1 rounded focus:outline-indigo-500 text-xs bg-white capitalize"
                          value={filter.color}
                          onChange={(e) =>
                            handleFilterChange(i, "color", e.target.value)
                          }
                        >
                          {COLOR_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteFilter(i)}
                          className="text-red-400 hover:text-red-600 p-1 rounded mt-0.5"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sections Header */}
              <div className="sticky top-0 z-20 mb-3 pt-2 -mt-2 bg-gray-200">
                <div className="flex justify-between items-center bg-white p-2 border border-gray-300 rounded shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700">
                    SOP Sections
                  </h3>
                  <button
                    onClick={addRootSection}
                    className="bg-gray-800 text-white px-2 py-1 rounded text-[10px] hover:bg-gray-700 transition-colors shadow-sm"
                  >
                    + Add Root Section
                  </button>
                </div>
              </div>

              {/* Sections Form Tree (WRAPPED IN DRAGDROP CONTEXT) */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="drop-root" type="SECTION">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] pb-32 transition-colors duration-200 ${
                        snapshot.isDraggingOver
                          ? "bg-gray-300/50 rounded p-2"
                          : ""
                      }`}
                    >
                      {documentData.sections.map((rootNode, index) => (
                        <RecursiveNode
                          key={rootNode.uid}
                          index={index}
                          node={rootNode}
                          onUpdate={handleNodeUpdate}
                          onDelete={handleNodeDelete}
                          onAddSibling={handleAddSibling}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
