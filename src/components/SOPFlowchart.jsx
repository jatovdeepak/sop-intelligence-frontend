// import React, { useCallback, useState, useEffect, useMemo, createContext, useContext } from 'react';
// import ReactFlow, {
//   Background,
//   Controls,
//   Handle,
//   Position,
//   useNodesState,
//   useEdgesState,
//   MarkerType,
//   useReactFlow,
//   ReactFlowProvider,
// } from 'reactflow';
// import dagre from 'dagre';
// import { 
//   Share2, 
//   FileText, 
//   Clock, 
//   User, 
//   CheckCircle2, 
//   Calendar,
//   AlertCircle,
//   Plus,
//   Minus,
//   Filter,
//   ChevronsDown,
//   ChevronsUp
// } from 'lucide-react';
// import { clsx } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// // 1. IMPORT THE JSON STRUCTURE
// import structureData from './structure.json';
// import 'reactflow/dist/style.css';

// // Context to share the active filter state with custom nodes
// export const FlowContext = createContext({ activeLens: 'All' });

// // Helper for conditional classes
// function cn(...inputs) {
//   return twMerge(clsx(inputs));
// }

// // Role Color Mapping Configuration
// const roleColors = {
//   'Technician - Eng': 'bg-blue-50 text-blue-700 border-blue-200',
//   'Executive - Eng': 'bg-purple-50 text-purple-700 border-purple-200',
//   'Head - Eng': 'bg-amber-50 text-amber-700 border-amber-200',
//   'IPQA': 'bg-emerald-50 text-emerald-700 border-emerald-200'
// };

// const roleBorderColors = {
//   'Technician - Eng': 'border-t-blue-500',
//   'Executive - Eng': 'border-t-purple-500',
//   'Head - Eng': 'border-t-amber-500',
//   'IPQA': 'border-t-emerald-500'
// };

// // ============================================================================
// // 2. DAGRE DYNAMIC AUTO-LAYOUT ENGINE
// // ============================================================================

// const NODE_WIDTH = 300; 
// const NODE_HEIGHT = 180; 

// const getLayoutedElements = (nodes, edges, direction = 'TB') => {
//   const dagreGraph = new dagre.graphlib.Graph();
//   dagreGraph.setDefaultEdgeLabel(() => ({}));
//   dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

//   nodes.forEach((node) => {
//     if (!node.hidden) {
//       dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
//     }
//   });

//   edges.forEach((edge) => {
//     const sourceNode = nodes.find((n) => n.id === edge.source);
//     const targetNode = nodes.find((n) => n.id === edge.target);
//     if (sourceNode && !sourceNode.hidden && targetNode && !targetNode.hidden) {
//       dagreGraph.setEdge(edge.source, edge.target);
//     }
//   });

//   dagre.layout(dagreGraph);

//   const newNodes = nodes.map((node) => {
//     if (node.hidden) return node; 
//     const nodeWithPosition = dagreGraph.node(node.id);
//     return {
//       ...node,
//       targetPosition: Position.Top,     
//       sourcePosition: Position.Bottom,  
//       position: {
//         x: nodeWithPosition.x - NODE_WIDTH / 2,
//         y: nodeWithPosition.y - NODE_HEIGHT / 2,
//       },
//     };
//   });

//   return { nodes: newNodes, edges };
// };

// // ============================================================================
// // 3. DATA GENERATOR & ENRICHMENT
// // ============================================================================

// function determineRoles(item) {
//   const roles = [];
//   const lowerText = `${item.title} ${item.content}`.toLowerCase();
//   const id = String(item.id);

//   if (lowerText.includes('ipqa') || lowerText.includes('qa') || lowerText.includes('cgmp') || id === '3.4' || id === '5.5') {
//     roles.push('IPQA');
//   }
//   if (lowerText.includes('head') || lowerText.includes('designee') || id === '3.3' || id === '5.6') {
//     roles.push('Head - Eng');
//   }
//   if (lowerText.includes('executive') || lowerText.includes('train') || lowerText.includes('monitor') || lowerText.includes('superior') || id === '3.2' || id === '5.5' || id === '5.6') {
//     roles.push('Executive - Eng');
//   }
//   if (lowerText.includes('technician') || id.startsWith('5.') || id === '5.0' || id === '3.1') {
//     roles.push('Technician - Eng');
//   }
//   return [...new Set(roles)];
// }

// function generateFlowData(jsonData) {
//   const nodes = [];
//   const edges = [];

//   nodes.push({
//     id: 'root',
//     type: 'mainNode',
//     position: { x: 0, y: 0 },
//     hidden: false,
//     data: {
//       label: 'Tablet Compression PM',
//       sublabel: 'SOP: GFMN032',
//       details: {
//         title: 'Preventive Maintenance of Tablet Compression Machine',
//         owner: 'Engineering & QA',
//         frequency: 'Various',
//         updated: '16/06/2021',
//         docId: 'GFMN032-09',
//         description: 'Procedure for Preventive maintenance of Tablet Compression Machine (Make: KORSCH/KILIAN/SEJONG/FETTE). Comply with cGMP.'
//       }
//     },
//   });

//   const traverse = (items, parentId, depth) => {
//     items.forEach((item) => {
//       const cleanTitle = item.title.trim();
//       const shortTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;
//       const cleanContent = item.content.trim();
//       const shortContent = cleanContent ? (cleanContent.length > 65 ? cleanContent.substring(0, 65) + '...' : cleanContent) : '';

//       nodes.push({
//         id: item.id,
//         type: 'stepNode',
//         position: { x: 0, y: 0 }, 
//         hidden: true, // Only Root is visible initially
//         data: {
//           label: `${item.id} - ${shortTitle}`,
//           sublabel: shortContent,
//           roles: determineRoles(item),
//           isDimmed: false,
//           details: {
//             title: cleanTitle,
//             description: cleanContent || `Refer to section ${item.id} documentation.`,
//             action: item.children && item.children.length > 0 ? 'Expand for steps' : 'Execute Step',
//             criticality: item.id.startsWith('5.') ? 'High' : 'Normal',
//           }
//         },
//       });

//       edges.push({
//         id: `e-${parentId}-${item.id}`,
//         source: parentId,
//         target: item.id,
//         type: 'smoothstep',
//         animated: depth === 1,
//       });

//       if (item.children && item.children.length > 0) {
//         traverse(item.children, item.id, depth + 1);
//       }
//     });
//   };

//   traverse(jsonData, 'root', 1);
//   return { rawNodes: nodes, rawEdges: edges };
// }

// // FILTER-AWARE ENRICHMENT: Only registers a branch as expandable if it leads to the active filter
// const enrichNodeData = (nodes, edges, activeLens = 'All') => {
//   let validNodeIds = new Set(nodes.map(n => n.id)); 
  
//   if (activeLens !== 'All') {
//     const targetNodeIds = new Set();
//     nodes.forEach(n => {
//       if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//     });
    
//     const ancestors = new Set();
//     const traceAncestors = (nodeId) => {
//       const incoming = edges.filter(e => e.target === nodeId);
//       incoming.forEach(edge => {
//         ancestors.add(edge.source);
//         traceAncestors(edge.source);
//       });
//     };
//     targetNodeIds.forEach(id => traceAncestors(id));
//     validNodeIds = new Set([...targetNodeIds, ...ancestors]);
//   }

//   return nodes.map(node => {
//     const childEdges = edges.filter((edge) => edge.source === node.id);
//     const validChildIds = childEdges.map(e => e.target).filter(id => validNodeIds.has(id));
    
//     const hasChildren = validChildIds.length > 0;
//     const visibleChildren = nodes.filter((n) => validChildIds.includes(n.id) && !n.hidden);
    
//     return {
//       ...node,
//       data: {
//         ...node.data,
//         hasChildren,
//         isExpanded: visibleChildren.length > 0
//       }
//     };
//   });
// };

// // ============================================================================
// // 4. LOGIC HELPERS
// // ============================================================================

// const ExpandCollapseButton = ({ expanded, onClick }) => (
//   <button 
//     onClick={(e) => {
//       e.stopPropagation(); 
//       onClick();
//     }}
//     className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm z-50 border-2 border-white cursor-pointer"
//   >
//     {expanded ? <Minus size={12} /> : <Plus size={12} />}
//   </button>
// );

// const useNodeToggle = (id) => {
//   const { activeLens } = useContext(FlowContext); 
//   const { getEdges, getNodes, setNodes, fitView } = useReactFlow();

//   const handleToggle = useCallback(() => {
//     const edges = getEdges();
//     const nodes = getNodes();
//     const childEdges = edges.filter((edge) => edge.source === id);
//     const childNodeIds = childEdges.map((edge) => edge.target);
    
//     const isCurrentlyExpanded = nodes.some(n => childNodeIds.includes(n.id) && !n.hidden);
    
//     let updatedNodes;

//     if (isCurrentlyExpanded) {
//       // COLLAPSE (Hide all nested descendants)
//       const allDescendants = new Set();
//       const getDescendants = (nodeId) => {
//           const cEdges = edges.filter(e => e.source === nodeId);
//           cEdges.forEach(e => {
//               allDescendants.add(e.target);
//               getDescendants(e.target);
//           });
//       };
//       getDescendants(id);

//       updatedNodes = nodes.map((node) => {
//           if (allDescendants.has(node.id)) return { ...node, hidden: true };
//           return node;
//       });
//     } else {
//       // SMART EXPAND (Only expand branches relevant to the active filter)
//       let validChildIds = childNodeIds;
      
//       if (activeLens !== 'All') {
//         const targetNodeIds = new Set();
//         nodes.forEach(n => {
//           if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//         });

//         const ancestorsToUnhide = new Set();
//         const traceAncestors = (nodeId) => {
//           const incomingEdges = edges.filter(e => e.target === nodeId);
//           incomingEdges.forEach(edge => {
//             ancestorsToUnhide.add(edge.source);
//             traceAncestors(edge.source);
//           });
//         };
//         targetNodeIds.forEach(tId => traceAncestors(tId));
        
//         validChildIds = childNodeIds.filter(cId => targetNodeIds.has(cId) || ancestorsToUnhide.has(cId));
//       }

//       updatedNodes = nodes.map((node) => {
//         if (validChildIds.includes(node.id)) return { ...node, hidden: false };
//         return node;
//       });
//     }
    
//     let nextNodes = enrichNodeData(updatedNodes, edges, activeLens);
//     const { nodes: layoutedNodes } = getLayoutedElements(nextNodes, edges);
//     setNodes(layoutedNodes);
    
//     setTimeout(() => { fitView({ duration: 600, padding: 0.2, maxZoom: 1 }); }, 50);
//   }, [id, activeLens, getEdges, getNodes, setNodes, fitView]);

//   return handleToggle;
// };

// // ============================================================================
// // 5. CUSTOM NODE COMPONENTS
// // ============================================================================

// const MainNode = ({ id, data, selected }) => {
//   const handleToggle = useNodeToggle(id);

//   return (
//     <div className={cn(
//       "w-72 p-4 rounded-xl shadow-lg transition-all duration-300 bg-blue-600 text-white relative",
//       selected && "ring-4 ring-blue-500/30 scale-105"
//     )}>
//       <Handle type="source" position={Position.Bottom} className="!bg-blue-200 !w-3 !h-3 opacity-0 pointer-events-none" />
//       <ExpandCollapseButton expanded={data.isExpanded} onClick={handleToggle} />

//       <div className="flex items-start justify-between mb-3">
//         <div className="p-2 bg-blue-500/50 rounded-lg backdrop-blur-sm">
//            <FileText size={20} className="text-white" />
//         </div>
//         <span className="bg-blue-700/50 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full text-blue-100 border border-blue-500">
//           Root Document
//         </span>
//       </div>
      
//       <div>
//         <h3 className="font-bold text-lg leading-tight mb-1">{data.label}</h3>
//         <p className="text-blue-100 text-sm font-medium opacity-90">{data.sublabel}</p>
        
//         <div className="mt-4 flex items-center gap-3 text-blue-200 text-xs border-t border-blue-500/50 pt-3">
//            <div className="flex items-center gap-1">
//              <User size={12} />
//              <span>{data.details.owner}</span>
//            </div>
//            <div className="flex items-center gap-1">
//              <Calendar size={12} />
//              <span>{data.details.updated}</span>
//            </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const StepNode = ({ id, data, selected }) => {
//   const handleToggle = useNodeToggle(id);
//   const primaryRole = data.roles && data.roles.length > 0 ? data.roles[0] : null;
//   const topBorderColor = primaryRole ? roleBorderColors[primaryRole] : 'border-t-slate-300';

//   return (
//     <div className={cn(
//       "w-72 p-4 rounded-xl shadow-sm border-x border-b border-t-4 transition-all duration-300 relative bg-white",
//       topBorderColor,
//       data.isDimmed ? "opacity-30 grayscale saturate-0 scale-95" : "opacity-100",
//       selected && !data.isDimmed ? "ring-2 ring-blue-500/20 shadow-md scale-[1.02]" : "hover:shadow-md",
//     )}>
//       <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-2 !h-2 opacity-0" />
//       <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-2 !h-2 opacity-0" />
      
//       {/* We removed the !data.isDimmed check here, so grey nodes CAN be manually expanded! */}
//       {data.hasChildren && (
//         <ExpandCollapseButton expanded={data.isExpanded} onClick={handleToggle} />
//       )}

//       <div className="flex justify-between items-start mb-2">
//         <h4 className="font-semibold text-slate-800 text-sm leading-tight pr-2">{data.label}</h4>
//         {data.details.criticality === 'High' && (
//           <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
//         )}
//       </div>
      
//       {data.sublabel && (
//         <p className="text-slate-500 text-xs mb-3 leading-relaxed line-clamp-2">{data.sublabel}</p>
//       )}

//       {data.roles && data.roles.length > 0 && (
//          <div className="flex flex-wrap gap-1 mb-2">
//            {data.roles.map(r => (
//              <span key={r} className={cn(
//                "text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium border",
//                roleColors[r] || "bg-slate-100 text-slate-600 border-slate-200"
//              )}>
//                {r}
//              </span>
//            ))}
//          </div>
//       )}

//       <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
//          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium uppercase tracking-wide">
//             <Clock size={11} />
//             <span>Step Details</span>
//          </div>
//          <div className={cn(
//            "h-6 w-6 rounded-full flex items-center justify-center transition-colors text-xs",
//            selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
//          )}>
//             <span>→</span>
//          </div>
//       </div>
//     </div>
//   );
// };

// const nodeTypes = {
//   mainNode: MainNode,
//   stepNode: StepNode,
// };

// // ============================================================================
// // 6. MAIN COMPONENT (WRAPPER)
// // ============================================================================

// function FlowchartInstance() {
//   const { rawNodes, rawEdges } = useMemo(() => generateFlowData(structureData), []);
  
//   const { nodes: initialLayoutNodes, edges: initialLayoutEdges } = useMemo(() => {
//     const enriched = enrichNodeData(rawNodes, rawEdges, 'All');
//     return getLayoutedElements(enriched, rawEdges);
//   }, [rawNodes, rawEdges]);

//   const [nodes, setNodes, onNodesChange] = useNodesState(initialLayoutNodes);
//   const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayoutEdges);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [activeLens, setActiveLens] = useState('All');

//   const { getEdges, fitView } = useReactFlow();

//   // Filter Update Logic: Evaluates Dimming AND Collapses to Root
//   useEffect(() => {
//     const currentEdges = getEdges();
//     setNodes((currentNodes) => {
//       let nextNodes = [...currentNodes];

//       const targetNodeIds = new Set();
//       if (activeLens !== 'All') {
//         nextNodes.forEach(n => {
//           if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//         });
//       }

//       nextNodes = nextNodes.map(node => {
//         const isTarget = activeLens === 'All' || targetNodeIds.has(node.id);
        
//         if (node.id === 'root') {
//           return { ...node, hidden: false, data: { ...node.data, isDimmed: !isTarget } };
//         }

//         return { 
//           ...node, 
//           hidden: true, 
//           data: { ...node.data, isDimmed: !isTarget } 
//         };
//       });

//       nextNodes = enrichNodeData(nextNodes, currentEdges, activeLens);
//       const { nodes: layoutedNodes } = getLayoutedElements(nextNodes, currentEdges);
//       return layoutedNodes;
//     });
    
//     setTimeout(() => { fitView({ duration: 600, padding: 0.2, maxZoom: 1 }); }, 50);
//   }, [activeLens, getEdges, setNodes, fitView]);

//   const onNodeClick = useCallback((event, node) => {
//     setSelectedNode(node);
//   }, []);

//   const closePanel = () => setSelectedNode(null);

//   const handleExpandAll = useCallback(() => {
//     const currentEdges = getEdges();
//     setNodes(nds => {
//       let nextNodes;
      
//       if (activeLens === 'All') {
//         nextNodes = nds.map(n => ({ ...n, hidden: false }));
//       } else {
//         const targetNodeIds = new Set();
//         nds.forEach(n => {
//           if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//         });

//         const ancestorsToUnhide = new Set();
//         const traceAncestors = (nodeId) => {
//           const incomingEdges = currentEdges.filter(e => e.target === nodeId);
//           incomingEdges.forEach(edge => {
//             ancestorsToUnhide.add(edge.source);
//             traceAncestors(edge.source);
//           });
//         };
//         targetNodeIds.forEach(id => traceAncestors(id));

//         nextNodes = nds.map(n => {
//           if (n.id === 'root') return { ...n, hidden: false };
//           const isVisible = targetNodeIds.has(n.id) || ancestorsToUnhide.has(n.id);
//           return { ...n, hidden: !isVisible };
//         });
//       }

//       const enriched = enrichNodeData(nextNodes, currentEdges, activeLens);
//       const { nodes: layouted } = getLayoutedElements(enriched, currentEdges);
//       return layouted;
//     });
//     setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
//   }, [getEdges, setNodes, fitView, activeLens]);

//   const handleCollapseAll = useCallback(() => {
//     const currentEdges = getEdges();
//     setNodes(nds => {
//       const nextNodes = nds.map(n => ({
//         ...n,
//         hidden: n.id !== 'root' 
//       }));
//       const enriched = enrichNodeData(nextNodes, currentEdges, activeLens);
//       const { nodes: layouted } = getLayoutedElements(enriched, currentEdges);
//       return layouted;
//     });
//     setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
//   }, [getEdges, setNodes, fitView, activeLens]);

//   const lensOptions = [
//     'All', 
//     'Technician - Eng', 
//     'Executive - Eng', 
//     'Head - Eng', 
//     'IPQA'
//   ];

//   return (
//     <div className="w-full h-screen bg-slate-50 relative flex font-sans overflow-hidden">
      
//       <FlowContext.Provider value={{ activeLens }}>
//         <div className="flex-1 h-full">
//           <ReactFlow
//             nodes={nodes}
//             edges={edges}
//             onNodesChange={onNodesChange}
//             onEdgesChange={onEdgesChange}
//             onNodeClick={onNodeClick}
//             nodeTypes={nodeTypes}
//             fitView
//             fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
//             minZoom={0.1}
//             maxZoom={1.5}
//             attributionPosition="bottom-left"
//             panOnScroll={true}
//             selectionOnDrag={false}
//             panOnDrag={true}
//             zoomOnScroll={false}
//             defaultEdgeOptions={{
//               type: 'smoothstep',
//               markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
//               style: { stroke: '#94a3b8', strokeWidth: 1.5 },
//             }}
//             className="bg-slate-50"
//           >
//             <Background color="#e2e8f0" gap={24} size={1} />
//             <Controls 
//               className="!bg-white !border-slate-200 !shadow-sm !rounded-lg !p-1 m-4" 
//               showInteractive={false} 
//             />
//           </ReactFlow>
//         </div>
//       </FlowContext.Provider>

// {/* 1. HEADER OVERLAY (TOP LEFT) */}
// <div className="absolute top-6 left-6 z-10 pointer-events-none">
//         <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md p-2 pr-6 rounded-2xl border border-slate-200 shadow-sm pointer-events-auto w-max">
//           <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-blue-200 shadow-lg">
//             <Share2 size={20} />
//           </div>
//           <div>
//             <h1 className="text-slate-800 font-bold text-base">SOP Flow Map</h1>
//             <p className="text-slate-500 text-xs font-medium">Top-Down • Smart Filtering</p>
//           </div>
//         </div>
//       </div>

//       {/* 2. FILTER & CONTROLS OVERLAY (TOP MIDDLE) */}
//       <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
//         <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm pointer-events-auto flex items-center gap-2 flex-wrap w-max">
//            <div className="px-2 text-slate-400 shrink-0">
//              <Filter size={16} />
//            </div>
//            <div className="flex gap-1.5 flex-wrap">
//              {lensOptions.map(role => (
//                <button
//                  key={role}
//                  onClick={() => setActiveLens(role)}
//                  className={cn(
//                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", 
//                    activeLens === role 
//                      ? "bg-blue-600 text-white shadow-sm" 
//                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100"
//                  )}
//                >
//                  {role === 'All' ? 'View All Steps' : role}
//                </button>
//              ))}
//            </div>

//            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
//               <button 
//                 onClick={handleExpandAll}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
//               >
//                 <ChevronsDown size={14} />
//                 Expand All
//               </button>
//               <button 
//                 onClick={handleCollapseAll}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
//               >
//                 <ChevronsUp size={14} />
//                 Collapse All
//               </button>
//            </div>
//         </div>
//       </div>

//       {selectedNode && (
//         <div className="absolute top-6 right-6 bottom-6 z-20 w-[400px] flex flex-col pointer-events-none">
//           <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-300 pointer-events-auto max-h-full">
            
//             <div className="p-6 border-b border-slate-50 bg-slate-50/50">
//                <div className="flex items-start gap-4">
//                   <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
//                      <CheckCircle2 size={24} />
//                   </div>
//                   <div>
//                     <h2 className="font-bold text-slate-800 text-lg leading-snug">
//                       {selectedNode.data.details.title || selectedNode.data.label}
//                     </h2>
//                     {selectedNode.data.details.owner && (
//                         <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                           {selectedNode.data.details.owner}
//                         </span>
//                     )}
//                   </div>
//                </div>
//             </div>

//             <div className="p-6 overflow-y-auto flex-1 space-y-6">
//                <div>
//                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
//                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
//                     {selectedNode.data.details.description}
//                  </p>
//                </div>

//                {(selectedNode.data.details.frequency || selectedNode.data.details.docId) && (
//                  <div className="grid grid-cols-2 gap-4">
//                    {selectedNode.data.details.frequency && (
//                      <div className="p-3 rounded-lg border border-slate-100 bg-white">
//                         <span className="text-xs text-slate-400 block mb-1">Frequency</span>
//                         <span className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
//                           <Calendar size={14} />
//                           {selectedNode.data.details.frequency}
//                         </span>
//                      </div>
//                    )}
//                    {selectedNode.data.details.docId && (
//                      <div className="p-3 rounded-lg border border-slate-100 bg-white">
//                         <span className="text-xs text-slate-400 block mb-1">Doc ID</span>
//                         <span className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
//                           <FileText size={14} />
//                           {selectedNode.data.details.docId}
//                         </span>
//                      </div>
//                    )}
//                  </div>
//                )}

//                {(selectedNode.data.details.action || selectedNode.data.details.notes) && (
//                  <div>
//                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</h3>
//                    <ul className="space-y-3">
//                       {selectedNode.data.details.action && (
//                         <li className="flex items-start gap-3 text-sm text-slate-600">
//                           <div className="min-w-[6px] h-[6px] mt-2 rounded-full bg-blue-400" />
//                           <span>Action: <strong className="text-slate-800">{selectedNode.data.details.action}</strong></span>
//                         </li>
//                       )}
//                       {selectedNode.data.details.notes && (
//                         <li className="flex items-start gap-3 text-sm text-slate-600">
//                           <div className="min-w-[6px] h-[6px] mt-2 rounded-full bg-amber-400" />
//                           <span>Note: {selectedNode.data.details.notes}</span>
//                         </li>
//                       )}
//                    </ul>
//                  </div>
//                )}
//             </div>
            
//             <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
//               <button 
//                 onClick={closePanel}
//                 className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-500 text-sm font-semibold rounded-xl transition-all shadow-sm"
//               >
//                 Close Details
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function SOPFlowchart() {
//   return (
//     <ReactFlowProvider>
//       <FlowchartInstance />
//     </ReactFlowProvider>
//   );
// }











// import React, { useCallback, useState, useEffect, useMemo, createContext, useContext } from 'react';
// import ReactFlow, {
//   Background,
//   Controls,
//   Handle,
//   Position,
//   useNodesState,
//   useEdgesState,
//   MarkerType,
//   useReactFlow,
//   ReactFlowProvider,
// } from 'reactflow';
// import dagre from 'dagre';
// import { 
//   Share2, 
//   FileText, 
//   Clock, 
//   User, 
//   CheckCircle2, 
//   Calendar,
//   AlertCircle,
//   Plus,
//   Minus,
//   Filter,
//   ChevronsDown,
//   ChevronsUp,
//   X // <-- Added X icon for the close button
// } from 'lucide-react';
// import { clsx } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// // 1. IMPORT THE JSON STRUCTURE
// import structureData from './structure.json';
// import 'reactflow/dist/style.css';

// // Context to share the active filter state with custom nodes
// export const FlowContext = createContext({ activeLens: 'All' });

// // Helper for conditional classes
// function cn(...inputs) {
//   return twMerge(clsx(inputs));
// }

// // Role Color Mapping Configuration
// const roleColors = {
//   'Technician - Eng': 'bg-blue-50 text-blue-700 border-blue-200',
//   'Executive - Eng': 'bg-purple-50 text-purple-700 border-purple-200',
//   'Head - Eng': 'bg-amber-50 text-amber-700 border-amber-200',
//   'IPQA': 'bg-emerald-50 text-emerald-700 border-emerald-200'
// };

// const roleBorderColors = {
//   'Technician - Eng': 'border-t-blue-500',
//   'Executive - Eng': 'border-t-purple-500',
//   'Head - Eng': 'border-t-amber-500',
//   'IPQA': 'border-t-emerald-500'
// };

// // ============================================================================
// // 2. DAGRE DYNAMIC AUTO-LAYOUT ENGINE
// // ============================================================================

// const NODE_WIDTH = 300; 
// const NODE_HEIGHT = 180; 

// const getLayoutedElements = (nodes, edges, direction = 'TB') => {
//   const dagreGraph = new dagre.graphlib.Graph();
//   dagreGraph.setDefaultEdgeLabel(() => ({}));
//   dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

//   nodes.forEach((node) => {
//     if (!node.hidden) {
//       dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
//     }
//   });

//   edges.forEach((edge) => {
//     const sourceNode = nodes.find((n) => n.id === edge.source);
//     const targetNode = nodes.find((n) => n.id === edge.target);
//     if (sourceNode && !sourceNode.hidden && targetNode && !targetNode.hidden) {
//       dagreGraph.setEdge(edge.source, edge.target);
//     }
//   });

//   dagre.layout(dagreGraph);

//   const newNodes = nodes.map((node) => {
//     if (node.hidden) return node; 
//     const nodeWithPosition = dagreGraph.node(node.id);
//     return {
//       ...node,
//       targetPosition: Position.Top,     
//       sourcePosition: Position.Bottom,  
//       position: {
//         x: nodeWithPosition.x - NODE_WIDTH / 2,
//         y: nodeWithPosition.y - NODE_HEIGHT / 2,
//       },
//     };
//   });

//   return { nodes: newNodes, edges };
// };

// // ============================================================================
// // 3. DATA GENERATOR & ENRICHMENT
// // ============================================================================

// function determineRoles(item) {
//   const roles = [];
//   const lowerText = `${item.title} ${item.content}`.toLowerCase();
//   const id = String(item.id);

//   if (lowerText.includes('ipqa') || lowerText.includes('qa') || lowerText.includes('cgmp') || id === '3.4' || id === '5.5') {
//     roles.push('IPQA');
//   }
//   if (lowerText.includes('head') || lowerText.includes('designee') || id === '3.3' || id === '5.6') {
//     roles.push('Head - Eng');
//   }
//   if (lowerText.includes('executive') || lowerText.includes('train') || lowerText.includes('monitor') || lowerText.includes('superior') || id === '3.2' || id === '5.5' || id === '5.6') {
//     roles.push('Executive - Eng');
//   }
//   if (lowerText.includes('technician') || id.startsWith('5.') || id === '5.0' || id === '3.1') {
//     roles.push('Technician - Eng');
//   }
//   return [...new Set(roles)];
// }

// function generateFlowData(jsonData) {
//   const nodes = [];
//   const edges = [];

//   nodes.push({
//     id: 'root',
//     type: 'mainNode',
//     position: { x: 0, y: 0 },
//     hidden: false,
//     data: {
//       label: 'Tablet Compression PM',
//       sublabel: 'SOP: GFMN032',
//       details: {
//         title: 'Preventive Maintenance of Tablet Compression Machine',
//         owner: 'Engineering & QA',
//         frequency: 'Various',
//         updated: '16/06/2021',
//         docId: 'GFMN032-09',
//         description: 'Procedure for Preventive maintenance of Tablet Compression Machine (Make: KORSCH/KILIAN/SEJONG/FETTE). Comply with cGMP.'
//       }
//     },
//   });

//   const traverse = (items, parentId, depth) => {
//     items.forEach((item) => {
//       const cleanTitle = item.title.trim();
//       const shortTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;
//       const cleanContent = item.content.trim();
//       const shortContent = cleanContent ? (cleanContent.length > 65 ? cleanContent.substring(0, 65) + '...' : cleanContent) : '';

//       nodes.push({
//         id: item.id,
//         type: 'stepNode',
//         position: { x: 0, y: 0 }, 
//         hidden: true, 
//         data: {
//           label: `${item.id} - ${shortTitle}`,
//           sublabel: shortContent,
//           roles: determineRoles(item),
//           isDimmed: false,
//           details: {
//             title: cleanTitle,
//             description: cleanContent || `Refer to section ${item.id} documentation.`,
//             action: item.children && item.children.length > 0 ? 'Expand for steps' : 'Execute Step',
//             criticality: item.id.startsWith('5.') ? 'High' : 'Normal',
//           }
//         },
//       });

//       edges.push({
//         id: `e-${parentId}-${item.id}`,
//         source: parentId,
//         target: item.id,
//         type: 'smoothstep',
//         animated: depth === 1,
//       });

//       if (item.children && item.children.length > 0) {
//         traverse(item.children, item.id, depth + 1);
//       }
//     });
//   };

//   traverse(jsonData, 'root', 1);
//   return { rawNodes: nodes, rawEdges: edges };
// }

// const enrichNodeData = (nodes, edges, activeLens = 'All') => {
//   let validNodeIds = new Set(nodes.map(n => n.id)); 
  
//   if (activeLens !== 'All') {
//     const targetNodeIds = new Set();
//     nodes.forEach(n => {
//       if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//     });
    
//     const ancestors = new Set();
//     const traceAncestors = (nodeId) => {
//       const incoming = edges.filter(e => e.target === nodeId);
//       incoming.forEach(edge => {
//         ancestors.add(edge.source);
//         traceAncestors(edge.source);
//       });
//     };
//     targetNodeIds.forEach(id => traceAncestors(id));
//     validNodeIds = new Set([...targetNodeIds, ...ancestors]);
//   }

//   return nodes.map(node => {
//     const childEdges = edges.filter((edge) => edge.source === node.id);
//     const validChildIds = childEdges.map(e => e.target).filter(id => validNodeIds.has(id));
    
//     const hasChildren = validChildIds.length > 0;
//     const visibleChildren = nodes.filter((n) => validChildIds.includes(n.id) && !n.hidden);
    
//     return {
//       ...node,
//       data: {
//         ...node.data,
//         hasChildren,
//         isExpanded: visibleChildren.length > 0
//       }
//     };
//   });
// };

// // ============================================================================
// // 4. LOGIC HELPERS
// // ============================================================================

// const ExpandCollapseButton = ({ expanded, onClick }) => (
//   <button 
//     onClick={(e) => {
//       e.stopPropagation(); 
//       onClick();
//     }}
//     className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm z-50 border-2 border-white cursor-pointer"
//   >
//     {expanded ? <Minus size={12} /> : <Plus size={12} />}
//   </button>
// );

// const useNodeToggle = (id) => {
//   const { activeLens } = useContext(FlowContext); 
//   const { getEdges, getNodes, setNodes, fitView } = useReactFlow();

//   const handleToggle = useCallback(() => {
//     const edges = getEdges();
//     const nodes = getNodes();
//     const childEdges = edges.filter((edge) => edge.source === id);
//     const childNodeIds = childEdges.map((edge) => edge.target);
    
//     const isCurrentlyExpanded = nodes.some(n => childNodeIds.includes(n.id) && !n.hidden);
    
//     let updatedNodes;

//     if (isCurrentlyExpanded) {
//       const allDescendants = new Set();
//       const getDescendants = (nodeId) => {
//           const cEdges = edges.filter(e => e.source === nodeId);
//           cEdges.forEach(e => {
//               allDescendants.add(e.target);
//               getDescendants(e.target);
//           });
//       };
//       getDescendants(id);

//       updatedNodes = nodes.map((node) => {
//           if (allDescendants.has(node.id)) return { ...node, hidden: true };
//           return node;
//       });
//     } else {
//       let validChildIds = childNodeIds;
      
//       if (activeLens !== 'All') {
//         const targetNodeIds = new Set();
//         nodes.forEach(n => {
//           if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//         });

//         const ancestorsToUnhide = new Set();
//         const traceAncestors = (nodeId) => {
//           const incomingEdges = edges.filter(e => e.target === nodeId);
//           incomingEdges.forEach(edge => {
//             ancestorsToUnhide.add(edge.source);
//             traceAncestors(edge.source);
//           });
//         };
//         targetNodeIds.forEach(tId => traceAncestors(tId));
        
//         validChildIds = childNodeIds.filter(cId => targetNodeIds.has(cId) || ancestorsToUnhide.has(cId));
//       }

//       updatedNodes = nodes.map((node) => {
//         if (validChildIds.includes(node.id)) return { ...node, hidden: false };
//         return node;
//       });
//     }
    
//     let nextNodes = enrichNodeData(updatedNodes, edges, activeLens);
//     const { nodes: layoutedNodes } = getLayoutedElements(nextNodes, edges);
//     setNodes(layoutedNodes);
    
//     setTimeout(() => { fitView({ duration: 600, padding: 0.2, maxZoom: 1 }); }, 50);
//   }, [id, activeLens, getEdges, getNodes, setNodes, fitView]);

//   return handleToggle;
// };

// // ============================================================================
// // 5. CUSTOM NODE COMPONENTS
// // ============================================================================

// const MainNode = ({ id, data, selected }) => {
//   const handleToggle = useNodeToggle(id);

//   return (
//     <div className={cn(
//       "w-72 p-4 rounded-xl shadow-lg transition-all duration-300 bg-blue-600 text-white relative",
//       selected && "ring-4 ring-blue-500/30 scale-105"
//     )}>
//       <Handle type="source" position={Position.Bottom} className="!bg-blue-200 !w-3 !h-3 opacity-0 pointer-events-none" />
//       <ExpandCollapseButton expanded={data.isExpanded} onClick={handleToggle} />

//       <div className="flex items-start justify-between mb-3">
//         <div className="p-2 bg-blue-500/50 rounded-lg backdrop-blur-sm">
//            <FileText size={20} className="text-white" />
//         </div>
//         <span className="bg-blue-700/50 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full text-blue-100 border border-blue-500">
//           Root Document
//         </span>
//       </div>
      
//       <div>
//         <h3 className="font-bold text-lg leading-tight mb-1">{data.label}</h3>
//         <p className="text-blue-100 text-sm font-medium opacity-90">{data.sublabel}</p>
        
//         <div className="mt-4 flex items-center gap-3 text-blue-200 text-xs border-t border-blue-500/50 pt-3">
//            <div className="flex items-center gap-1">
//              <User size={12} />
//              <span>{data.details.owner}</span>
//            </div>
//            <div className="flex items-center gap-1">
//              <Calendar size={12} />
//              <span>{data.details.updated}</span>
//            </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const StepNode = ({ id, data, selected }) => {
//   const handleToggle = useNodeToggle(id);
//   const primaryRole = data.roles && data.roles.length > 0 ? data.roles[0] : null;
//   const topBorderColor = primaryRole ? roleBorderColors[primaryRole] : 'border-t-slate-300';

//   return (
//     <div className={cn(
//       "w-72 p-4 rounded-xl shadow-sm border-x border-b border-t-4 transition-all duration-300 relative bg-white",
//       topBorderColor,
//       data.isDimmed ? "opacity-30 grayscale saturate-0 scale-95" : "opacity-100",
//       selected && !data.isDimmed ? "ring-2 ring-blue-500/20 shadow-md scale-[1.02]" : "hover:shadow-md",
//     )}>
//       <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-2 !h-2 opacity-0" />
//       <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-2 !h-2 opacity-0" />
      
//       {data.hasChildren && (
//         <ExpandCollapseButton expanded={data.isExpanded} onClick={handleToggle} />
//       )}

//       <div className="flex justify-between items-start mb-2">
//         <h4 className="font-semibold text-slate-800 text-sm leading-tight pr-2">{data.label}</h4>
//         {data.details.criticality === 'High' && (
//           <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
//         )}
//       </div>
      
//       {data.sublabel && (
//         <p className="text-slate-500 text-xs mb-3 leading-relaxed line-clamp-2">{data.sublabel}</p>
//       )}

//       {data.roles && data.roles.length > 0 && (
//          <div className="flex flex-wrap gap-1 mb-2">
//            {data.roles.map(r => (
//              <span key={r} className={cn(
//                "text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium border",
//                roleColors[r] || "bg-slate-100 text-slate-600 border-slate-200"
//              )}>
//                {r}
//              </span>
//            ))}
//          </div>
//       )}

//       <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
//          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium uppercase tracking-wide">
//             <Clock size={11} />
//             <span>Step Details</span>
//          </div>
//          <div className={cn(
//            "h-6 w-6 rounded-full flex items-center justify-center transition-colors text-xs",
//            selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
//          )}>
//             <span>→</span>
//          </div>
//       </div>
//     </div>
//   );
// };

// const nodeTypes = {
//   mainNode: MainNode,
//   stepNode: StepNode,
// };

// // ============================================================================
// // 6. MAIN COMPONENT (WRAPPER)
// // ============================================================================

// function FlowchartInstance() {
//   const { rawNodes, rawEdges } = useMemo(() => generateFlowData(structureData), []);
  
//   const { nodes: initialLayoutNodes, edges: initialLayoutEdges } = useMemo(() => {
//     const enriched = enrichNodeData(rawNodes, rawEdges, 'All');
//     return getLayoutedElements(enriched, rawEdges);
//   }, [rawNodes, rawEdges]);

//   const [nodes, setNodes, onNodesChange] = useNodesState(initialLayoutNodes);
//   const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayoutEdges);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [activeLens, setActiveLens] = useState('All');

//   const { getEdges, fitView } = useReactFlow();

//   useEffect(() => {
//     const currentEdges = getEdges();
//     setNodes((currentNodes) => {
//       let nextNodes = [...currentNodes];

//       const targetNodeIds = new Set();
//       if (activeLens !== 'All') {
//         nextNodes.forEach(n => {
//           if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//         });
//       }

//       nextNodes = nextNodes.map(node => {
//         const isTarget = activeLens === 'All' || targetNodeIds.has(node.id);
        
//         if (node.id === 'root') {
//           return { ...node, hidden: false, data: { ...node.data, isDimmed: !isTarget } };
//         }

//         return { 
//           ...node, 
//           hidden: true, 
//           data: { ...node.data, isDimmed: !isTarget } 
//         };
//       });

//       nextNodes = enrichNodeData(nextNodes, currentEdges, activeLens);
//       const { nodes: layoutedNodes } = getLayoutedElements(nextNodes, currentEdges);
//       return layoutedNodes;
//     });
    
//     setTimeout(() => { fitView({ duration: 600, padding: 0.2, maxZoom: 1 }); }, 50);
//   }, [activeLens, getEdges, setNodes, fitView]);

//   const onNodeClick = useCallback((event, node) => {
//     setSelectedNode(node);
//   }, []);

//   const closePanel = () => setSelectedNode(null);

//   const handleExpandAll = useCallback(() => {
//     const currentEdges = getEdges();
//     setNodes(nds => {
//       let nextNodes;
      
//       if (activeLens === 'All') {
//         nextNodes = nds.map(n => ({ ...n, hidden: false }));
//       } else {
//         const targetNodeIds = new Set();
//         nds.forEach(n => {
//           if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
//         });

//         const ancestorsToUnhide = new Set();
//         const traceAncestors = (nodeId) => {
//           const incomingEdges = currentEdges.filter(e => e.target === nodeId);
//           incomingEdges.forEach(edge => {
//             ancestorsToUnhide.add(edge.source);
//             traceAncestors(edge.source);
//           });
//         };
//         targetNodeIds.forEach(id => traceAncestors(id));

//         nextNodes = nds.map(n => {
//           if (n.id === 'root') return { ...n, hidden: false };
//           const isVisible = targetNodeIds.has(n.id) || ancestorsToUnhide.has(n.id);
//           return { ...n, hidden: !isVisible };
//         });
//       }

//       const enriched = enrichNodeData(nextNodes, currentEdges, activeLens);
//       const { nodes: layouted } = getLayoutedElements(enriched, currentEdges);
//       return layouted;
//     });
//     setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
//   }, [getEdges, setNodes, fitView, activeLens]);

//   const handleCollapseAll = useCallback(() => {
//     const currentEdges = getEdges();
//     setNodes(nds => {
//       const nextNodes = nds.map(n => ({
//         ...n,
//         hidden: n.id !== 'root' 
//       }));
//       const enriched = enrichNodeData(nextNodes, currentEdges, activeLens);
//       const { nodes: layouted } = getLayoutedElements(enriched, currentEdges);
//       return layouted;
//     });
//     setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
//   }, [getEdges, setNodes, fitView, activeLens]);

//   const lensOptions = [
//     'All', 
//     'Technician - Eng', 
//     'Executive - Eng', 
//     'Head - Eng', 
//     'IPQA'
//   ];

//   return (
//     // Changed h-screen to h-full so it fits cleanly inside the modal container
//     <div className="w-full h-full bg-slate-50 relative flex font-sans overflow-hidden">
      
//       <FlowContext.Provider value={{ activeLens }}>
//         <div className="flex-1 h-full">
//           <ReactFlow
//             nodes={nodes}
//             edges={edges}
//             onNodesChange={onNodesChange}
//             onEdgesChange={onEdgesChange}
//             onNodeClick={onNodeClick}
//             nodeTypes={nodeTypes}
//             fitView
//             fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
//             minZoom={0.1}
//             maxZoom={1.5}
//             attributionPosition="bottom-left"
//             panOnScroll={true}
//             selectionOnDrag={false}
//             panOnDrag={true}
//             zoomOnScroll={false}
//             defaultEdgeOptions={{
//               type: 'smoothstep',
//               markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
//               style: { stroke: '#94a3b8', strokeWidth: 1.5 },
//             }}
//             className="bg-slate-50"
//           >
//             <Background color="#e2e8f0" gap={24} size={1} />
//             <Controls 
//               className="!bg-white !border-slate-200 !shadow-sm !rounded-lg !p-1 m-4" 
//               showInteractive={false} 
//             />
//           </ReactFlow>
//         </div>
//       </FlowContext.Provider>

//       {/* HEADER OVERLAY (TOP LEFT) */}
//       <div className="absolute top-6 left-6 z-10 pointer-events-none">
//         <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md p-2 pr-6 rounded-2xl border border-slate-200 shadow-sm pointer-events-auto w-max">
//           <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-blue-200 shadow-lg">
//             <Share2 size={20} />
//           </div>
//           <div>
//             <h1 className="text-slate-800 font-bold text-base">SOP Flow Map</h1>
//             <p className="text-slate-500 text-xs font-medium">Top-Down • Smart Filtering</p>
//           </div>
//         </div>
//       </div>

//       {/* FILTER & CONTROLS OVERLAY (TOP MIDDLE) */}
//       <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
//         <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm pointer-events-auto flex items-center gap-2 flex-wrap w-max">
//            <div className="px-2 text-slate-400 shrink-0">
//              <Filter size={16} />
//            </div>
//            <div className="flex gap-1.5 flex-wrap">
//              {lensOptions.map(role => (
//                <button
//                  key={role}
//                  onClick={() => setActiveLens(role)}
//                  className={cn(
//                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", 
//                    activeLens === role 
//                      ? "bg-blue-600 text-white shadow-sm" 
//                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100"
//                  )}
//                >
//                  {role === 'All' ? 'View All Steps' : role}
//                </button>
//              ))}
//            </div>

//            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
//               <button 
//                 onClick={handleExpandAll}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
//               >
//                 <ChevronsDown size={14} />
//                 Expand All
//               </button>
//               <button 
//                 onClick={handleCollapseAll}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
//               >
//                 <ChevronsUp size={14} />
//                 Collapse All
//               </button>
//            </div>
//         </div>
//       </div>

//       {selectedNode && (
//         <div className="absolute top-6 right-6 bottom-6 z-20 w-[400px] flex flex-col pointer-events-none">
//           <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-300 pointer-events-auto max-h-full">
            
//             <div className="p-6 border-b border-slate-50 bg-slate-50/50">
//                <div className="flex items-start gap-4">
//                   <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
//                      <CheckCircle2 size={24} />
//                   </div>
//                   <div>
//                     <h2 className="font-bold text-slate-800 text-lg leading-snug">
//                       {selectedNode.data.details.title || selectedNode.data.label}
//                     </h2>
//                     {selectedNode.data.details.owner && (
//                         <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                           {selectedNode.data.details.owner}
//                         </span>
//                     )}
//                   </div>
//                </div>
//             </div>

//             <div className="p-6 overflow-y-auto flex-1 space-y-6">
//                <div>
//                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
//                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
//                     {selectedNode.data.details.description}
//                  </p>
//                </div>

//                {(selectedNode.data.details.frequency || selectedNode.data.details.docId) && (
//                  <div className="grid grid-cols-2 gap-4">
//                    {selectedNode.data.details.frequency && (
//                      <div className="p-3 rounded-lg border border-slate-100 bg-white">
//                         <span className="text-xs text-slate-400 block mb-1">Frequency</span>
//                         <span className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
//                           <Calendar size={14} />
//                           {selectedNode.data.details.frequency}
//                         </span>
//                      </div>
//                    )}
//                    {selectedNode.data.details.docId && (
//                      <div className="p-3 rounded-lg border border-slate-100 bg-white">
//                         <span className="text-xs text-slate-400 block mb-1">Doc ID</span>
//                         <span className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
//                           <FileText size={14} />
//                           {selectedNode.data.details.docId}
//                         </span>
//                      </div>
//                    )}
//                  </div>
//                )}

//                {(selectedNode.data.details.action || selectedNode.data.details.notes) && (
//                  <div>
//                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</h3>
//                    <ul className="space-y-3">
//                       {selectedNode.data.details.action && (
//                         <li className="flex items-start gap-3 text-sm text-slate-600">
//                           <div className="min-w-[6px] h-[6px] mt-2 rounded-full bg-blue-400" />
//                           <span>Action: <strong className="text-slate-800">{selectedNode.data.details.action}</strong></span>
//                         </li>
//                       )}
//                       {selectedNode.data.details.notes && (
//                         <li className="flex items-start gap-3 text-sm text-slate-600">
//                           <div className="min-w-[6px] h-[6px] mt-2 rounded-full bg-amber-400" />
//                           <span>Note: {selectedNode.data.details.notes}</span>
//                         </li>
//                       )}
//                    </ul>
//                  </div>
//                )}
//             </div>
            
//             <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
//               <button 
//                 onClick={closePanel}
//                 className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-500 text-sm font-semibold rounded-xl transition-all shadow-sm"
//               >
//                 Close Details
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Added `sop` and `onClose` props to the main export
// export default function SOPFlowchart({ sop, onClose }) {
//   return (
//     <div className="relative w-full max-w-[95vw] h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
      
//       {/* Modal Header for Flowchart */}
//       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-20 shrink-0">
//         <h3 className="font-semibold text-lg text-slate-800">
//           Process Flow: {sop?.name || 'SOP Flow Map'}
//         </h3>
//         <button 
//           onClick={onClose}
//           className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
//         >
//           <X className="h-5 w-5" />
//         </button>
//       </div>
      
//       {/* Flowchart Content */}
//       <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">
//         <ReactFlowProvider>
//           <FlowchartInstance />
//         </ReactFlowProvider>
//       </div>
      
//     </div>
//   );
// }




















import React, { useCallback, useState, useEffect, useMemo, createContext, useContext } from 'react';
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
  X 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. IMPORT THE JSON STRUCTURE
import structureData from './structure.json';
import 'reactflow/dist/style.css';

// Context to share the active filter state with custom nodes
export const FlowContext = createContext({ activeLens: 'All' });

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
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

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
      targetPosition: Position.Top,     
      sourcePosition: Position.Bottom,  
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
          details: {
            title: cleanTitle,
            description: cleanContent || `Refer to section ${item.id} documentation.`,
            action: item.children && item.children.length > 0 ? 'Expand for steps' : 'Execute Step',
            criticality: item.id.startsWith('5.') ? 'High' : 'Normal',
          }
        },
      });

      edges.push({
        id: `e-${parentId}-${item.id}`,
        source: parentId,
        target: item.id,
        type: 'smoothstep',
        animated: depth === 1,
      });

      if (item.children && item.children.length > 0) {
        traverse(item.children, item.id, depth + 1);
      }
    });
  };

  traverse(jsonData, 'root', 1);
  return { rawNodes: nodes, rawEdges: edges };
}

const enrichNodeData = (nodes, edges, activeLens = 'All') => {
  let validNodeIds = new Set(nodes.map(n => n.id)); 
  
  if (activeLens !== 'All') {
    const targetNodeIds = new Set();
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

  return nodes.map(node => {
    const childEdges = edges.filter((edge) => edge.source === node.id);
    const validChildIds = childEdges.map(e => e.target).filter(id => validNodeIds.has(id));
    
    const hasChildren = validChildIds.length > 0;
    const visibleChildren = nodes.filter((n) => validChildIds.includes(n.id) && !n.hidden);
    
    return {
      ...node,
      data: {
        ...node.data,
        hasChildren,
        isExpanded: visibleChildren.length > 0
      }
    };
  });
};

// ============================================================================
// 4. LOGIC HELPERS
// ============================================================================

const ExpandCollapseButton = ({ expanded, onClick }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation(); 
      onClick();
    }}
    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm z-50 border-2 border-white cursor-pointer"
  >
    {expanded ? <Minus size={12} /> : <Plus size={12} />}
  </button>
);

const useNodeToggle = (id) => {
  const { activeLens } = useContext(FlowContext); 
  const { getEdges, getNodes, setNodes, fitView } = useReactFlow();

  const handleToggle = useCallback(() => {
    const edges = getEdges();
    const nodes = getNodes();
    const childEdges = edges.filter((edge) => edge.source === id);
    const childNodeIds = childEdges.map((edge) => edge.target);
    
    const isCurrentlyExpanded = nodes.some(n => childNodeIds.includes(n.id) && !n.hidden);
    
    let updatedNodes;

    if (isCurrentlyExpanded) {
      const allDescendants = new Set();
      const getDescendants = (nodeId) => {
          const cEdges = edges.filter(e => e.source === nodeId);
          cEdges.forEach(e => {
              allDescendants.add(e.target);
              getDescendants(e.target);
          });
      };
      getDescendants(id);

      updatedNodes = nodes.map((node) => {
          if (allDescendants.has(node.id)) return { ...node, hidden: true };
          return node;
      });
    } else {
      let validChildIds = childNodeIds;
      
      if (activeLens !== 'All') {
        const targetNodeIds = new Set();
        nodes.forEach(n => {
          if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
        });

        const ancestorsToUnhide = new Set();
        const traceAncestors = (nodeId) => {
          const incomingEdges = edges.filter(e => e.target === nodeId);
          incomingEdges.forEach(edge => {
            ancestorsToUnhide.add(edge.source);
            traceAncestors(edge.source);
          });
        };
        targetNodeIds.forEach(tId => traceAncestors(tId));
        
        validChildIds = childNodeIds.filter(cId => targetNodeIds.has(cId) || ancestorsToUnhide.has(cId));
      }

      updatedNodes = nodes.map((node) => {
        if (validChildIds.includes(node.id)) return { ...node, hidden: false };
        return node;
      });
    }
    
    let nextNodes = enrichNodeData(updatedNodes, edges, activeLens);
    const { nodes: layoutedNodes } = getLayoutedElements(nextNodes, edges);
    setNodes(layoutedNodes);
    
    setTimeout(() => { fitView({ duration: 600, padding: 0.2, maxZoom: 1 }); }, 50);
  }, [id, activeLens, getEdges, getNodes, setNodes, fitView]);

  return handleToggle;
};

// ============================================================================
// 5. CUSTOM NODE COMPONENTS
// ============================================================================

const MainNode = ({ id, data, selected }) => {
  const handleToggle = useNodeToggle(id);

  return (
    <div className={cn(
      "w-72 p-4 rounded-xl shadow-lg transition-all duration-300 bg-blue-600 text-white relative",
      selected && "ring-4 ring-blue-500/30 scale-105"
    )}>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-200 !w-3 !h-3 opacity-0 pointer-events-none" />
      <ExpandCollapseButton expanded={data.isExpanded} onClick={handleToggle} />

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
        
        <div className="mt-4 flex items-center gap-3 text-blue-200 text-xs border-t border-blue-500/50 pt-3">
           <div className="flex items-center gap-1">
             <User size={12} />
             <span>{data.details.owner}</span>
           </div>
           <div className="flex items-center gap-1">
             <Calendar size={12} />
             <span>{data.details.updated}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const StepNode = ({ id, data, selected }) => {
  const handleToggle = useNodeToggle(id);
  const primaryRole = data.roles && data.roles.length > 0 ? data.roles[0] : null;
  const topBorderColor = primaryRole ? roleBorderColors[primaryRole] : 'border-t-slate-300';

  return (
    <div className={cn(
      "w-72 p-4 rounded-xl shadow-sm border-x border-b border-t-4 transition-all duration-300 relative bg-white",
      topBorderColor,
      data.isDimmed ? "opacity-30 grayscale saturate-0 scale-95" : "opacity-100",
      selected && !data.isDimmed ? "ring-2 ring-blue-500/20 shadow-md scale-[1.02]" : "hover:shadow-md",
    )}>
      <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-2 !h-2 opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-2 !h-2 opacity-0" />
      
      {data.hasChildren && (
        <ExpandCollapseButton expanded={data.isExpanded} onClick={handleToggle} />
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
            <span>Step Details</span>
         </div>
         <div className={cn(
           "h-6 w-6 rounded-full flex items-center justify-center transition-colors text-xs",
           selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
         )}>
            <span>→</span>
         </div>
      </div>
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
  
  const { nodes: initialLayoutNodes, edges: initialLayoutEdges } = useMemo(() => {
    const enriched = enrichNodeData(rawNodes, rawEdges, 'All');
    return getLayoutedElements(enriched, rawEdges);
  }, [rawNodes, rawEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayoutEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeLens, setActiveLens] = useState('All');

  const { getEdges, fitView } = useReactFlow();

  useEffect(() => {
    const currentEdges = getEdges();
    setNodes((currentNodes) => {
      let nextNodes = [...currentNodes];

      const targetNodeIds = new Set();
      if (activeLens !== 'All') {
        nextNodes.forEach(n => {
          if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
        });
      }

      nextNodes = nextNodes.map(node => {
        const isTarget = activeLens === 'All' || targetNodeIds.has(node.id);
        
        if (node.id === 'root') {
          return { ...node, hidden: false, data: { ...node.data, isDimmed: !isTarget } };
        }

        return { 
          ...node, 
          hidden: true, 
          data: { ...node.data, isDimmed: !isTarget } 
        };
      });

      nextNodes = enrichNodeData(nextNodes, currentEdges, activeLens);
      const { nodes: layoutedNodes } = getLayoutedElements(nextNodes, currentEdges);
      return layoutedNodes;
    });
    
    setTimeout(() => { fitView({ duration: 600, padding: 0.2, maxZoom: 1 }); }, 50);
  }, [activeLens, getEdges, setNodes, fitView]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const closePanel = () => setSelectedNode(null);

  const handleExpandAll = useCallback(() => {
    const currentEdges = getEdges();
    setNodes(nds => {
      let nextNodes;
      
      if (activeLens === 'All') {
        nextNodes = nds.map(n => ({ ...n, hidden: false }));
      } else {
        const targetNodeIds = new Set();
        nds.forEach(n => {
          if (n.data.roles && n.data.roles.includes(activeLens)) targetNodeIds.add(n.id);
        });

        const ancestorsToUnhide = new Set();
        const traceAncestors = (nodeId) => {
          const incomingEdges = currentEdges.filter(e => e.target === nodeId);
          incomingEdges.forEach(edge => {
            ancestorsToUnhide.add(edge.source);
            traceAncestors(edge.source);
          });
        };
        targetNodeIds.forEach(id => traceAncestors(id));

        nextNodes = nds.map(n => {
          if (n.id === 'root') return { ...n, hidden: false };
          const isVisible = targetNodeIds.has(n.id) || ancestorsToUnhide.has(n.id);
          return { ...n, hidden: !isVisible };
        });
      }

      const enriched = enrichNodeData(nextNodes, currentEdges, activeLens);
      const { nodes: layouted } = getLayoutedElements(enriched, currentEdges);
      return layouted;
    });
    setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
  }, [getEdges, setNodes, fitView, activeLens]);

  const handleCollapseAll = useCallback(() => {
    const currentEdges = getEdges();
    setNodes(nds => {
      const nextNodes = nds.map(n => ({
        ...n,
        hidden: n.id !== 'root' 
      }));
      const enriched = enrichNodeData(nextNodes, currentEdges, activeLens);
      const { nodes: layouted } = getLayoutedElements(enriched, currentEdges);
      return layouted;
    });
    setTimeout(() => fitView({ duration: 600, padding: 0.2, maxZoom: 1 }), 50);
  }, [getEdges, setNodes, fitView, activeLens]);

  const lensOptions = [
    'All', 
    'Technician - Eng', 
    'Executive - Eng', 
    'Head - Eng', 
    'IPQA'
  ];

  return (
    <div className="w-full h-full bg-slate-50 relative flex font-sans overflow-hidden">
      
      <FlowContext.Provider value={{ activeLens }}>
        <div className="flex-1 h-full p-6">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
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
              type: 'smoothstep',
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

      {/* FILTER & CONTROLS OVERLAY (TOP CENTER) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm pointer-events-auto flex items-center gap-2 flex-wrap w-max">
           <div className="px-2 text-slate-400 shrink-0">
             <Filter size={16} />
           </div>
           <div className="flex gap-1.5 flex-wrap">
             {lensOptions.map(role => (
               <button
                 key={role}
                 onClick={() => setActiveLens(role)}
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

      {selectedNode && (
        <div className="absolute top-6 right-6 bottom-6 z-20 w-[400px] flex flex-col pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-300 pointer-events-auto max-h-full">
            
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                     <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg leading-snug">
                      {selectedNode.data.details.title || selectedNode.data.label}
                    </h2>
                    {selectedNode.data.details.owner && (
                        <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedNode.data.details.owner}
                        </span>
                    )}
                  </div>
               </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
               <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                 <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                    {selectedNode.data.details.description}
                 </p>
               </div>

               {(selectedNode.data.details.frequency || selectedNode.data.details.docId) && (
                 <div className="grid grid-cols-2 gap-4">
                   {selectedNode.data.details.frequency && (
                     <div className="p-3 rounded-lg border border-slate-100 bg-white">
                        <span className="text-xs text-slate-400 block mb-1">Frequency</span>
                        <span className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                          <Calendar size={14} />
                          {selectedNode.data.details.frequency}
                        </span>
                     </div>
                   )}
                   {selectedNode.data.details.docId && (
                     <div className="p-3 rounded-lg border border-slate-100 bg-white">
                        <span className="text-xs text-slate-400 block mb-1">Doc ID</span>
                        <span className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                          <FileText size={14} />
                          {selectedNode.data.details.docId}
                        </span>
                     </div>
                   )}
                 </div>
               )}

               {(selectedNode.data.details.action || selectedNode.data.details.notes) && (
                 <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</h3>
                   <ul className="space-y-3">
                      {selectedNode.data.details.action && (
                        <li className="flex items-start gap-3 text-sm text-slate-600">
                          <div className="min-w-[6px] h-[6px] mt-2 rounded-full bg-blue-400" />
                          <span>Action: <strong className="text-slate-800">{selectedNode.data.details.action}</strong></span>
                        </li>
                      )}
                      {selectedNode.data.details.notes && (
                        <li className="flex items-start gap-3 text-sm text-slate-600">
                          <div className="min-w-[6px] h-[6px] mt-2 rounded-full bg-amber-400" />
                          <span>Note: {selectedNode.data.details.notes}</span>
                        </li>
                      )}
                   </ul>
                 </div>
               )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button 
                onClick={closePanel}
                className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-500 text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Added `sop` and `onClose` props to the main export
export default function SOPFlowchart({ sop, onClose }) {
  return (
    <div className="relative w-full max-w-[95vw] h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
      
      {/* Updated Modal Header for Flowchart */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-20 shrink-0">
        
        {/* Title Container Integrated from the Prompt */}
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-blue-200 shadow-lg shrink-0">
            <Share2 size={20} />
          </div>
          <div>
            <h1 className="text-slate-800 font-bold text-base whitespace-nowrap">
              Process Flow: {sop?.name || 'SOP Flow Map'}
            </h1>
            <p className="text-slate-500 text-xs font-medium whitespace-nowrap">
              Top-Down • Smart Filtering
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
      
      {/* Flowchart Content */}
      <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">
        <ReactFlowProvider>
          <FlowchartInstance />
        </ReactFlowProvider>
      </div>
      
    </div>
  );
}