import React, { CSSProperties, useEffect, useRef } from 'react';
import { useStore, ReactFlowState } from '@xyflow/react';
import { GuideLine } from './alignmentHelper';

const canvasStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  zIndex: 10,
  pointerEvents: 'none',
  top: 0,
  left: 0,
};

const storeSelector = (state: ReactFlowState) => ({
  width: state.width,
  height: state.height,
  transform: state.transform,
});

interface GuideLinesProps {
  horizontal: GuideLine | null;
  vertical: GuideLine | null;
}

export const GuideLines = ({ horizontal, vertical }: GuideLinesProps) => {
  const { width, height, transform } = useStore(storeSelector);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas) {
      return;
    }

    const dpi = window.devicePixelRatio;
    canvas.width = width * dpi;
    canvas.height = height * dpi;

    ctx.scale(dpi, dpi);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#b4c46c';
    ctx.lineWidth = 1;

    if (vertical && typeof vertical.x === 'number') {
      const x = vertical.x * transform[2] + transform[0];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    if (horizontal && typeof horizontal.y === 'number') {
      const y = horizontal.y * transform[2] + transform[1];
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [width, height, transform, horizontal, vertical]);

  return (
    <canvas
      ref={canvasRef}
      className="react-flow__guidelines"
      style={canvasStyle}
    />
  );
};
