import { Node, Position } from '@xyflow/react';

export type GuideLine = {
  x?: number;
  y?: number;
};

type GetHelperLinesResult = {
  horizontal: GuideLine | null;
  vertical: GuideLine | null;
  snappedPosition: { x?: number; y?: number };
};

export function getHelperLines(node: Node, nodes: Node[], distance = 5): GetHelperLinesResult {
  const defaultResult = {
    horizontal: null,
    vertical: null,
    snappedPosition: { x: undefined, y: undefined },
  };

  const nodeWidth = node.measured?.width ?? node.width ?? (typeof node.style?.width === 'number' ? node.style.width : 0) ?? 0;
  const nodeHeight = node.measured?.height ?? node.height ?? (typeof node.style?.height === 'number' ? node.style.height : 0) ?? 0;

  const nodeBounds = {
    x: node.position.x,
    y: node.position.y,
    width: nodeWidth,
    height: nodeHeight,
  };

  const verticalCandidates: number[] = [];
  const horizontalCandidates: number[] = [];

  nodes.forEach((n) => {
    if (n.id === node.id) return;
  const nWidth = n.measured?.width ?? n.width ?? (typeof n.style?.width === 'number' ? n.style.width : 0) ?? 0;
    const nHeight = n.measured?.height ?? n.height ?? (typeof n.style?.height === 'number' ? n.style.height : 0) ?? 0;

    const nBounds = {
      x: n.position.x,
      y: n.position.y,
      width: nWidth,
      height: nHeight,
    };

    // Vertical alignment candidates (x-axis)
    verticalCandidates.push(nBounds.x); // Left
    verticalCandidates.push(nBounds.x + nBounds.width); // Right
    verticalCandidates.push(nBounds.x + nBounds.width / 2); // Center

    // Horizontal alignment candidates (y-axis)
    horizontalCandidates.push(nBounds.y); // Top
    horizontalCandidates.push(nBounds.y + nBounds.height); // Bottom
    horizontalCandidates.push(nBounds.y + nBounds.height / 2); // Center
  });

  let snappedX: number | undefined;
  let snappedY: number | undefined;
  let verticalLine: GuideLine | null = null;
  let horizontalLine: GuideLine | null = null;

  // Check vertical snaps
  const nodeVerticalPoints = [
      nodeBounds.x, // Left
      nodeBounds.x + nodeBounds.width, // Right
      nodeBounds.x + nodeBounds.width / 2 // Center
  ];

  for (const candidate of verticalCandidates) {
      if (Math.abs(candidate - nodeBounds.x) < distance) {
          snappedX = candidate;
          verticalLine = { x: candidate };
          break;
      }
      if (Math.abs(candidate - (nodeBounds.x + nodeBounds.width)) < distance) {
          snappedX = candidate - nodeBounds.width;
          verticalLine = { x: candidate };
          break;
      }
      if (Math.abs(candidate - (nodeBounds.x + nodeBounds.width / 2)) < distance) {
          snappedX = candidate - nodeBounds.width / 2;
          verticalLine = { x: candidate };
          break;
      }
  }

  // Check horizontal snaps
  for (const candidate of horizontalCandidates) {
      if (Math.abs(candidate - nodeBounds.y) < distance) {
          snappedY = candidate;
          horizontalLine = { y: candidate };
          break;
      }
      if (Math.abs(candidate - (nodeBounds.y + nodeBounds.height)) < distance) {
          snappedY = candidate - nodeBounds.height;
          horizontalLine = { y: candidate };
          break;
      }
      if (Math.abs(candidate - (nodeBounds.y + nodeBounds.height / 2)) < distance) {
          snappedY = candidate - nodeBounds.height / 2;
          horizontalLine = { y: candidate };
          break;
      }
  }

  return {
    horizontal: horizontalLine,
    vertical: verticalLine,
    snappedPosition: { x: snappedX, y: snappedY },
  };
}
