'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow,
  OnConnectEnd,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import CustomNode from './CustomNode';

const nodeTypes = {
  card: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'card',
    position: { x: 250, y: 250 },
    data: { label: 'Welcome', content: 'Double click background to add a node.' },
    style: { width: 300, height: 150 },
  },
];

import { getHelperLines, GuideLine } from './alignmentHelper';
import { GuideLines } from './GuideLines';
import useUndoRedo from './useUndoRedo';

const CanvasContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { screenToFlowPosition } = useReactFlow();
    const { takeSnapshot } = useUndoRedo();
    
    // Helper lines state
    const [guideLines, setGuideLines] = useState<{ horizontal: GuideLine | null; vertical: GuideLine | null }>({
        horizontal: null,
        vertical: null
    });

    const onNodeDragStart = useCallback(() => {
        takeSnapshot();
    }, [takeSnapshot]);

    const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
        const { horizontal, vertical, snappedPosition } = getHelperLines(node, nodes);
        
        if (snappedPosition.x !== undefined || snappedPosition.y !== undefined) {
             setNodes((nds) => nds.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        position: {
                            x: snappedPosition.x ?? n.position.x,
                            y: snappedPosition.y ?? n.position.y,
                        }
                    }
                }
                return n;
             }));
        }

        setGuideLines({ horizontal, vertical });
    }, [nodes, setNodes]);

    const onNodeDragStop = useCallback(() => {
        setGuideLines({ horizontal: null, vertical: null });
    }, []);

    // Connect to create - references
    const connectingNodeId = useRef<string | null>(null);
    const connectingHandleId = useRef<string | null>(null);

    const defaultEdgeOptions = {
        style: { strokeWidth: 3, stroke: '#b1b1b7' },
    };

    const onConnect = useCallback(
        (params: Connection) => {
            takeSnapshot();
            setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
        },
        [setEdges, takeSnapshot],
    );

    const onConnectStart = useCallback((_: any, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
        connectingNodeId.current = nodeId;
        connectingHandleId.current = handleId;
    }, []);

    const onConnectEnd: OnConnectEnd = useCallback(
        (event, connectionState) => {
            if (!connectionState.isValid) {
                // Determine position
                const id = uuidv4();
                const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
                const position = screenToFlowPosition({ x: clientX, y: clientY });
                
                // If we dragged from a node, create a new node and connect it
                if (connectingNodeId.current) {
                    takeSnapshot();
                    const sourceHandle = connectingHandleId.current;
                    let targetHandle = null;

                    // Simple smart-ish target handle logic: opposite of source
                    switch (sourceHandle) {
                        case 'top': targetHandle = 'bottom'; break;
                        case 'bottom': targetHandle = 'top'; break;
                        case 'left': targetHandle = 'right'; break;
                        case 'right': targetHandle = 'left'; break;
                    }

                    const newNode: Node = {
                        id,
                        type: 'card',
                        position,
                        data: { label: '', content: '' },
                        origin: [0.5, 0.5],
                        style: { width: 300, height: 150 },
                    };
                    
                    setNodes((nds) => nds.concat(newNode));
                    setEdges((eds) =>
                        eds.concat({ 
                            id: uuidv4(), 
                            source: connectingNodeId.current!, 
                            target: id, 
                            sourceHandle: sourceHandle,
                            targetHandle: targetHandle,
                            type: 'default',
                            ...defaultEdgeOptions
                        } as Edge),
                    );
                }
            }
        },
        [screenToFlowPosition, setEdges, setNodes, takeSnapshot],
    );

    // Double click handler on wrapper
    const onDoubleClick = useCallback((event: React.MouseEvent) => {
        // Prevent strictly on nodes (handled by stopPropagation usually)
        if ((event.target as HTMLElement).closest('.react-flow__node')) {
            return;
        }
        
        takeSnapshot();
        const id = uuidv4();
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

        const newNode: Node = {
            id,
            type: 'card',
            position, // Center on click
            origin: [0, 0], // Default origin
            data: { label: '', content: '' },
            style: { width: 300, height: 150, margin: 'auto' },
        };
        setNodes((nds) => nds.concat(newNode));
    }, [screenToFlowPosition, setNodes, takeSnapshot]);

    // Paste handler
    React.useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (!blob) continue;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = e.target?.result as string;
                        if (result) {
                            takeSnapshot();
                            const id = uuidv4();
                            // Default to center of screen
                            const position = screenToFlowPosition({ 
                                x: window.innerWidth / 2, 
                                y: window.innerHeight / 2 
                            });
                            
                            // Adjust for node size to truly center (approx 300x250)
                            const adjustedPosition = { 
                                x: position.x - 150, 
                                y: position.y - 125 
                            };

                            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS format

                            const newNode: Node = {
                                id,
                                type: 'card',
                                position: adjustedPosition,
                                data: { 
                                    label: `Pasted image ${timestamp}.png`, 
                                    content: '',
                                    imageUrl: result 
                                },
                                style: { width: 300, height: 250 }, 
                            };
                            setNodes((nds) => nds.concat(newNode));
                        }
                    };
                    reader.readAsDataURL(blob);
                    event.preventDefault(); // Prevent default paste behavior (optional but good)
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [screenToFlowPosition, setNodes]);

    return (
        <div className="h-full w-full bg-[#fbfbfb]" onDoubleClick={onDoubleClick}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onNodeDragStart={onNodeDragStart}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                zoomOnDoubleClick={false} // Disable zoom on double click
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#d1d1d1" />
                <Controls className="!bg-white !border-[#eee] [&>button]:!fill-[#666] [&>button]:!border-[#eee] hover:[&>button]:!bg-[#f5f5f5]" />
                <Panel position="top-right" className="bg-white p-2 rounded text-[#444] text-xs border border-[#eee] shadow-sm">
                    Double-click to add node<br/>
                    Drag from handle to create linked node
                </Panel>
                <GuideLines horizontal={guideLines.horizontal} vertical={guideLines.vertical} />
            </ReactFlow>
        </div>
    );
};

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
