import React, { memo, useCallback, useState, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl, useReactFlow, NodeToolbar } from '@xyflow/react';

// interface CustomNodeData extends Record<string, unknown> {
//   label?: string;
//   content?: string;
// }

const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { label, content, imageUrl } = data as { label?: string; content?: string; imageUrl?: string };
  const { updateNodeData, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content || label || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas double click
    // Allow editing label/content even if it's an image node
    setIsEditing(true);
    setEditValue(content || label || '');
  }, [content, label]);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeData(id, { content: editValue, label: '' }); 
  }, [id, editValue, updateNodeData]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value);
  }, []);

  return (
    <>
      {selected && (
        <>
            <NodeToolbar position={Position.Top} className="!border-[3px] !rounded-[28px] !border-none !overflow-hidden" >
            
                    <button 
                        onClick={() => deleteElements({ nodes: [{ id }] })}
                        className="!border-none  !cursor-pointer !bg-inherit !margin: '3px', !padding: '5px 7px', !border-radius: '50%', !box-shadow: 'var(--xy-node-boxshadow-default)'"
                        title="Delete"
                    >
                        <TrashIcon />
                    </button>
                    
                    <button 
                        onClick={() => {
                            setIsEditing(true);
                            setEditValue(content || label || '');
                        }}
                        className="!border-none  !cursor-pointer !bg-inherit !margin: '3px', !padding: '5px 7px', !border-radius: '50%', !box-shadow: 'var(--xy-node-boxshadow-default)'"
                        title="Edit"
                    >
                        <EditIcon />
                    </button>

                    {imageUrl && (
                        <button 
                            onClick={() => {/* Set as Cover functionality */}}
                            className="!border-none  !cursor-pointer !bg-inherit !margin: '3px', !padding: '5px 7px', !border-radius: '50%', !box-shadow: 'var(--xy-node-boxshadow-default)'"
                            title="Set as Cover"
                        >
                            <ImageIcon />
                        </button>
                    )}
            </NodeToolbar>

            <NodeResizeControl 
            style={{ background: 'transparent', border: 'none' }}
            minWidth={100} 
            minHeight={50} 
            >
            <ResizeIcon />
            {/* ... svg ... */}
            </NodeResizeControl>
        </>
      )}
      <div 
        className={`shadow-[0_5px_20px_rgba(0,0,0,0.15)] rounded-[28px] bg-[#f9f9f9] border-[3px] transition-all duration-75 ${selected ? 'border-[#FFCC35]' : 'border-transparent hover:border-[#e0e0e0]'} text-[#222] h-full w-full min-h-[50px] min-w-[100px] flex flex-col justify-center`}
        onDoubleClick={onDoubleClick}
      >
        {/* Handles */}
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none opacity-0 hover:opacity-100 transition-opacity"
        />
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none opacity-0 hover:opacity-100 transition-opacity"
        />
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none !bottom-[-5px] opacity-0 hover:opacity-100 transition-opacity"
        />
        <Handle
          id="right"
          type="target"
          position={Position.Right}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none !right-[-5px] opacity-0 hover:opacity-100 transition-opacity"
        />

        {/* Source Handles */}
        <Handle
            id="top"
            type="source"
            position={Position.Top}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none opacity-0 hover:opacity-100 transition-opacity z-10"
        />
        <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none !bottom-[-5px] opacity-0 hover:opacity-100 transition-opacity z-10"
        />
        <Handle
            id="left"
            type="source"
            position={Position.Left}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none opacity-0 hover:opacity-100 transition-opacity z-10"
        />
        <Handle
            id="right"
            type="source"
            position={Position.Right}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none !right-[-5px] opacity-0 hover:opacity-100 transition-opacity z-10"
        />


        <div className={`h-full flex flex-col box-border items-center w-full overflow-hidden ${imageUrl ? 'p-2' : 'p-6 justify-center'}`}>
            {imageUrl && (
              <div className="w-full flex-grow relative">
                 <img src={imageUrl} alt="Node" className="w-full h-full object-cover pointer-events-none block rounded-[20px]" />
              </div>
            )}
            
            {isEditing ? (
                 <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent resize-none outline-none border-none text-center text-xl font-medium text-[#222] overflow-hidden break-words whitespace-pre-wrap m-auto p-0 z-10"
                    style={{ height: imageUrl ? 'auto' : undefined }}
                    value={editValue}
                    onChange={onChange}
                    onBlur={onBlur}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    autoFocus
                    onFocus={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                        target.setSelectionRange(target.value.length, target.value.length);
                    }}
                 />
            ) : (
                <div className={`text-xl text-[#222] font-medium text-center overflow-y-auto scrollbar-none w-full break-words whitespace-pre-wrap ${imageUrl ? 'mt-auto' : 'm-auto'}`}>
                    {content || label || (selected ? "" : "Double click to edit...")}
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default memo(CustomNode);

function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="#FFCC35"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', right: 5, bottom: 5, cursor: 'nwse-resize' }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="16 20 20 20 20 16" />
      <line x1="14" y1="14" x2="20" y2="20" />
    </svg>
  );
}

function TrashIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D6651F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
    );
}

function EditIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"  viewBox="0 0 24 24" fill="none" stroke="#807F7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
    );
}

function ImageIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#807F7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
    );
}
