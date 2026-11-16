import { useState } from 'react';
import { browserComputePathBoundingBox } from '../editor/svg-bbox';

interface PathPreviewProps {
  path: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export function PathPreview({
  path,
  x,
  y,
  width,
  height,
  fillColor = '#000000',
  strokeColor,
  strokeWidth,
}: PathPreviewProps) {
  const [bbox] = useState(() =>
    x === undefined || y === undefined || width === undefined || height === undefined
      ? browserComputePathBoundingBox(path)
      : null,
  );

  // When the caller provides a viewBox (the export dialog), follow its values
  // so editing the fields updates the preview immediately. Otherwise use the
  // bounding box computed when the dialog was opened.
  const viewport = {
    x: x ?? bbox?.x ?? 0,
    y: y ?? bbox?.y ?? 0,
    width: width ?? bbox?.width ?? 0,
    height: height ?? bbox?.height ?? 0,
  };

  const patternScale = Math.max(viewport.width / 400, viewport.height / 400);

  return (
    <svg
      viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
      width="300"
      height="300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <pattern
        id="preview-pattern"
        x="0"
        y="0"
        width="16"
        height="16"
        patternUnits="userSpaceOnUse"
        patternTransform={`scale(${patternScale})`}
      >
        <rect x="0" y="0" width="16" height="16" fill="white" />
        <rect x="0" y="0" width="8" height="8" fill="#cccccc" />
        <rect x="8" y="8" width="8" height="8" fill="#cccccc" />
      </pattern>
      <clipPath id="preview-clippath">
        <rect x={viewport.x} y={viewport.y} width={viewport.width} height={viewport.height} />
      </clipPath>
      <rect
        x={viewport.x}
        y={viewport.y}
        width={viewport.width}
        height={viewport.height}
        fill="url(#preview-pattern)"
      />
      <path
        d={path}
        fill={fillColor || 'none'}
        strokeWidth={strokeWidth}
        stroke={strokeColor || 'none'}
        clipPath="url(#preview-clippath)"
      />
    </svg>
  );
}
