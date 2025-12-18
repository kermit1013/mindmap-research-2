# Component Architecture Guide

Deep-dive technical reference for developers who want to understand the Canvas internals and implement advanced customizations.

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Canvas.tsx                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           ReactFlowProvider                           │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         CanvasContent                           │  │  │
│  │  │  • useNodesState (nodes array)                  │  │  │
│  │  │  • useEdgesState (edges array)                  │  │  │
│  │  │  • Event handlers (drag, connect, click)        │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │         ReactFlow                         │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │     CustomNode (for each node)      │  │  │  │  │
│  │  │  │  │  • NodeResizeControl                │  │  │  │  │
│  │  │  │  │  • 8 Handles (source/target)        │  │  │  │  │
│  │  │  │  │  • Inline editing (textarea)        │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │     GuideLines (canvas overlay)     │  │  │  │  │
│  │  │  │  │  • Horizontal guide                 │  │  │  │  │
│  │  │  │  │  • Vertical guide                   │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │     Background, Controls, Panel     │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

External Helper:
┌─────────────────────────────────────┐
│     alignmentHelper.ts              │
│  • getHelperLines()                 │
│  • Calculate snap positions         │
│  • Return guide line coordinates    │
└─────────────────────────────────────┘
```

## 🔄 State Management

### Node State

```typescript
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

// useNodesState provides:
// - nodes: Node[] - current node array
// - setNodes: (nodes: Node[]) => void - direct setter
// - onNodesChange: (changes: NodeChange[]) => void - handles drag/resize/delete
```

**Node mutations handled automatically:**
- Position changes (drag)
- Selection changes (click)
- Dimension changes (resize via NodeResizeControl)
- Deletion (delete key)

### Edge State

```typescript
const [edges, setEdges, onEdgesChange] = useEdgesState([]);

// useEdgesState provides:
// - edges: Edge[] - current edge array
// - setEdges: (edges: Edge[]) => void - direct setter  
// - onEdgesChange: (changes: EdgeChange[]) => void - handles creation/deletion
```

### Guide Lines State

```typescript
const [guideLines, setGuideLines] = useState<{
  horizontal: GuideLine | null;
  vertical: GuideLine | null;
}>({ horizontal: null, vertical: null });
```

Updated in `onNodeDrag`, cleared in `onNodeDragStop`.

## 🎣 Event Handlers

### 1. Node Creation

**Double-click canvas:**

```typescript
const onDoubleClick = useCallback((event: React.MouseEvent) => {
  // Prevent if clicking on existing node
  if ((event.target as HTMLElement).closest('.react-flow__node')) return;
  
  // Convert screen coordinates to flow position
  const position = screenToFlowPosition({ 
    x: event.clientX, 
    y: event.clientY 
  });
  
  // Create node at cursor
  const newNode = {
    id: uuidv4(),
    type: 'card',
    position,
    data: { label: '', content: '' },
    style: { width: 300, height: 150 }
  };
  
  setNodes((nds) => nds.concat(newNode));
}, [screenToFlowPosition, setNodes]);
```

### 2. Drag-to-Create Flow

**Drag from handle to empty space:**

```typescript
// Step 1: Track which handle started the drag
const onConnectStart = useCallback((_, { nodeId, handleId }) => {
  connectingNodeId.current = nodeId;
  connectingHandleId.current = handleId;
}, []);

// Step 2: If drag ends without valid connection, create new node
const onConnectEnd = useCallback((event, connectionState) => {
  if (!connectionState.isValid && connectingNodeId.current) {
    const position = screenToFlowPosition({ x: clientX, y: clientY });
    
    // Determine smart target handle (opposite of source)
    let targetHandle = null;
    switch (connectingHandleId.current) {
      case 'top': targetHandle = 'bottom'; break;
      case 'bottom': targetHandle = 'top'; break;
      // ...
    }
    
    // Create node + edge
    const newNode = { id, type: 'card', position, ... };
    const newEdge = {
      id: uuidv4(),
      source: connectingNodeId.current,
      target: id,
      sourceHandle: connectingHandleId.current,
      targetHandle
    };
    
    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
  }
}, [screenToFlowPosition, setNodes, setEdges]);
```

### 3. Alignment Snapping

**Drag node near others:**

```typescript
const onNodeDrag = useCallback((event, node) => {
  // Calculate alignment and snap positions
  const { horizontal, vertical, snappedPosition } = getHelperLines(node, nodes);
  
  // Apply snapping (if within threshold)
  if (snappedPosition.x !== undefined || snappedPosition.y !== undefined) {
    setNodes((nds) => nds.map((n) => {
      if (n.id === node.id) {
        return {
          ...n,
          position: {
            x: snappedPosition.x ?? n.position.x,
            y: snappedPosition.y ?? n.position.y,
          }
        };
      }
      return n;
    }));
  }
  
  // Update guide lines state
  setGuideLines({ horizontal, vertical });
}, [nodes, setNodes]);
```

### 4. Manual Connection

**Drag from handle to another handle:**

```typescript
const onConnect = useCallback((params: Connection) => {
  // Apply default edge styling
  setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
}, [setEdges]);
```

## 🧩 Component Deep Dive

### CustomNode.tsx

**Key Features:**

1. **Resizing:**
   ```tsx
   <NodeResizeControl 
     minWidth={100} 
     minHeight={50}
   >
     <ResizeIcon />  {/* Custom SVG in bottom-right */}
   </NodeResizeControl>
   ```

2. **Connection Handles:**
   ```tsx
   // 4 Target handles (receive connections)
   <Handle
     id="top"
     type="target"
     position={Position.Top}
     style={{ width: '20px', height: '20px' }}
     className="!bg-[#FFCC35] opacity-0 hover:opacity-100"
   />
   
   // 4 Source handles (create connections)
   <Handle
     id="top"
     type="source"
     position={Position.Top}
     style={{ width: '20px', height: '20px' }}
     className="!bg-[#FFCC35] opacity-0 hover:opacity-100 z-10"
   />
   ```

**Why 8 handles?** 
- `source` = can drag OUT to create edge
- `target` = can receive incoming edge
- Both types needed at same position for bidirectional connections

3. **Inline Editing:**
   ```tsx
   const [isEditing, setIsEditing] = useState(false);
   const [editValue, setEditValue] = useState(content || '');
   
   {isEditing ? (
     <textarea
       value={editValue}
       onChange={(e) => setEditValue(e.target.value)}
       onBlur={() => {
         setIsEditing(false);
         updateNodeData(id, { content: editValue });
       }}
       autoFocus
     />
   ) : (
     <div onDoubleClick={() => setIsEditing(true)}>
       {content}
     </div>
   )}
   ```

4. **Auto-resize Textarea:**
   ```tsx
   onInput={(e) => {
     const target = e.target as HTMLTextAreaElement;
     target.style.height = 'auto';
     target.style.height = `${target.scrollHeight}px`;
   }}
   ```

### GuideLines.tsx

**Rendering Mechanism:**

Uses `<canvas>` element (not React Flow's `<Background>`) to draw custom overlay lines.

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  
  // Handle Retina displays
  const dpi = window.devicePixelRatio;
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  ctx.scale(dpi, dpi);
  
  // Clear previous frame
  ctx.clearRect(0, 0, width, height);
  
  // Draw yellow guide lines
  ctx.strokeStyle = '#FFCC35';
  ctx.lineWidth = 1;
  
  if (horizontal?.y !== undefined) {
    ctx.beginPath();
    ctx.moveTo(0, horizontal.y);
    ctx.lineTo(width, horizontal.y);
    ctx.stroke();
  }
  
  // Same for vertical...
}, [horizontal, vertical, width, height]);
```

**Transform Handling:**

```typescript
const transform = useTransform();  // React Flow hook
const { x, y, zoom } = parseTransform(transform);

// Apply inverse transform to keep lines fixed to canvas
const canvasStyle = {
  transform: `translate(${-x / zoom}px, ${-y / zoom}px) scale(${1 / zoom})`,
  transformOrigin: '0 0'
};
```

### alignmentHelper.ts

**Core Algorithm:**

```typescript
export const getHelperLines = (
  node: Node,
  nodes: Node[]
): {
  horizontal: GuideLine | null;
  vertical: GuideLine | null;
  snappedPosition: { x?: number; y?: number };
} => {
  const SNAP_THRESHOLD = 5;  // px threshold for snapping
  
  // Current node bounds
  const nodeCenter = {
    x: node.position.x + (node.style?.width || 0) / 2,
    y: node.position.y + (node.style?.height || 0) / 2
  };
  
  let closestH = Infinity, closestV = Infinity;
  let hGuide = null, vGuide = null;
  let snapX, snapY;
  
  // Check against all other nodes
  for (const otherNode of nodes) {
    if (otherNode.id === node.id) continue;
    
    const otherCenter = { x: ..., y: ... };
    
    // Horizontal alignment (same Y)
    const dy = Math.abs(nodeCenter.y - otherCenter.y);
    if (dy < closestH && dy < SNAP_THRESHOLD) {
      closestH = dy;
      hGuide = { y: otherCenter.y };
      snapY = otherCenter.y - (node.style?.height || 0) / 2;
    }
    
    // Vertical alignment (same X)
    const dx = Math.abs(nodeCenter.x - otherCenter.x);
    if (dx < closestV && dx < SNAP_THRESHOLD) {
      closestV = dx;
      vGuide = { x: otherCenter.x };
      snapX = otherCenter.x - (node.style?.width || 0) / 2;
    }
    
    // Also check edges (left/right/top/bottom alignment)
    // ...
  }
  
  return {
    horizontal: hGuide,
    vertical: vGuide,
    snappedPosition: { x: snapX, y: snapY }
  };
};
```

## 🎨 Styling Patterns

### Tailwind Important Modifier

React Flow applies default styles via CSS classes with high specificity. To override:

```tsx
// ❌ Won't work
className="bg-[#FFCC35]"

// ✅ Will work  
className="!bg-[#FFCC35]"  // Becomes: background-color: #FFCC35 !important;
```

### Conditional Styling

```tsx
className={`
  border-[3px] 
  transition-all 
  duration-75 
  ${selected ? 'border-[#FFCC35]' : 'border-transparent hover:border-[#e0e0e0]'}
`}
```

## 🚀 Advanced Customization

### Add Node Types

```tsx
// 1. Create new component
const CircleNode = ({ data, selected }) => (
  <div className="w-32 h-32 rounded-full bg-blue-500">
    {data.content}
  </div>
);

// 2. Register in Canvas.tsx
const nodeTypes = {
  card: CustomNode,
  circle: CircleNode,  // New type
};

// 3. Use when creating nodes
const newNode = {
  id: uuidv4(),
  type: 'circle',  // Instead of 'card'
  // ...
};
```

### Custom Edge Animations

```tsx
const defaultEdgeOptions = {
  animated: true,  // Adds flowing animation
  style: { 
    strokeWidth: 3, 
    stroke: '#FFCC35' 
  },
  markerEnd: {  // Add arrow
    type: MarkerType.ArrowClosed,
    color: '#FFCC35'
  }
};
```

### Keyboard Shortcuts

```tsx
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'n' && event.metaKey) {
      // Cmd+N: Create node at center
      const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const position = screenToFlowPosition(center);
      setNodes((nds) => nds.concat(createNode(position)));
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## 📊 Performance Considerations

### Node Rendering

- **Memo**: CustomNode is wrapped in `memo()` to prevent unnecessary re-renders
- **Handles**: Use `opacity-0 hover:opacity-100` instead of conditional rendering for better performance

### State Updates

- **Batch updates**: React Flow batches `onNodesChange` and `onEdgesChange` internally
- **Debounce saves**: If syncing to backend, debounce state changes:
  ```tsx
  useEffect(() => {
    const saveTimeout = setTimeout(() => saveToAPI(nodes, edges), 1000);
    return () => clearTimeout(saveTimeout);
  }, [nodes, edges]);
  ```

## 🐛 Common Pitfalls

1. **Missing `!` prefix on Tailwind classes**
   - React Flow's default styles are very specific. Always use `!important` modifiers.

2. **Forgetting to handle both source and target**
   - Bidirectional edges require both handle types at same position.

3. **Not accounting for DPI in canvas rendering**
   - GuideLines multiplies dimensions by `window.devicePixelRatio` for crisp lines on Retina displays.

4. **Mutating state directly**
   - Always use setNodes/setEdges, never `nodes.push()` or `nodes[0].position = ...`

---

**Questions?** Open an issue or refer to [React Flow Docs](https://reactflow.dev/learn).
