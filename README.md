# Canvas Mind Map Component

A production-ready, reusable React Flow canvas component for building interactive mind maps and flowcharts. Features drag-and-drop node creation, inline editing, visual alignment guides, and customizable styling.

![Canvas Demo](https://img.shields.io/badge/React_Flow-12.10.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)

## ✨ Features

- ✅ **Node Creation:** Double-click canvas or drag from connection handles
- ✅ **Inline Editing:** Double-click nodes to edit content with auto-resizing textarea
- ✅ **Visual Alignment:** Smart snapping guides (yellow lines) when dragging nodes
- ✅ **Resizable Nodes:** Drag corner handles when node is selected
- ✅ **Connections:** Drag between yellow handle dots to create edges
- ✅ **Professional Styling:** Rounded corners, smooth animations, yellow accent theme
- ✅ **Fully Self-Contained:** No external state management required

## 🚀 Quick Start

### Installation

```bash
# Install required dependencies
npm install @xyflow/react uuid
npm install -D @types/uuid

# If using Tailwind CSS (recommended)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

### Copy Components

```bash
# Copy the Canvas component folder to your project
cp -r app/components/Canvas your-project/components/
```

### Basic Usage

```tsx
import Canvas from '@/components/Canvas/Canvas';

export default function MyApp() {
  return (
    <div className="h-screen w-screen">
      <Canvas />
    </div>
  );
}
```

That's it! The canvas is fully functional with all features enabled.

## 📁 Project Structure

```
app/components/Canvas/
├── Canvas.tsx           # Main container + node/edge state management
├── CustomNode.tsx       # Editable node component with resize handles
├── GuideLines.tsx       # Alignment visual feedback (yellow guide lines)
└── alignmentHelper.ts   # Snapping calculation logic
```

## 🎨 Customization Guide

### Change Theme Colors

**Node Border & Handles (Yellow → Your Color):**

```tsx
// In CustomNode.tsx
// Find all instances of #FFCC35 and replace:
className="border-[#FFCC35]"  // Selected node border
className="!bg-[#FFCC35]"     // Connection handles

// In GuideLines.tsx
ctx.strokeStyle = '#FFCC35';  // Alignment guide lines
```

### Adjust Edge Thickness

```tsx
// In Canvas.tsx
const defaultEdgeOptions = {
  style: { 
    strokeWidth: 3,      // Change this value (1-5 recommended)
    stroke: '#b1b1b7'    // Edge color
  },
};
```

### Background Dot Pattern

```tsx
// In Canvas.tsx
<Background 
  variant={BackgroundVariant.Dots} 
  gap={20}              // Distance between dots
  size={1.5}            // Dot size
  color="#d1d1d1"       // Dot color
/>
```

### Node Default Size

```tsx
// In CustomNode.tsx
<NodeResizeControl 
  minWidth={100}         // Minimum width
  minHeight={50}         // Minimum height
>

// In Canvas.tsx (for new nodes)
style: { width: 300, height: 150 }
```

## 🔌 Backend Integration

### Data Structure

The Canvas works with standard React Flow node/edge format. Here's the recommended structure for API integration:

```typescript
// Node structure
interface CanvasNode {
  id: string;                        // Unique identifier
  type: 'card';                      // Node type (only 'card' supported)
  position: { x: number; y: number };// Position on canvas
  data: {
    label?: string;                  // Legacy field (optional)
    content: string;                 // Node text content
    imageUrl?: string;               // Optional image URL/DataURI
  };
  style?: {                          // Persisted dimensions
    width: number;
    height: number;
  };
}

// Edge structure  
interface CanvasEdge {
  id: string;                        // Unique identifier
  source: string;                    // Source node ID
  target: string;                    // Target node ID
  sourceHandle?: 'top' | 'bottom' | 'left' | 'right';  // Connection point
  targetHandle?: 'top' | 'bottom' | 'left' | 'right';  // Connection point
  style?: {                          // Optional styling
    strokeWidth: number;
    stroke: string;
  };
}
```

### Load from API

Modify `Canvas.tsx` to load initial data:

```tsx
const CanvasContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Load data on mount
  useEffect(() => {
    const loadMap = async () => {
      const response = await fetch('/api/maps/26');
      const { data } = await response.json();
      setNodes(data.nodes);
      setEdges(data.edges);
    };
    loadMap();
  }, []);
  
  // ... rest of component
}
```

### Save to API

Add auto-save or manual save:

```tsx
// Auto-save on changes
useEffect(() => {
  const saveMap = async () => {
    await fetch('/api/maps/26', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges })
    });
  };
  
  // Debounce saves
  const timeoutId = setTimeout(saveMap, 1000);
  return () => clearTimeout(timeoutId);
}, [nodes, edges]);
```

### Example API Response

```json
{
  "message": "Graph retrieved successfully",
  "data": {
    "map": {
      "id": "26",
      "title": "My Mind Map",
      "userId": 74
    },
    "nodes": [
      {
        "id": "1823",
        "type": "card",
        "position": { "x": 643.38, "y": 873.51 },
        "data": {
          "content": "Surfing",
          "label": ""
        },
        "style": { "width": 300, "height": 150 }
      },
      {
        "id": "image-node-1",
        "type": "card",
        "position": { "x": 300, "y": 400 },
        "data": {
          "content": "",
          "label": "Beach.png",
          "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "isCover": true
        },
        "style": { "width": 300, "height": 250 }
      }
    ],
    "edges": [
      {
        "id": "1737",
        "source": "1033",
        "target": "1819",
        "sourceHandle": "bottom",
        "targetHandle": "top"
      }
    ]
  }
}
```

## 🎯 User Interactions

| Action | Result |
|--------|--------|
| **Double-click canvas** | Create new node at cursor position |
| **Double-click node** | Enter edit mode (inline text editing) |
| **Drag node corners** | Resize node (when selected) |
| **Drag from handle** | Create connection to another node |
| **Drag handle to empty space** | Create new node + auto-connect |
| **Drag node near others** | Show alignment guides (snap to align) |
| **Hover over node edge** | Show yellow connection handles |

## 🛠️ Dependencies

```json
{
  "dependencies": {
    "@xyflow/react": "^12.10.0",   // Core canvas library
    "uuid": "^13.0.0",              // ID generation
    "react": "^19.2.1",             // React framework
    "next": "^16.0.10"              // Next.js (or use plain React)
  },
  "devDependencies": {
    "@types/uuid": "^11.0.0",       // TypeScript types
    "tailwindcss": "^4"             // Styling
  }
}
```

## 🔧 Customization Examples

### Add Mini Map

```tsx
import { MiniMap } from '@xyflow/react';

<ReactFlow ...>
  <MiniMap />
  <Background ... />
  <Controls ... />
</ReactFlow>
```

### Change Node Shape

```tsx
// In CustomNode.tsx
// Find this line:
className="rounded-[28px]"  // Circular corners

// Options:
className="rounded-[8px]"   // Slightly rounded
className="rounded-none"    // Sharp rectangle
className="rounded-full"    // Perfect circle (requires square nodes)
```

### Add Animation

```tsx
// In CustomNode.tsx
// Add to main div:
className="... transition-all duration-300 hover:scale-105"
```

## ❓ Troubleshooting

**Q: Handles not visible on hover**  
A: Make sure `!bg-[#FFCC35]` has the `!` prefix to override React Flow's default styles.

**Q: Canvas not filling screen**  
A: Parent container must have explicit height: `className="h-screen"` or `style={{ height: '100vh' }}`

**Q: Tailwind classes not working**  
A: Ensure `tailwind.config.js` includes the Canvas components:
```js
content: [
  "./app/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}"
]
```

**Q: Alignment guides not showing**  
A: The guides only appear when dragging nodes close to other nodes' edges or centers (within 5px threshold).

## 📄 License

This is a research demo. Feel free to use and modify for your projects.

## 🙏 Acknowledgments

Built with [React Flow](https://reactflow.dev/) - an amazing library for building node-based UIs.

---

**Need more details?** Check out [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) for architecture deep-dive and advanced customization patterns.
