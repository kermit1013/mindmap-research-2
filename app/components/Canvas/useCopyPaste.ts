import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Node,
  useReactFlow,
  getConnectedEdges,
  Edge,
  XYPosition,
  useStore,
} from '@xyflow/react';

export function useCopyPaste() {
  const mousePosRef = useRef<XYPosition>({ x: 0, y: 0 });
  const rfDomNode = useStore((state) => state.domNode);

  const { getNodes, setNodes, getEdges, setEdges, screenToFlowPosition } =
    useReactFlow();

  // Set up the paste buffers to store the copied nodes and edges.
  const [bufferedNodes, setBufferedNodes] = useState([] as Node[]);
  const [bufferedEdges, setBufferedEdges] = useState([] as Edge[]);

  // Track mouse position for paste location
  useEffect(() => {
    if (rfDomNode) {
      const onMouseMove = (event: MouseEvent) => {
        mousePosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
      };

      rfDomNode.addEventListener('mousemove', onMouseMove);

      return () => {
        rfDomNode.removeEventListener('mousemove', onMouseMove);
      };
    }
  }, [rfDomNode]);

  const copy = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter(
      (edge) => {
        const isExternalSource = selectedNodes.every(
          (n) => n.id !== edge.source
        );
        const isExternalTarget = selectedNodes.every(
          (n) => n.id !== edge.target
        );

        return !(isExternalSource || isExternalTarget);
      }
    );

    setBufferedNodes(selectedNodes);
    setBufferedEdges(selectedEdges);

    // Write a marker to clipboard so we can detect node copy vs external content
    if (selectedNodes.length > 0) {
      navigator.clipboard.writeText('__REACTFLOW_NODES__').catch(() => {
        // Clipboard write failed, but we still have internal buffer
      });
    }
  }, [getNodes, getEdges]);

  const cut = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter(
      (edge) => {
        const isExternalSource = selectedNodes.every(
          (n) => n.id !== edge.source
        );
        const isExternalTarget = selectedNodes.every(
          (n) => n.id !== edge.target
        );

        return !(isExternalSource || isExternalTarget);
      }
    );

    setBufferedNodes(selectedNodes);
    setBufferedEdges(selectedEdges);

    // Write a marker to clipboard so we can detect node copy vs external content
    if (selectedNodes.length > 0) {
      navigator.clipboard.writeText('__REACTFLOW_NODES__').catch(() => {
        // Clipboard write failed, but we still have internal buffer
      });
    }

    // A cut action needs to remove the copied nodes and edges from the graph.
    setNodes((nodes) => nodes.filter((node) => !node.selected));
    setEdges((edges) => edges.filter((edge) => !selectedEdges.includes(edge)));
  }, [getNodes, setNodes, getEdges, setEdges]);

  const paste = useCallback(
    (
      { x: pasteX, y: pasteY } = screenToFlowPosition({
        x: mousePosRef.current.x,
        y: mousePosRef.current.y,
      })
    ) => {
      if (bufferedNodes.length === 0) return;

      const minX = Math.min(...bufferedNodes.map((s) => s.position.x));
      const minY = Math.min(...bufferedNodes.map((s) => s.position.y));

      const now = Date.now();

      const newNodes: Node[] = bufferedNodes.map((node) => {
        const id = `${node.id}-${now}`;
        const x = pasteX + (node.position.x - minX);
        const y = pasteY + (node.position.y - minY);

        return { ...node, id, position: { x, y }, selected: true };
      });

      const newEdges: Edge[] = bufferedEdges.map((edge) => {
        const id = `${edge.id}-${now}`;
        const source = `${edge.source}-${now}`;
        const target = `${edge.target}-${now}`;

        return { ...edge, id, source, target };
      });

      setNodes((nodes) => [
        ...nodes.map((node) => ({ ...node, selected: false })),
        ...newNodes,
      ]);
      setEdges((edges) => [
        ...edges.map((edge) => ({ ...edge, selected: false })),
        ...newEdges,
      ]);
    },
    [bufferedNodes, bufferedEdges, screenToFlowPosition, setNodes, setEdges]
  );

  // Handle image paste
  const pasteImage = useCallback((imageDataUrl: string) => {
    const id = `node-${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    
    // Use mouse position for paste location
    const position = screenToFlowPosition({
      x: mousePosRef.current.x,
      y: mousePosRef.current.y,
    });

    const newNode: Node = {
      id,
      type: 'card',
      position,
      data: { 
        label: `Pasted image ${timestamp}.png`, 
        content: '',
        imageUrl: imageDataUrl 
      },
      style: { width: 300, height: 250 }, 
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, [screenToFlowPosition, setNodes]);

  // Keyboard shortcuts for copy/cut and paste event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
        return;
      }

      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copy();
      } else if (isMeta && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        cut();
      }
    };

    const handlePaste = (event: ClipboardEvent) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
        return;
      }

      // First, check if we have buffered nodes and the clipboard has our marker
      // This takes priority over image paste
      if (bufferedNodes.length > 0) {
        const text = event.clipboardData?.getData('text/plain');
        if (text === '__REACTFLOW_NODES__') {
          event.preventDefault();
          paste();
          return;
        }
      }

      // Check if clipboard has image data (only if we don't have node marker)
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            // Handle image paste
            event.preventDefault();
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result as string;
                if (result) {
                  pasteImage(result);
                }
              };
              reader.readAsDataURL(blob);
            }
            return;
          }
        }
      }

      // Fallback: if we have buffered nodes but no marker (shouldn't happen normally)
      if (bufferedNodes.length > 0) {
        event.preventDefault();
        paste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
    };
  }, [copy, cut, paste, pasteImage, bufferedNodes]);

  return { cut, copy, paste, bufferedNodes, bufferedEdges };
}

export default useCopyPaste;
