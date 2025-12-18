import React, { memo, useCallback, useState, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl, useReactFlow } from '@xyflow/react';

// interface CustomNodeData extends Record<string, unknown> {
//   label?: string;
//   content?: string;
// }

const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { label, content, imageUrl } = data as { label?: string; content?: string; imageUrl?: string };
  const { updateNodeData } = useReactFlow();
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
        <NodeResizeControl 
          style={{ background: 'transparent', border: 'none' }}
          minWidth={100} 
          minHeight={50} 
        >
          <ResizeIcon />
        </NodeResizeControl>
      )}
      <div 
        className={`shadow-sm rounded-[28px] bg-[#f9f9f9] border-[3px] transition-all duration-75 ${selected ? 'border-[#FFCC35]' : 'border-transparent hover:border-[#e0e0e0]'} text-[#222] h-full w-full min-h-[50px] min-w-[100px] flex flex-col justify-center`}
        onDoubleClick={onDoubleClick}
      >
        {/* Handles */}
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none !top-[-10px] opacity-0 hover:opacity-100 transition-opacity"
        />
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none !left-[-10px] opacity-0 hover:opacity-100 transition-opacity"
        />
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none !bottom-[-10px] opacity-0 hover:opacity-100 transition-opacity"
        />
        <Handle
          id="right"
          type="target"
          position={Position.Right}
          style={{ width: '20px', height: '20px' }}
          className="!bg-[#FFCC35] !border-none !right-[-10px] opacity-0 hover:opacity-100 transition-opacity"
        />

        {/* Source Handles */}
        <Handle
            id="top"
            type="source"
            position={Position.Top}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none !top-[-10px] opacity-0 hover:opacity-100 transition-opacity z-10"
        />
        <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none !bottom-[-10px] opacity-0 hover:opacity-100 transition-opacity z-10"
        />
        <Handle
            id="left"
            type="source"
            position={Position.Left}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none !left-[-10px] opacity-0 hover:opacity-100 transition-opacity z-10"
        />
        <Handle
            id="right"
            type="source"
            position={Position.Right}
            style={{ width: '20px', height: '20px' }}
            className="!bg-[#FFCC35] !border-none !right-[-10px] opacity-0 hover:opacity-100 transition-opacity z-10"
        />


        <div className={`h-full flex flex-col box-border items-center w-full overflow-hidden ${imageUrl ? 'p-2' : 'p-6 justify-center'}`}>
            {imageUrl && (
              <div className="w-full flex-grow relative mb-2">
                 <img src={imageUrl} alt="Node" className="w-full h-full object-cover rounded-[20px] pointer-events-none block" />
              </div>
            )}
            
            {isEditing ? (
                 <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent resize-none outline-none border-none text-center text-xl font-medium text-[#222] overflow-hidden break-words whitespace-pre-wrap m-auto p-0"
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
