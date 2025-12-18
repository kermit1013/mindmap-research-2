import React, { memo, useCallback, useState, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl, useReactFlow } from '@xyflow/react';

// interface CustomNodeData extends Record<string, unknown> {
//   label?: string;
//   content?: string;
// }

const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { label, content } = data as { label?: string; content?: string };
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content || label || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas double click
    setIsEditing(true);
    setEditValue(content || label || '');
  }, [content, label]);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeData(id, { content: editValue, label: '' }); // Simplify to just content for now as user asked to remove "New Card"
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


        <div className="p-6 h-full flex flex-col box-border justify-center items-center w-full overflow-hidden">
            {isEditing ? (
                 <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent resize-none outline-none border-none text-center text-xl font-medium text-[#222] overflow-hidden break-words whitespace-pre-wrap m-auto p-0"
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
                        // Move cursor to end
                        target.setSelectionRange(target.value.length, target.value.length);
                    }}
                 />
            ) : (
                <div className="text-xl text-[#222] font-medium text-center m-auto overflow-y-auto scrollbar-none w-full break-words whitespace-pre-wrap">
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
