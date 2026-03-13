import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import dagre from 'dagre';
import { Trash2, Plus, LayoutGrid, Eraser } from 'lucide-react';

import '@xyflow/react/dist/style.css';

// --- Dagre Layout Engine Logic ---
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Set the direction (TB = Top to Bottom, LR = Left to Right)
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // We assume a standard node size for the layout calculation
    dagreGraph.setNode(node.id, { width: 170, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.from || edge.source, edge.to || edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 85, // half of width
        y: nodeWithPosition.y - 40, // half of height
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- Custom Node Component ---
const CustomTextNode = ({ id, data }) => (
  <div className="bg-white border-2 border-slate-300 rounded-lg p-2 shadow-sm min-w-[160px] focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
    <Handle type="target" position={Position.Top} className="!bg-purple-400 w-2.5 h-2.5 border-none" />
    <textarea
      className="w-full text-center text-sm font-semibold bg-transparent focus:outline-none resize-none overflow-hidden block text-slate-700"
      rows="2"
      value={data.label}
      onChange={(e) => data.onLabelChange(id, e.target.value)}
      placeholder="Step details..."
    />
    <Handle type="source" position={Position.Bottom} className="!bg-purple-400 w-2.5 h-2.5 border-none" />
  </div>
);

const FlowchartBoard = ({ data, onChange }) => {
  const nodeTypes = useMemo(() => ({ customText: CustomTextNode }), []);

  const onNodesChange = useCallback(
    (changes) => onChange({ ...data, nodes: applyNodeChanges(changes, data.nodes || []) }),
    [data, onChange]
  );

  const onEdgesChange = useCallback(
    (changes) => onChange({ ...data, edges: applyEdgeChanges(changes, data.edges || []) }),
    [data, onChange]
  );

  const onConnect = useCallback(
    (params) => onChange({ 
      ...data, 
      edges: addEdge({ ...params, animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } }, data.edges || []) 
    }),
    [data, onChange]
  );

  const handleLabelChange = useCallback((id, newLabel) => {
    onChange({
      ...data,
      nodes: (data.nodes || []).map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n))
    });
  }, [data, onChange]);

  const nodesWithCallbacks = useMemo(() => 
    (data.nodes || []).map((n) => ({ ...n, data: { ...n.data, onLabelChange: handleLabelChange } })),
    [data.nodes, handleLabelChange]
  );

  const handleAddNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'customText',
      position: { x: 250, y: 150 },
      data: { label: 'New Step' },
    };
    onChange({ ...data, nodes: [...(data.nodes || []), newNode] });
  };

  const onLayout = useCallback(() => {
    const { nodes, edges } = getLayoutedElements(data.nodes, data.edges);
    onChange({ ...data, nodes: [...nodes], edges: [...edges] });
  }, [data, onChange]);

  const onClear = () => onChange({ nodes: [], edges: [] });

  return (
    <div className="relative w-full h-[600px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
      {/* Dynamic Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={handleAddNode} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-all text-slate-700">
          <Plus size={14} className="text-purple-600" /> ADD NODE
        </button>
        <button onClick={onLayout} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-all text-slate-700">
          <LayoutGrid size={14} className="text-blue-600" /> AUTO-LAYOUT
        </button>
        <button onClick={onClear} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 transition-all text-red-600">
          <Eraser size={14} /> CLEAR
        </button>
      </div>

      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={data.edges || []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls className="bg-white border-slate-200 shadow-xl" />
      </ReactFlow>
    </div>
  );
};

export default function FlowchartEditor({ nodeId, flowcharts = [], onUpdate }) {
  const handleUpdate = (index, newData) => {
    onUpdate(nodeId, (n) => {
      const updated = [...(n.flowcharts || [])];
      updated[index] = newData;
      return { ...n, flowcharts: updated };
    });
  };

  const handleDelete = (index) => {
    onUpdate(nodeId, (n) => ({
      ...n,
      flowcharts: (n.flowcharts || []).filter((_, i) => i !== index)
    }));
  };

  if (!flowcharts?.length) return null;

  return (
    <div className="space-y-10 py-4">
      {flowcharts.map((fc, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded">BOARD {i + 1}</span>
              <h3 className="text-sm font-bold text-slate-700">Visual SOP Flow</h3>
            </div>
            <button onClick={() => handleDelete(i)} className="text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="p-6 bg-slate-50/30">
            <FlowchartBoard 
                data={typeof fc === 'object' ? fc : { nodes: [], edges: [] }} 
                onChange={(data) => handleUpdate(i, data)} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}