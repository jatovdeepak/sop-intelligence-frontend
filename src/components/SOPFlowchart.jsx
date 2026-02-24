import React, { useCallback, useState, useMemo, createContext, useContext } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import dagre from 'dagre';
import { 
  Share2, 
  FileText, 
  Clock, 
  User, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  Plus,
  Minus,
  Filter,
  ChevronsDown,
  ChevronsUp,
  X,
  LayoutTemplate,
  Info
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. IMPORT THE JSON STRUCTURE
import structureData from './structure.json';
import 'reactflow/dist/style.css';

// Context to share the active filter state, layout direction, and action handlers
export const FlowContext = createContext({ 
  activeLens: 'All', 
  direction: 'TB',
  toggleNode: (id) => {},
  showMore: (id) => {}
});

// Helper for conditional classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Role Color Mapping Configuration
const roleColors = {
  'Technician - Eng': 'bg-blue-50 text-blue-700 border-blue-200',
  'Executive - Eng': 'bg-purple-50 text-purple-700 border-purple-200',
  'Head - Eng': 'bg-amber-50 text-amber-700 border-amber-200',
  'IPQA': 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const roleBorderColors = {
  'Technician - Eng': 'border-t-blue-500',
  'Executive - Eng': 'border-t-purple-500',
  'Head - Eng': 'border-t-amber-500',
  'IPQA': 'border-t-emerald-500'
};

// ============================================================================
// 2. DAGRE DYNAMIC AUTO-LAYOUT ENGINE
// ============================================================================

const NODE_WIDTH = 300; 
const NODE_HEIGHT = 180; 

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction, 
    ranksep: isHorizontal ? 120 : 80, 
    nodesep: isHorizontal ? 40 : 40 
  });

  nodes.forEach((node) => {
    if (!node.hidden) {
      dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
  });

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (sourceNode && !sourceNode.hidden && targetNode && !targetNode.hidden) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    if (node.hidden) return node; 
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,     
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,  
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

// ============================================================================
// 3. DATA GENERATOR & ENRICHMENT
// ============================================================================

function determineRoles(item) {
  const roles = [];
  const lowerText = `${item.title} ${item.content}`.toLowerCase();
  const id = String(item.id);

  if (lowerText.includes('ipqa') || lowerText.includes('qa') || lowerText.includes('cgmp') || id === '3.4' || id === '5.5') {
    roles.push('IPQA');
  }
  if (lowerText.includes('head') || lowerText.includes('designee') || id === '3.3' || id === '5.6') {
    roles.push('Head - Eng');
  }
  if (lowerText.includes('executive') || lowerText.includes('train') || lowerText.includes('monitor') || lowerText.includes('superior') || id === '3.2' || id === '5.5' || id === '5.6') {
    roles.push('Executive - Eng');
  }
  if (lowerText.includes('technician') || id.startsWith('5.') || id === '5.0' || id === '3.1') {
    roles.push('Technician - Eng');
  }
  return [...new Set(roles)];
}

function generateFlowData(jsonData) {
  const nodes = [];
  const edges = [];

  nodes.push({
    id: 'root',
    type: 'mainNode',
    position: { x: 0, y: 0 },
    hidden: false,
    data: {
      label: 'Tablet Compression PM',
      sublabel: 'SOP: GFMN032',
      isExpanded: false, 
      visibleLimit: 3,  
      details: {
        title: 'Preventive Maintenance of Tablet Compression Machine',
        owner: 'Engineering & QA',
        frequency: 'Various',
        updated: '16/06/2021',
        docId: 'GFMN032-09',
        description: 'Procedure for Preventive maintenance of Tablet Compression Machine (Make: KORSCH/KILIAN/SEJONG/FETTE). Comply with cGMP.'
      }
    },
  });

  const traverse = (items, parentId, depth) => {
    items.forEach((item) => {
      const cleanTitle = item.title.trim();
      const shortTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;
      const cleanContent = item.content.trim();
      const shortContent = cleanContent ? (cleanContent.length > 65 ? cleanContent.substring(0, 65) + '...' : cleanContent) : '';

      nodes.push({
        id: item.id,
        type: 'stepNode',
        position: { x: 0, y: 0 }, 
        hidden: true, 
        data: {
          label: `${item.id} - ${shortTitle}`,
          sublabel: shortContent,
          roles: determineRoles(item),
          isDimmed: false,
          isExpanded: false, 
          visibleLimit: 3,   
          details: {
            title: cleanTitle,
            description: cleanContent || `Refer to section ${item.id} documentation.`,
            action: item.children && item.children.length > 0 ? 'Expand for steps' : 'Execute Step',
            criticality: item.id.startsWith('5.') ? 'High' : 'Normal',
            owner: 'Tech Team', 
            updated: '2025-11-16', 
            documents: 'CAL-FORM-001' 
          }
        },
      });

      edges.push({
        id: `e-${parentId}-${item.id}`,
        source: parentId,
        target: item.id,
        type: 'default', 
        animated: depth === 1,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 }
      });

      if (item.children && item.children.length > 0) {
        traverse(item.children, item.id, depth + 1);
      }
    });
  };

  traverse(jsonData, 'root', 1);
  return { rawNodes: nodes, rawEdges: edges };
}

// ----------------------------------------------------------------------------
// CENTRALIZED TOP-DOWN VISIBILITY ENGINE
// ----------------------------------------------------------------------------
const applyVisibility = (nodes, edges, activeLens) => {
  let validNodeIds = new Set(nodes.map(n => n.id));
  let targetNodeIds = new Set(nodes.map(n => n.id));

  if (activeLens !== 'All') {
    targetNodeIds = new Set();
    nodes.forEach(n => {
      if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
    });

    const ancestors = new Set();
    const traceAncestors = (nodeId) => {
      const incoming = edges.filter(e => e.target === nodeId);
      incoming.forEach(edge => {
        ancestors.add(edge.source);
        traceAncestors(edge.source);
      });
    };
    targetNodeIds.forEach(id => traceAncestors(id));
    validNodeIds = new Set([...targetNodeIds, ...ancestors]);
  }

  const visibleNodeIds = new Set(['root']);
  const getChildren = (id) => edges.filter(e => e.source === id).map(e => e.target);
  
  const nextNodes = nodes.map(n => ({ ...n, data: { ...n.data } }));

  const traverse = (nodeId) => {
    if (!visibleNodeIds.has(nodeId)) return;
    
    const node = nextNodes.find(n => n.id === nodeId);
    if (!node) return;

    const isTarget = activeLens === 'All' || targetNodeIds.has(nodeId);
    node.data.isDimmed = !isTarget;

    if (!node.data.isExpanded) return;

    const validChildren = getChildren(nodeId).filter(id => validNodeIds.has(id));
    const limit = node.data.visibleLimit || 3;
    const childrenToShow = validChildren.slice(0, limit);

    childrenToShow.forEach(childId => {
      visibleNodeIds.add(childId);
      traverse(childId); 
    });

    node.data.hiddenChildrenCount = validChildren.length - childrenToShow.length;
  };

  traverse('root');

  return nextNodes.map(node => ({
    ...node,
    hidden: !visibleNodeIds.has(node.id),
    data: {
      ...node.data,
      hasChildren: getChildren(node.id).filter(id => validNodeIds.has(id)).length > 0,
    }
  }));
};

// ============================================================================
// 4. LOGIC HELPERS & SHARED UI
// ============================================================================

const ExpandCollapseButton = ({ expanded, onClick, isHorizontal }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation(); 
      onClick();
    }}
    className={cn(
      "absolute flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm z-50 border-2 border-white cursor-pointer",
      isHorizontal 
        ? "-right-3 top-1/2 -translate-y-1/2" 
        : "-bottom-3 left-1/2 -translate-x-1/2"
    )}
  >
    {expanded ? <Minus size={12} /> : <Plus size={12} />}
  </button>
);

// FULLY REDESIGNED HOVER TOOLTIP (Always on the right)
const HoverTooltip = ({ details }) => (
  <div className={cn(
    "absolute w-96 bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-5 pointer-events-none z-[100000]",
    // Aligns to the right of the node in ALL views and vertically centers it
    "left-[calc(100%+24px)] top-1/2 -translate-y-1/2",
    "animate-in fade-in zoom-in-95 duration-200 ease-out"
  )}>
    <div className="relative z-10 flex flex-col">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-[10px] flex items-center justify-center text-white mt-1 shadow-sm">
          <Info size={22} strokeWidth={2.5} />
        </div>
        
        <div className="flex flex-col pt-0.5">
          <h4 className="font-semibold text-slate-900 text-[17px] leading-tight mb-1.5">{details.title}</h4>
          <p className="text-slate-500 text-[13px] leading-relaxed line-clamp-3">{details.description}</p>
        </div>
      </div>
      
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
        {details.owner && (
          <div className="flex items-center text-[13px]">
            <span className="w-24 text-slate-500 font-medium">Owner:</span>
            <span className="text-slate-700">{details.owner}</span>
          </div>
        )}
        
        {details.updated && (
          <div className="flex items-center text-[13px]">
            <span className="w-24 text-slate-500 font-medium">Updated:</span>
            <span className="text-slate-700">{details.updated}</span>
          </div>
        )}
        
        {(details.documents || details.docId) && (
          <div className="flex items-center text-[13px]">
            <span className="w-24 text-slate-500 font-medium">Documents:</span>
            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold">
              {details.documents || details.docId}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// 5. CUSTOM NODE COMPONENTS 
// ============================================================================

const MainNode = ({ id, data }) => {
  const { direction, toggleNode, showMore } = useContext(FlowContext);
  const isHorizontal = direction === 'LR';
  const [isHovered, setIsHovered] = useState(false);

  // Z-index dynamic elevation fix
  const handleMouseEnter = (e) => {
    setIsHovered(true);
    const nodeWrapper = e.currentTarget.closest('.react-flow__node');
    if (nodeWrapper) nodeWrapper.style.zIndex = '99999';
  };

  const handleMouseLeave = (e) => {
    setIsHovered(false);
    const nodeWrapper = e.currentTarget.closest('.react-flow__node');
    if (nodeWrapper) nodeWrapper.style.zIndex = '';
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="relative transition-all duration-200 z-10"
    >
      <div className={cn(
        "w-72 p-4 rounded-xl shadow-lg transition-all duration-300 bg-blue-600 text-white border border-blue-500",
        isHovered && "ring-4 ring-blue-500/30 scale-[1.02]"
      )}>
        <Handle type="source" position={isHorizontal ? Position.Right : Position.Bottom} className="opacity-0 pointer-events-none" />
        
        {data.hasChildren && (
          <ExpandCollapseButton expanded={data.isExpanded} onClick={() => toggleNode(id)} isHorizontal={isHorizontal} />
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-blue-500/50 rounded-lg backdrop-blur-sm">
             <FileText size={20} className="text-white" />
          </div>
          <span className="bg-blue-700/50 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full text-blue-100 border border-blue-500">
            Root Document
          </span>
        </div>
        
        <div>
          <h3 className="font-bold text-lg leading-tight mb-1">{data.label}</h3>
          <p className="text-blue-100 text-sm font-medium opacity-90">{data.sublabel}</p>
        </div>

        {data.isExpanded && data.hiddenChildrenCount > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); showMore(id); }}
            className="mt-4 w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white bg-blue-500/50 hover:bg-blue-500 rounded-lg transition-colors border border-blue-400"
          >
            <Plus size={12} strokeWidth={3} />
            Show {data.hiddenChildrenCount} More
          </button>
        )}
      </div>
      
      {isHovered && <HoverTooltip details={data.details} />}
    </div>
  );
};

const StepNode = ({ id, data }) => {
  const { direction, toggleNode, showMore } = useContext(FlowContext);
  const isHorizontal = direction === 'LR';
  const [isHovered, setIsHovered] = useState(false);

  const primaryRole = data.roles && data.roles.length > 0 ? data.roles[0] : null;
  const topBorderColor = primaryRole ? roleBorderColors[primaryRole] : 'border-t-slate-300';

  // Z-index dynamic elevation fix
  const handleMouseEnter = (e) => {
    setIsHovered(true);
    const nodeWrapper = e.currentTarget.closest('.react-flow__node');
    if (nodeWrapper) nodeWrapper.style.zIndex = '99999';
  };

  const handleMouseLeave = (e) => {
    setIsHovered(false);
    const nodeWrapper = e.currentTarget.closest('.react-flow__node');
    if (nodeWrapper) nodeWrapper.style.zIndex = '';
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="relative transition-all duration-200 z-10"
    >
      <div className={cn(
        "w-72 p-4 rounded-xl shadow-sm border-x border-b border-t-4 transition-all duration-300 bg-white",
        topBorderColor,
        data.isDimmed ? "opacity-30 grayscale saturate-0 scale-95" : "opacity-100",
        isHovered && !data.isDimmed ? "ring-2 ring-blue-500/20 shadow-md scale-[1.02]" : "hover:shadow-md",
      )}>
        <Handle type="target" position={isHorizontal ? Position.Left : Position.Top} className="opacity-0" />
        <Handle type="source" position={isHorizontal ? Position.Right : Position.Bottom} className="opacity-0" />
        
        {data.hasChildren && (
          <ExpandCollapseButton expanded={data.isExpanded} onClick={() => toggleNode(id)} isHorizontal={isHorizontal} />
        )}

        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight pr-2">{data.label}</h4>
          {data.details.criticality === 'High' && (
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          )}
        </div>
        
        {data.sublabel && (
          <p className="text-slate-500 text-xs mb-3 leading-relaxed line-clamp-2">{data.sublabel}</p>
        )}

        {data.roles && data.roles.length > 0 && (
           <div className="flex flex-wrap gap-1 mb-2">
             {data.roles.map(r => (
               <span key={r} className={cn(
                 "text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium border",
                 roleColors[r] || "bg-slate-100 text-slate-600 border-slate-200"
               )}>
                 {r}
               </span>
             ))}
           </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
           <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium uppercase tracking-wide">
              <Clock size={11} />
              <span>Hover for Details</span>
           </div>
           <div className={cn(
             "h-6 w-6 rounded-full flex items-center justify-center transition-colors text-xs",
             isHovered ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
           )}>
              <span>→</span>
           </div>
        </div>

        {data.isExpanded && data.hiddenChildrenCount > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); showMore(id); }}
            className="mt-3 w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
          >
            <Plus size={12} strokeWidth={3} />
            Show {data.hiddenChildrenCount} More
          </button>
        )}
      </div>
      
      {isHovered && <HoverTooltip details={data.details} />}
    </div>
  );
};

const nodeTypes = {
  mainNode: MainNode,
  stepNode: StepNode,
};

// ============================================================================
// 6. MAIN COMPONENT (WRAPPER)
// ============================================================================

function FlowchartInstance() {
  const { rawNodes, rawEdges } = useMemo(() => generateFlowData(structureData), []);
  const [activeLens, setActiveLens] = useState('All');
  const [layoutDirection, setLayoutDirection] = useState('TB'); 

  const { nodes: initialLayoutNodes, edges: initialLayoutEdges } = useMemo(() => {
    const enriched = applyVisibility(rawNodes, rawEdges, 'All');
    return getLayoutedElements(enriched, rawEdges, 'TB');
  }, [rawNodes, rawEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayoutEdges);

  const { getEdges, fitView, setCenter } = useReactFlow();

  const handleLensChange = useCallback((role) => {
    setActiveLens(role);
    const currentEdges = getEdges();
    
    setNodes(nds => {
      const nextNodes = nds.map(n => ({
        ...n,
        data: { 
          ...n.data, 
          isExpanded: false, 
          visibleLimit: 3    
        }
      }));
      const updated = applyVisibility(nextNodes, currentEdges, role);
      const { nodes: layouted } = getLayoutedElements(updated, currentEdges, layoutDirection);
      return layouted;
    });
    
    setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
  }, [getEdges, setNodes, fitView, layoutDirection]);

  const handleDirectionChange = useCallback(() => {
    setLayoutDirection(prev => {
      const nextDir = prev === 'LR' ? 'TB' : 'LR';
      const currentEdges = getEdges();
      setNodes(nds => {
        const updated = applyVisibility(nds, currentEdges, activeLens);
        const { nodes: layouted } = getLayoutedElements(updated, currentEdges, nextDir);
        return layouted;
      });
      setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
      return nextDir;
    });
  }, [getEdges, setNodes, fitView, activeLens]);

  const toggleNode = useCallback((id) => {
    const currentEdges = getEdges();
    setNodes(nds => {
      const nextNodes = nds.map(n => {
        if (n.id === id) {
          const isExpanding = !n.data.isExpanded;
          return {
            ...n,
            data: { 
              ...n.data, 
              isExpanded: isExpanding,
              visibleLimit: isExpanding ? 3 : n.data.visibleLimit 
            }
          };
        }
        return n;
      });
      const updated = applyVisibility(nextNodes, currentEdges, activeLens);
      const { nodes: layoutedNodes } = getLayoutedElements(updated, currentEdges, layoutDirection);
      
      const targetNode = layoutedNodes.find(n => n.id === id);
      if (targetNode) {
        setTimeout(() => {
          const isExpanded = targetNode.data.isExpanded;
          
          let focusX = targetNode.position.x + 150; 
          let focusY = targetNode.position.y + 90;

          if (isExpanded) {
            if (layoutDirection === 'TB') {
              focusY += 160; 
            } else {
              focusX += 220; 
            }
          }

          setCenter(focusX, focusY, { 
            zoom: isExpanded ? 0.75 : 1,
            duration: 800 
          });
        }, 50);
      }
      
      return layoutedNodes;
    });
  }, [getEdges, setNodes, setCenter, activeLens, layoutDirection]);

  const showMore = useCallback((id) => {
    const currentEdges = getEdges();
    setNodes(nds => {
      const nextNodes = nds.map(n => {
        if (n.id === id) {
          return {
            ...n,
            data: { ...n.data, visibleLimit: (n.data.visibleLimit || 3) + 3 } 
          };
        }
        return n;
      });
      const updated = applyVisibility(nextNodes, currentEdges, activeLens);
      const { nodes: layoutedNodes } = getLayoutedElements(updated, currentEdges, layoutDirection);
      
      const targetNode = layoutedNodes.find(n => n.id === id);
      if (targetNode) {
        setTimeout(() => {
          let focusX = targetNode.position.x + 150; 
          let focusY = targetNode.position.y + 90;

          if (layoutDirection === 'TB') {
            focusY += 160; 
          } else {
            focusX += 220; 
          }

          setCenter(focusX, focusY, { 
            zoom: 0.75, 
            duration: 800 
          });
        }, 50);
      }

      return layoutedNodes;
    });
  }, [getEdges, setNodes, setCenter, activeLens, layoutDirection]);

  const handleExpandAll = useCallback(() => {
    const currentEdges = getEdges();
    setNodes(nds => {
      const nextNodes = nds.map(n => ({ 
        ...n, 
        data: { ...n.data, isExpanded: true, visibleLimit: 9999 } 
      }));
      const updated = applyVisibility(nextNodes, currentEdges, activeLens);
      const { nodes: layouted } = getLayoutedElements(updated, currentEdges, layoutDirection);
      return layouted;
    });
    setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
  }, [getEdges, setNodes, fitView, activeLens, layoutDirection]);

  const handleCollapseAll = useCallback(() => {
    const currentEdges = getEdges();
    setNodes(nds => {
      const nextNodes = nds.map(n => ({
        ...n,
        data: { ...n.data, isExpanded: false }
      }));
      const updated = applyVisibility(nextNodes, currentEdges, activeLens);
      const { nodes: layouted } = getLayoutedElements(updated, currentEdges, layoutDirection);
      return layouted;
    });
    setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
  }, [getEdges, setNodes, fitView, activeLens, layoutDirection]);

  const lensOptions = [
    'All', 'Technician - Eng', 'Executive - Eng', 'Head - Eng', 'IPQA'
  ];

  return (
    <div className="w-full h-full bg-slate-50 relative flex font-sans overflow-hidden">
      
      <FlowContext.Provider value={{ activeLens, direction: layoutDirection, toggleNode, showMore }}>
        <div className="flex-1 h-full p-6">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.1}
            maxZoom={1.5}
            attributionPosition="bottom-left"
            panOnScroll={true}
            selectionOnDrag={false}
            panOnDrag={true}
            zoomOnScroll={false}
            defaultEdgeOptions={{
              type: 'default',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
              style: { stroke: '#94a3b8', strokeWidth: 1.5 },
            }}
            className="bg-slate-50"
          >
            <Background color="#e2e8f0" gap={24} size={1} />
            <Controls 
              className="!bg-white !border-slate-200 !shadow-sm !rounded-lg !p-1 m-4" 
              showInteractive={false} 
            />
          </ReactFlow>
        </div>
      </FlowContext.Provider>

      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm pointer-events-auto flex items-center gap-2 flex-wrap w-max">
           <div className="px-2 text-slate-400 shrink-0">
             <Filter size={16} />
           </div>
           
           <div className="flex gap-1.5 flex-wrap">
             {lensOptions.map(role => (
               <button
                 key={role}
                 onClick={() => handleLensChange(role)}
                 className={cn(
                   "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", 
                   activeLens === role 
                     ? "bg-blue-600 text-white shadow-sm" 
                     : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100"
                 )}
               >
                 {role === 'All' ? 'View All Steps' : role}
               </button>
             ))}
           </div>

           <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
             <button 
               onClick={handleDirectionChange}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm mr-2"
             >
               <LayoutTemplate size={14} className={layoutDirection === 'LR' ? "rotate-90" : ""} />
               {layoutDirection === 'LR' ? 'Left to Right' : 'Top Down'}
             </button>

             <button 
               onClick={handleExpandAll}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
             >
               <ChevronsDown size={14} />
               Expand All
             </button>
             <button 
               onClick={handleCollapseAll}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
             >
               <ChevronsUp size={14} />
               Collapse All
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function SOPFlowchart({ sop, onClose }) {
  return (
    <div className="relative w-full max-w-[95vw] h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-blue-200 shadow-lg shrink-0">
            <Share2 size={20} />
          </div>
          <div>
            <h1 className="text-slate-800 font-bold text-base whitespace-nowrap">
              Process Flow: {sop?.name || 'SOP Flow Map'}
            </h1>
            <p className="text-slate-500 text-xs font-medium whitespace-nowrap">
              Top-Down / Left-Right View
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">
        <ReactFlowProvider>
          <FlowchartInstance />
        </ReactFlowProvider>
      </div>
    </div>
  );
}