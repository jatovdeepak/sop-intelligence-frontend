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
  AlertCircle,
  Plus,
  Minus,
  Filter,
  ChevronsDown,
  ChevronsUp,
  X,
  LayoutTemplate,
  Info,
  Image as ImageIcon,
  Play,
  Video,
  ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import 'reactflow/dist/style.css';

// Context to share the active filter state, layout direction, action handlers, tooltip state, and color map
export const FlowContext = createContext({ 
  activeLens: 'All', 
  direction: 'TB',
  colorMap: {},
  toggleNode: (id) => {},
  showMore: (id) => {},
  expandAllFromNode: (id) => {},
  setTooltip: () => {}
});

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Dynamic Color Palette Mapping
const COLOR_PALETTE = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', topBorder: 'border-t-blue-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', topBorder: 'border-t-purple-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', topBorder: 'border-t-amber-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', topBorder: 'border-t-emerald-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', topBorder: 'border-t-rose-500' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', topBorder: 'border-t-cyan-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', topBorder: 'border-t-indigo-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', topBorder: 'border-t-orange-500' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', topBorder: 'border-t-gray-500' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', topBorder: 'border-t-slate-300' };

// ============================================================================
// 2. DAGRE DYNAMIC AUTO-LAYOUT ENGINE
// ============================================================================

const NODE_WIDTH = 320; 
const NODE_HEIGHT = 280; 

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

function determineRoles(item, filters = []) {
  const roles = [];
  const lowerText = `${item.title || ''} ${item.content || ''}`.toLowerCase();
  const id = String(item.id);

  filters.forEach(filter => {
    // If ANY of the keywords match the ID exactly, or if the text includes it
    const hasMatch = filter.keywords.some(kw => {
      const kwLower = kw.toLowerCase().trim();
      return id === kwLower || id.startsWith(kwLower) || lowerText.includes(kwLower);
    });

    if (hasMatch) {
      roles.push(filter.label);
    }
  });

  return [...new Set(roles)];
}

function generateFlowData(jsonData, currentSop, filters = []) {
  const nodes = [];
  const edges = [];

  const traverse = (items, parentId, depth, idPrefix = '') => {
    if (!items || !Array.isArray(items)) return;

    items.forEach((item) => {
      const cleanTitle = (item.title || '').trim();
      const shortTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;
      const cleanContent = (item.content || '').trim();
      const shortContent = cleanContent ? (cleanContent.length > 65 ? cleanContent.substring(0, 65) + '...' : cleanContent) : '';

      const uniqueId = idPrefix ? `${idPrefix}-${item.id}` : item.id;
      const fallbackLabel = shortTitle ? `${item.id} - ${shortTitle}` : `Section ${item.id}`;

      nodes.push({
        id: uniqueId,
        type: 'stepNode',
        position: { x: 0, y: 0 }, 
        hidden: true, 
        data: {
          label: fallbackLabel, 
          sublabel: shortContent,
          roles: determineRoles(item, filters),
          media: item.media || [], 
          isDimmed: false,
          isExpanded: false, 
          visibleLimit: 3,   
          details: {
            title: cleanTitle || `Section ${item.id}`,
            description: cleanContent || `Refer to section ${item.id} documentation.`,
            action: item.children && item.children.length > 0 ? 'Expand for steps' : 'Execute Step',
            criticality: item.id.startsWith('5.') ? 'High' : 'Normal',
            owner: currentSop?.ownerSystem || 'Tech Team', 
            updated: currentSop?.updatedAt ? new Date(currentSop.updatedAt).toLocaleDateString() : 'N/A', 
            documents: currentSop?.sopId || 'N/A' 
          }
        },
      });

      edges.push({
        id: `e-${parentId}-${uniqueId}`,
        source: parentId,
        target: uniqueId,
        type: 'default', 
        animated: depth === 1,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 }
      });

      if (item.children && item.children.length > 0) {
        traverse(item.children, uniqueId, depth + 1, idPrefix);
      }
    });
  };

  // Process reference objects if any
  if (currentSop && currentSop.referenceObjects && Array.isArray(currentSop.referenceObjects)) {
    currentSop.referenceObjects.forEach((refObj) => {
      const refId = refObj.sopId || refObj.id; 
      
      nodes.push({
        id: refId,
        type: 'refNode',
        position: { x: 0, y: 0 },
        hidden: false,
        data: { 
          label: refId,
          name: refObj.title || refObj.name,
          department: refObj.type || refObj.department,
          version: refObj.version || 'v1.0',
          status: refObj.status,
          isExpanded: false, 
          visibleLimit: 3,
          hasChildren: jsonData && jsonData.length > 0, 
          details: {
            title: `Referenced SOP: ${refObj.title || refObj.name || refId}`,
            description: 'This is a linked procedure. Expand to view its internal steps.',
            owner: refObj.type || refObj.department || 'Cross-Functional',
            updated: refObj.updatedAt ? new Date(refObj.updatedAt).toLocaleDateString() : (refObj.updated || 'Linked dynamically')
          }
        }
      });

      edges.push({
        id: `e-ref-${refId}-root`,
        source: refId,
        target: 'root',
        type: 'default',
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' } 
      });

      if (jsonData) {
        traverse(jsonData, refId, 1, refId);
      }
    });
  }

  const rootTitle = currentSop?.title || 'Standard Operating Procedure';
  const rootId = currentSop?.sopId || 'Unknown';
  const rootUpdated = currentSop?.updatedAt ? new Date(currentSop.updatedAt).toLocaleDateString() : 'Unknown Date';

  nodes.push({
    id: 'root',
    type: 'mainNode',
    position: { x: 0, y: 0 },
    hidden: false,
    data: {
      label: rootTitle,
      sublabel: `SOP: ${rootId}`,
      isExpanded: false, 
      visibleLimit: 3,
      hasChildren: jsonData && jsonData.length > 0,
      details: {
        title: rootTitle,
        owner: currentSop?.type || currentSop?.ownerSystem || 'Cross-Functional',
        frequency: 'Various',
        updated: rootUpdated,
        docId: rootId,
        description: currentSop?.description || `Root document for ${rootTitle}`
      }
    },
  });

  if (jsonData) {
    traverse(jsonData, 'root', 1, '');
  }

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
  nodes.forEach(n => {
    if (n.type === 'refNode') visibleNodeIds.add(n.id);
  });

  const getChildren = (id) => edges.filter(e => e.source === id).map(e => e.target);
  
  const nextNodes = nodes.map(n => ({ ...n, data: { ...n.data } }));

  const traverse = (nodeId) => {
    if (!visibleNodeIds.has(nodeId)) return;
    
    const node = nextNodes.find(n => n.id === nodeId);
    if (!node) return;

    const isTarget = activeLens === 'All' || targetNodeIds.has(nodeId);
    node.data.isDimmed = node.type === 'refNode' ? false : !isTarget;

    if (!node.data.isExpanded) return;

    const validChildren = getChildren(nodeId).filter(id => validNodeIds.has(id));
    const collapsibleChildren = validChildren.filter(id => id !== 'root');

    const limit = node.data.visibleLimit || 3;
    const childrenToShow = collapsibleChildren.slice(0, limit);

    childrenToShow.forEach(childId => {
      visibleNodeIds.add(childId);
      traverse(childId); 
    });

    if (validChildren.includes('root')) visibleNodeIds.add('root');

    node.data.hiddenChildrenCount = collapsibleChildren.length - childrenToShow.length;
  };

  nodes.forEach(n => {
    if (n.type === 'refNode' || n.id === 'root') {
      traverse(n.id);
    }
  });

  return nextNodes.map(node => ({
    ...node,
    hidden: !visibleNodeIds.has(node.id),
    data: {
      ...node.data,
      hasChildren: getChildren(node.id).filter(id => id !== 'root' && validNodeIds.has(id)).length > 0,
    }
  }));
};

// ============================================================================
// 4. LOGIC HELPERS & SHARED UI
// ============================================================================

const ExpandCollapseButton = ({ expanded, onClick, onExpandAll, isHorizontal, colorClass = "bg-blue-500 hover:bg-blue-600" }) => (
  <div className={cn(
    "absolute flex items-center gap-1.5 z-50",
    isHorizontal 
      ? "-right-5 top-1/2 -translate-y-1/2 flex-col" 
      : "-bottom-4 left-1/2 -translate-x-1/2 flex-row"
  )}>
    <button 
      onClick={(e) => {
        e.stopPropagation(); 
        onClick();
      }}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full text-white transition-colors shadow-sm border-2 border-white cursor-pointer",
        colorClass
      )}
      title={expanded ? "Collapse" : "Expand Level"}
    >
      {expanded ? <Minus size={12} /> : <Plus size={12} />}
    </button>
    {onExpandAll && (
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          onExpandAll();
        }}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full text-white transition-colors shadow-sm border-2 border-white cursor-pointer",
          colorClass
        )}
        title="Expand All Under Node"
      >
        <ChevronsDown size={12} />
      </button>
    )}
  </div>
);

const HoverTooltipOverlay = ({ tooltip }) => {
  if (!tooltip.show || !tooltip.details) return null;

  const tooltipWidth = 384; 
  const xOffset = 24; 
  const yOffset = 16; 

  const isTooFarRight = typeof window !== 'undefined' && (tooltip.x + tooltipWidth + xOffset > window.innerWidth);
  const finalX = isTooFarRight ? tooltip.x - tooltipWidth - xOffset : tooltip.x + xOffset;

  return (
    <div
      className={cn(
        "fixed bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-5 pointer-events-none z-[100000]",
        "animate-in fade-in duration-75 ease-out"
      )}
      style={{
        width: `${tooltipWidth}px`,
        left: finalX,
        top: tooltip.y + yOffset,
      }}
    >
      <div className="relative z-10 flex flex-col">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-[10px] flex items-center justify-center text-white mt-1 shadow-sm">
            <Info size={22} strokeWidth={2.5} />
          </div>
          
          <div className="flex flex-col pt-0.5">
            <h4 className="font-semibold text-slate-900 text-[17px] leading-tight mb-1.5">{tooltip.details.title}</h4>
            <p className="text-slate-500 text-[13px] leading-relaxed line-clamp-3">{tooltip.details.description}</p>
          </div>
        </div>
        
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
          {tooltip.details.owner && (
            <div className="flex items-center text-[13px]">
              <span className="w-24 text-slate-500 font-medium">Owner:</span>
              <span className="text-slate-700">{tooltip.details.owner}</span>
            </div>
          )}
          
          {tooltip.details.updated && (
            <div className="flex items-center text-[13px]">
              <span className="w-24 text-slate-500 font-medium">Updated:</span>
              <span className="text-slate-700">{tooltip.details.updated}</span>
            </div>
          )}
          
          {(tooltip.details.documents || tooltip.details.docId) && (
            <div className="flex items-center text-[13px]">
              <span className="w-24 text-slate-500 font-medium">Documents:</span>
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                {tooltip.details.documents || tooltip.details.docId}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. CUSTOM NODE COMPONENTS 
// ============================================================================

const RefNode = ({ id, data }) => {
  const { direction, toggleNode, showMore, expandAllFromNode, setTooltip } = useContext(FlowContext);
  const isHorizontal = direction === 'LR';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={(e) => setTooltip({ show: true, details: data.details, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => { setIsHovered(false); setTooltip({ show: false, details: null, x: 0, y: 0 }); }}
      className="relative transition-all duration-200 z-10"
    >
      <div className={cn(
        "w-72 p-4 rounded-xl shadow-sm border-2 border-dashed border-amber-400 bg-amber-50 transition-all duration-300",
        isHovered && "ring-4 ring-amber-500/20 scale-[1.02]"
      )}>
        <Handle type="target" position={isHorizontal ? Position.Left : Position.Top} className="opacity-0" />
        <Handle type="source" position={isHorizontal ? Position.Right : Position.Bottom} className="opacity-0" />
        
        {data.hasChildren && (
          <ExpandCollapseButton 
            expanded={data.isExpanded} 
            onClick={() => toggleNode(id)} 
            onExpandAll={() => expandAllFromNode(id)}
            isHorizontal={isHorizontal} 
            colorClass="bg-amber-500 hover:bg-amber-600"
          />
        )}

        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-200/50 rounded-lg text-amber-700 mt-1">
            <Share2 size={18} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
               <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 mb-0.5">
                 Referenced SOP
               </div>
               {data.version && (
                 <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-300/50">
                   {data.version}
                 </span>
               )}
            </div>
            
            <div className="font-bold text-amber-900 text-[15px] mb-0.5">
              {data.label}
            </div>
            
            {data.name && (
              <div className="text-amber-800/90 text-[13px] font-medium leading-snug line-clamp-2">
                {data.name}
              </div>
            )}
            
            {data.department && (
              <div className="inline-block mt-2 px-2 py-0.5 bg-white/60 border border-amber-200 rounded text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                Dept: {data.department}
              </div>
            )}
          </div>
        </div>

        {data.isExpanded && data.hiddenChildrenCount > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); showMore(id); }}
            className="mt-4 w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/50 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300"
          >
            <Plus size={12} strokeWidth={3} />
            Show {data.hiddenChildrenCount} More
          </button>
        )}
      </div>
    </div>
  );
};

const MainNode = ({ id, data }) => {
  const { direction, toggleNode, showMore, expandAllFromNode, setTooltip } = useContext(FlowContext);
  const isHorizontal = direction === 'LR';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseMove={(e) => setTooltip({ show: true, details: data.details, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => { setIsHovered(false); setTooltip({ show: false, details: null, x: 0, y: 0 }); }}
      className="relative transition-all duration-200 z-10"
    >
      <div className={cn(
        "w-72 p-4 rounded-xl shadow-lg transition-all duration-300 bg-blue-600 text-white border border-blue-500",
        isHovered && "ring-4 ring-blue-500/30 scale-[1.02]"
      )}>
        <Handle type="target" position={isHorizontal ? Position.Left : Position.Top} className="opacity-0 pointer-events-none" />
        <Handle type="source" position={isHorizontal ? Position.Right : Position.Bottom} className="opacity-0 pointer-events-none" />
        
        {data.hasChildren && (
          <ExpandCollapseButton 
            expanded={data.isExpanded} 
            onClick={() => toggleNode(id)} 
            onExpandAll={() => expandAllFromNode(id)}
            isHorizontal={isHorizontal} 
          />
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
    </div>
  );
};

const StepNode = ({ id, data }) => {
  const { direction, toggleNode, showMore, expandAllFromNode, setTooltip, colorMap } = useContext(FlowContext);
  const isHorizontal = direction === 'LR';
  const [isHovered, setIsHovered] = useState(false);

  // Look up dynamic colors for tags
  const primaryRole = data.roles && data.roles.length > 0 ? data.roles[0] : null;
  const primaryColorData = primaryRole && colorMap[primaryRole] ? colorMap[primaryRole] : DEFAULT_COLOR;
  
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseMove={(e) => setTooltip({ show: true, details: data.details, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => { setIsHovered(false); setTooltip({ show: false, details: null, x: 0, y: 0 }); }}
      className="relative transition-all duration-200 z-10"
    >
      <div className={cn(
        "w-72 p-4 rounded-xl shadow-sm border-x border-b border-t-4 transition-all duration-300 bg-white",
        primaryColorData.topBorder,
        data.isDimmed ? "opacity-30 grayscale saturate-0 scale-95" : "opacity-100",
        isHovered && !data.isDimmed ? "ring-2 ring-blue-500/20 shadow-md scale-[1.02]" : "hover:shadow-md",
      )}>
        <Handle type="target" position={isHorizontal ? Position.Left : Position.Top} className="opacity-0" />
        <Handle type="source" position={isHorizontal ? Position.Right : Position.Bottom} className="opacity-0" />
        
        {data.hasChildren && (
          <ExpandCollapseButton 
            expanded={data.isExpanded} 
            onClick={() => toggleNode(id)} 
            onExpandAll={() => expandAllFromNode(id)}
            isHorizontal={isHorizontal} 
          />
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

        {/* --- SCROLLABLE MEDIA GALLERY --- */}
        {data.media && data.media.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1.5 nodrag [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-slate-100">
            {data.media.map((item, idx) => {
              if (item.type === 'image') {
                return (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" key={idx} className="relative w-36 h-24 rounded-lg border border-slate-200 overflow-hidden shrink-0 group block cursor-pointer">
                    <img 
                      src={item.url} 
                      alt={item.caption || `Image ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-slate-100" 
                    />
                    {item.caption && (
                      <div className="absolute bottom-0 w-full bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-1 truncate">
                        {item.caption}
                      </div>
                    )}
                  </a>
                );
              } 
              if (item.type === 'video') {
                const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');
                const isDrive = item.url.includes('drive.google.com');

                if (isYouTube) {
                  const ytId = item.url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/)?.[1];
                  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

                  return (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" key={idx} className="relative w-36 h-24 rounded-lg border border-slate-200 overflow-hidden shrink-0 group block bg-slate-900 cursor-pointer">
                      {thumbUrl ? (
                        <img src={thumbUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Video Thumbnail" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <Video size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="bg-red-600 text-white rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                           <Play fill="currentColor" size={14} className="ml-0.5" />
                         </div>
                      </div>
                      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white text-[9px] px-1.5 pt-4 pb-1 truncate">
                        {item.caption || 'YouTube Video'}
                      </div>
                    </a>
                  );
                } 
                if (isDrive) {
                  return (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" key={idx} className="relative w-36 h-24 rounded-lg border border-slate-200 overflow-hidden shrink-0 group block bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer flex flex-col items-center justify-center p-2 text-center">
                      <div className="bg-blue-600 text-white rounded-full p-2 shadow-sm group-hover:scale-110 transition-transform mb-1.5">
                        <ExternalLink size={14} />
                      </div>
                      <span className="text-[10px] font-bold text-blue-800">Drive Link</span>
                      {item.caption && <span className="text-[9px] text-blue-600/80 w-full truncate">{item.caption}</span>}
                    </a>
                  );
                } 
                return (
                  <div key={idx} className="relative w-36 h-24 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-black group">
                    <video 
                      src={item.url} 
                      controls 
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    {item.caption && (
                      <div className="absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent text-white text-[9px] px-1.5 py-1 pb-3 truncate z-10 pointer-events-none">
                        {item.caption}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
        {/* ---------------------------------- */}

        {data.roles && data.roles.length > 0 && (
           <div className="flex flex-wrap gap-1 mb-2">
             {data.roles.map(r => {
               const cData = colorMap[r] || DEFAULT_COLOR;
               return (
                 <span key={r} className={cn(
                   "text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium border",
                   cData.bg, cData.text, cData.border
                 )}>
                   {r}
                 </span>
               );
             })}
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
    </div>
  );
};

const nodeTypes = {
  mainNode: MainNode,
  stepNode: StepNode,
  refNode: RefNode,
};

// ============================================================================
// 6. MAIN COMPONENT (WRAPPER)
// ============================================================================

function FlowchartInstance({ sop }) {
  const filtersList = sop?.data?.filters || [];

  // Generate dynamic color map from the filters
  const colorMap = useMemo(() => {
    const map = {};
    filtersList.forEach(f => {
      map[f.label] = COLOR_PALETTE[f.color] || DEFAULT_COLOR;
    });
    return map;
  }, [filtersList]);

  // Generate node lenses derived strictly from actual filter data
  const lensOptions = useMemo(() => {
    return ['All', ...filtersList.map(f => f.label)];
  }, [filtersList]);

  const { rawNodes, rawEdges } = useMemo(() => {
    const sections = sop?.data?.sections || [];
    return generateFlowData(sections, sop, filtersList);
  }, [sop, filtersList]);
  
  const [activeLens, setActiveLens] = useState('All');
  const [layoutDirection, setLayoutDirection] = useState('TB'); 
  const [tooltip, setTooltip] = useState({ show: false, details: null, x: 0, y: 0 });

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

  const expandAllFromNode = useCallback((startNodeId) => {
    const currentEdges = getEdges();
    const descendants = new Set([startNodeId]);
    let added = true;
    
    while (added) {
      added = false;
      currentEdges.forEach(e => {
        if (descendants.has(e.source) && !descendants.has(e.target)) {
          if (e.target !== 'root') { 
            descendants.add(e.target);
            added = true;
          }
        }
      });
    }

    setNodes(nds => {
      const nextNodes = nds.map(n => {
        if (descendants.has(n.id)) {
          return { ...n, data: { ...n.data, isExpanded: true, visibleLimit: 9999 } };
        }
        return n;
      });
      const updated = applyVisibility(nextNodes, currentEdges, activeLens);
      const { nodes: layouted } = getLayoutedElements(updated, currentEdges, layoutDirection);
      return layouted;
    });
    
    setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
  }, [getEdges, setNodes, fitView, activeLens, layoutDirection]);

  const handleExpandAll = useCallback(() => {
    expandAllFromNode('root');
  }, [expandAllFromNode]);

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

  return (
    <div className="w-full h-full bg-slate-50 relative flex font-sans overflow-hidden">
      
      <FlowContext.Provider value={{ activeLens, direction: layoutDirection, colorMap, toggleNode, showMore, expandAllFromNode, setTooltip }}>
        <div className="flex-1 h-full p-6 relative">
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

          <HoverTooltipOverlay tooltip={tooltip} />
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
  const headerTitle = sop?.title || 'SOP Flow Map';

  return (
    <div className="relative w-full max-w-[95vw] h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-blue-200 shadow-lg shrink-0">
            <Share2 size={20} />
          </div>
          <div>
            <h1 className="text-slate-800 font-bold text-base whitespace-nowrap">
              Process Flow: {headerTitle}
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
          <FlowchartInstance sop={sop} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}