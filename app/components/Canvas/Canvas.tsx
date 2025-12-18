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
import { useCopyPaste } from './useCopyPaste';

const CanvasContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { screenToFlowPosition } = useReactFlow();
    const { takeSnapshot } = useUndoRedo();
    const { cut, copy, paste } = useCopyPaste();

    // Save status state: 'saved' | 'saving' | 'error'
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const loadGraph = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8080/api/graphs/26', {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                }
            });
            if (!response.ok) throw new Error('Failed to load');
            const data = await response.json();
            console.log(data.data.content);
            
            // Assuming the structure is { ..., content: '{"nodes": [], "edges": []}' }
            if (data.data.content) {
                const parsedContent = JSON.parse(data.data.content);
                if (parsedContent.nodes) setNodes(parsedContent.nodes);
                if (parsedContent.edges) setEdges(parsedContent.edges);
            }
            
            setIsInitialLoad(false);
        } catch (error) {
            console.error('Load error:', error);
            // Even if it fails, we release the lock so user can start fresh
            setIsInitialLoad(false); 
        }
    }, [setNodes, setEdges]);

    // Initial load
    React.useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    const saveGraph = useCallback(async () => {
        if (isInitialLoad) return; // double safety
        setSaveStatus('saving');
        try {
            const response = await fetch('http://localhost:8080/api/graphs/26', {
                method: 'PUT',
                headers: {
                    'accept': '*/*',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrODQxMDEzMTFAZ21haWwuY29tIiwianRpIjoiZjdmNzI4NTYtYmQ3Ni00NTQzLTljYjItMjFjMWZiYzQ1YTkyIiwiaWF0IjoxNzY2MDQ1MzQ3LCJleHAiOjE3NjYxMzE3NDd9.9Ai027nSMdAynMOk8tW6ZDB76OGYTBXpYDycv9myM2U',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'content': JSON.stringify({
                    nodes,
                    edges
                })
                })
            });
            
            if (!response.ok) throw new Error('Failed to save');
            setSaveStatus('saved');
        } catch (error) {
            console.error('Save error:', error);
            setSaveStatus('error');
        }
    }, [nodes, edges, isInitialLoad]);

    // Debounced auto-save
    React.useEffect(() => {
        if (isInitialLoad) return; // Prevent saving before loading
        
        const timer = setTimeout(() => {
            saveGraph();
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [nodes, edges, saveGraph, isInitialLoad]);
    
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
                    <div className="flex items-center gap-2 mb-1 justify-between">
                        <span className="font-bold">Status:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            saveStatus === 'saved' ? 'bg-green-100 text-green-700' :
                            saveStatus === 'saving' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {saveStatus}
                        </span>
                    </div>
                    Double-click to add node<br/>
                    Drag from handle to create linked node<br/>
                    Cmd/Ctrl+C to copy, Cmd/Ctrl+X to cut, Cmd/Ctrl+V to paste
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
