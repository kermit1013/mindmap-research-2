import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';

// interface CustomNodeData extends Record<string, unknown> {
//   label?: string;
//   content?: string;
// }

const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { label, content } = data as { label?: string; content?: string };
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(content || label || '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
      <NodeResizer 
        minWidth={100} 
        minHeight={50} 
        isVisible={selected} 
        lineClassName="border-transparent" 
        handleClassName="h-2.5 w-2.5 bg-[#b4c46c] border-none rounded-full"
      />
      <div 
        className={`shadow-sm rounded-[28px] bg-[#f9f9f9] border-2 transition-all duration-75 ${selected ? 'border-[#b4c46c] shadow-[0_0_0_1px_#b4c46c]' : 'border-transparent hover:border-[#e0e0e0]'} text-[#222] h-full w-full min-h-[50px] min-w-[100px] flex flex-col justify-center`}
        onDoubleClick={onDoubleClick}
      >
        {/* Handles */}
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-[#424242] border-2 border-[#1e1e1e] !top-[-6px] opacity-0 hover:opacity-100"
        />
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-[#424242] border-2 border-[#1e1e1e] !left-[-6px] opacity-0 hover:opacity-100"
        />
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          className="w-3 h-3 bg-[#424242] border-2 border-[#1e1e1e] !bottom-[-6px] opacity-0 hover:opacity-100"
        />
        <Handle
          id="right"
          type="target"
          position={Position.Right}
          className="w-3 h-3 bg-[#424242] border-2 border-[#1e1e1e] !right-[-6px] opacity-0 hover:opacity-100"
        />

        {/* Source Handles */}
        <Handle
            id="top"
            type="source"
            position={Position.Top}
            className="w-3 h-3 opacity-0 hover:opacity-100 bg-[#eeb211] border-2 border-[#1e1e1e] !top-[-6px] z-10"
        />
        <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 opacity-0 hover:opacity-100 bg-[#eeb211] border-2 border-[#1e1e1e] !bottom-[-6px] z-10"
        />
        <Handle
            id="left"
            type="source"
            position={Position.Left}
            className="w-3 h-3 opacity-0 hover:opacity-100 bg-[#eeb211] border-2 border-[#1e1e1e] !left-[-6px] z-10"
        />
        <Handle
            id="right"
            type="source"
            position={Position.Right}
            className="w-3 h-3 opacity-0 hover:opacity-100 bg-[#eeb211] border-2 border-[#1e1e1e] !right-[-6px] z-10"
        />


        <div className="p-6 h-full flex flex-col box-border justify-center items-center w-full">
            {isEditing ? (
                 <textarea
                    ref={textareaRef}
                    className="w-full h-full bg-transparent resize-none outline-none text-center text-lg text-[#222]"
                    value={editValue}
                    onChange={onChange}
                    onBlur={onBlur}
                    autoFocus
                 />
            ) : (
                <div className="text-xl text-[#222] font-medium text-center m-auto overflow-y-auto scrollbar-none w-full break-words whitespace-pre-wrap">
                    {content || label || "Double click to edit..."}
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default memo(CustomNode);
