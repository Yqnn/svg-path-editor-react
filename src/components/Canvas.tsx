import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { SvgControlPoint, SvgPoint } from '../lib/svg';
import { useStore } from '../editor/EditorProvider';

function round(value: number): number {
  return Math.round(value * 1e10) / 1e10;
}

export function Canvas() {
  const store = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const wheelBuffer = useRef<WheelEvent[]>([]);
  const wheelTimer = useRef<number | null>(null);

  const { cfg, renderPath, targetPoints, controlPoints, images, strokeWidth } = store;
  const preview = cfg.preview;
  const filled = cfg.filled;
  const showTicks = cfg.showTicks;

  // Initial sizing / zoom, mirroring the original `afterNextRender` hooks.
  useLayoutEffect(() => {
    store.attachCanvas(svgRef.current);
    store.refreshCanvasSize();
    store.zoomAuto();
    return () => store.attachCanvas(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      store.refreshCanvasSize();
    };
    window.addEventListener('resize', onResize);
    const parent = svgRef.current?.parentElement;
    let observer: ResizeObserver | undefined;
    if (parent && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => store.refreshCanvasSize());
      observer.observe(parent);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const findPoint = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return null;
      }
      const element = target.closest('[data-point-kind]');
      if (!element) {
        return null;
      }
      const kind = element.getAttribute('data-point-kind');
      const index = Number(element.getAttribute('data-point-index'));
      const point: SvgPoint | SvgControlPoint | undefined =
        kind === 'target' ? store.targetPoints[index] : store.controlPoints[index];
      return point ?? null;
    };

    const findImage = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return null;
      }
      const element = target.closest('[data-image-index]');
      if (!element) {
        return null;
      }
      const index = Number(element.getAttribute('data-image-index'));
      const drag = Number(element.getAttribute('data-image-drag'));
      const image = store.images[index];
      return image ? { image, drag } : null;
    };

    const startInteraction = (event: MouseEvent | TouchEvent) => {
      const point = findPoint(event.target);
      if (point) {
        store.startDrag(point);
        event.stopPropagation();
        return true;
      }
      const image = findImage(event.target);
      if (image) {
        store.startDragImage(event, image.image, image.drag);
        event.stopPropagation();
        return true;
      }
      store.startDragCanvas(event);
      event.stopPropagation();
      return false;
    };

    const onMouseDown = (event: MouseEvent) => {
      startInteraction(event);
    };
    const onMouseMove = (event: MouseEvent) => {
      store.drag(event);
    };
    const onMouseUp = () => {
      store.stopDrag();
    };
    const onTouchStart = (event: TouchEvent) => {
      startInteraction(event);
      event.preventDefault();
    };
    const onTouchMove = (event: TouchEvent) => {
      store.drag(event);
    };
    const onTouchEnd = () => {
      store.stopDrag();
    };
    const onWheel = (event: WheelEvent) => {
      wheelBuffer.current.push(event);
      if (wheelTimer.current === null) {
        wheelTimer.current = window.setTimeout(() => {
          wheelTimer.current = null;
          const events = wheelBuffer.current;
          wheelBuffer.current = [];
          if (events.length === 0) {
            return;
          }
          const cap = (val: number, max: number) => (val > max ? max : val < -max ? -max : val);
          const deltaY = events.reduce((acc, cur) => acc + cap(cur.deltaY, 50), 0);
          store.mousewheel({ event: events[0], deltaY });
        }, 20);
      }
    };
    const onClick = () => {
      store.setHoveredItem(null);
    };

    svg.addEventListener('mousedown', onMouseDown);
    svg.addEventListener('mousemove', onMouseMove);
    svg.addEventListener('mouseup', onMouseUp);
    svg.addEventListener('touchstart', onTouchStart, { passive: false });
    svg.addEventListener('touchmove', onTouchMove, { passive: false });
    svg.addEventListener('touchend', onTouchEnd);
    svg.addEventListener('wheel', onWheel, { passive: true });
    svg.addEventListener('click', onClick);

    return () => {
      svg.removeEventListener('mousedown', onMouseDown);
      svg.removeEventListener('mousemove', onMouseMove);
      svg.removeEventListener('mouseup', onMouseUp);
      svg.removeEventListener('touchstart', onTouchStart);
      svg.removeEventListener('touchmove', onTouchMove);
      svg.removeEventListener('touchend', onTouchEnd);
      svg.removeEventListener('wheel', onWheel);
      svg.removeEventListener('click', onClick);
      if (wheelTimer.current !== null) {
        clearTimeout(wheelTimer.current);
        wheelTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grid = useMemo(() => {
    const minPx = 10;
    const raw = store.canvasWidth > 0 ? (minPx * cfg.viewPortWidth) / store.canvasWidth : 1;
    const e = Math.ceil(Math.log10(Math.max(raw, 1e-10)));

    let step = Math.pow(10, Math.max(e, -4));
    if (!showTicks) {
      step = Math.max(step, 1);
    }
    const safeCount = (size: number, stepSize: number) =>
      Number.isFinite(size) && stepSize > 0 ? Math.ceil(size / stepSize) + 2 : 0;
    const xStart = Math.floor(cfg.viewPortX / step) * step;
    const xCount = safeCount(cfg.viewPortWidth, step);
    const xGrid = Array.from({ length: xCount }, (_, i) => round(xStart + i * step));
    const yStart = Math.floor(cfg.viewPortY / step) * step;
    const yCount = safeCount(cfg.viewPortHeight, step);
    const yGrid = Array.from({ length: yCount }, (_, i) => round(yStart + i * step));

    let xGridSecondary: number[] = [];
    let yGridSecondary: number[] = [];
    if (showTicks) {
      const secStep = (step < 1 ? 10 : 5) * step;
      const xSecStart = Math.floor(cfg.viewPortX / secStep) * secStep;
      const xSecCount = safeCount(cfg.viewPortWidth, secStep);
      xGridSecondary = Array.from({ length: xSecCount }, (_, i) => round(xSecStart + i * secStep));
      const ySecStart = Math.floor(cfg.viewPortY / secStep) * secStep;
      const ySecCount = safeCount(cfg.viewPortHeight, secStep);
      yGridSecondary = Array.from({ length: ySecCount }, (_, i) => round(ySecStart + i * secStep));
    }
    return { xGrid, yGrid, xGridSecondary, yGridSecondary };
  }, [
    cfg.viewPortX,
    cfg.viewPortY,
    cfg.viewPortWidth,
    cfg.viewPortHeight,
    showTicks,
    store.canvasWidth,
  ]);

  const hoveredItem = store.hoveredItem;
  const focusedItem = store.focusedItem;
  const draggedPoint = store.draggedPoint;
  const focusedImage = store.focusedImage;
  const editImages = store.isEditingImages;

  const gridElements = useMemo(
    () => (
      <>
        {grid.xGrid.map((x, index) => (
          <rect
            key={`x-${index}`}
            className="grid"
            x={x - 0.5 * strokeWidth}
            y={cfg.viewPortY}
            width={strokeWidth}
            height={cfg.viewPortHeight}
          />
        ))}
        {grid.yGrid.map((y, index) => (
          <rect
            key={`y-${index}`}
            className="grid"
            x={cfg.viewPortX}
            y={y - 0.5 * strokeWidth}
            width={cfg.viewPortWidth}
            height={strokeWidth}
          />
        ))}
        {grid.xGridSecondary.map((x, index) => (
          <rect
            key={`xs-${index}`}
            className="grid tick"
            x={x - 0.5 * strokeWidth}
            y={cfg.viewPortY}
            width={strokeWidth}
            height={cfg.viewPortHeight}
            strokeWidth={strokeWidth}
          />
        ))}
        {grid.yGridSecondary.map((y, index) => (
          <rect
            key={`ys-${index}`}
            className="grid tick"
            x={cfg.viewPortX}
            y={y - 0.5 * strokeWidth}
            width={cfg.viewPortWidth}
            height={strokeWidth}
            strokeWidth={strokeWidth}
          />
        ))}
        <rect
          className={showTicks ? 'grid tick' : 'grid'}
          x={cfg.viewPortX}
          y={-2 * strokeWidth}
          width={cfg.viewPortWidth}
          height={4 * strokeWidth}
        />
        <rect
          className={showTicks ? 'grid tick' : 'grid'}
          x={-2 * strokeWidth}
          y={cfg.viewPortY}
          width={4 * strokeWidth}
          height={cfg.viewPortHeight}
        />
        {!preview && showTicks ? (
          <>
            {grid.yGridSecondary.map((y, index) => (
              <text
                key={`yt-${index}`}
                className="tick"
                x={-4 * strokeWidth}
                y={y - 4 * strokeWidth}
                style={{ fontSize: `${strokeWidth * 14}px` }}
              >
                {y}
              </text>
            ))}
            {grid.xGridSecondary.map((x, index) =>
              x !== 0 ? (
                <text
                  key={`xt-${index}`}
                  className="tick"
                  x={x - 4 * strokeWidth}
                  y={-4 * strokeWidth}
                  style={{ fontSize: `${strokeWidth * 14}px` }}
                >
                  {x}
                </text>
              ) : null,
            )}
          </>
        ) : null}
      </>
    ),
    // The grid only depends on the viewport and tick settings.
    [
      grid,
      cfg.viewPortX,
      cfg.viewPortY,
      cfg.viewPortWidth,
      cfg.viewPortHeight,
      strokeWidth,
      showTicks,
      preview,
    ],
  );

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${cfg.viewPortX} ${cfg.viewPortY} ${cfg.viewPortWidth} ${cfg.viewPortHeight}`}
      className={preview ? 'canvas-svg preview' : 'canvas-svg'}
    >
      {strokeWidth ? (
        <>
          {gridElements}
          {!preview
            ? images.map((im, index) => (
                <image
                  key={index}
                  href={im.data}
                  x={Math.min(im.x1, im.x2)}
                  y={Math.min(im.y1, im.y2)}
                  width={Math.abs(im.x2 - im.x1)}
                  height={Math.abs(im.y1 - im.y2)}
                  preserveAspectRatio={im.preserveAspectRatio ? 'xMidYMid meet' : 'none'}
                  style={{ opacity: im.opacity }}
                />
              ))
            : null}
          <path
            className={filled ? 'filled' : undefined}
            d={renderPath}
            strokeWidth={strokeWidth}
          />
          {!editImages ? (
            <>
              {controlPoints.map((loc, index) =>
                loc.relations.map((rel, relIndex) => (
                  <line
                    key={`c-${index}-${relIndex}`}
                    className="control"
                    x1={loc.x}
                    y1={loc.y}
                    x2={rel.x}
                    y2={rel.y}
                    strokeWidth={strokeWidth}
                  />
                )),
              )}
              {hoveredItem && !draggedPoint && !preview ? (
                <path
                  d={hoveredItem.asStandaloneString()}
                  strokeWidth={strokeWidth}
                  className="hovered"
                />
              ) : null}
              {focusedItem && !preview ? (
                <path
                  d={focusedItem.asStandaloneString()}
                  strokeWidth={strokeWidth}
                  className="dragged"
                />
              ) : null}
              {targetPoints.map((loc, index) =>
                loc.movable ? (
                  <circle
                    key={`t-${index}`}
                    className={`target${
                      loc.itemReference === hoveredItem && !draggedPoint ? ' hovered' : ''
                    }${loc.itemReference === focusedItem ? ' dragged' : ''}`}
                    cx={loc.x}
                    cy={loc.y}
                    r={3 * strokeWidth}
                    strokeWidth={12 * strokeWidth}
                    data-point-kind="target"
                    data-point-index={index}
                    onMouseEnter={() => store.setHoveredItem(loc.itemReference)}
                    onMouseLeave={() => store.setHoveredItem(null)}
                  />
                ) : null,
              )}
              {controlPoints.map((loc, index) =>
                loc.movable ? (
                  <circle
                    key={`cc-${index}`}
                    className={`control${
                      loc.itemReference === hoveredItem && !draggedPoint ? ' hovered' : ''
                    }${loc.itemReference === focusedItem ? ' dragged' : ''}`}
                    cx={loc.x}
                    cy={loc.y}
                    r={3 * strokeWidth}
                    strokeWidth={12 * strokeWidth}
                    data-point-kind="control"
                    data-point-index={index}
                    onMouseEnter={() => store.setHoveredItem(loc.itemReference)}
                    onMouseLeave={() => store.setHoveredItem(null)}
                  />
                ) : null,
              )}
            </>
          ) : null}
          {editImages && !preview
            ? images.map((im, index) => (
                <g
                  key={`image-${index}`}
                  className={im === focusedImage ? 'focused-image' : undefined}
                >
                  <rect
                    className="image-control move"
                    x={Math.min(im.x1, im.x2)}
                    y={Math.min(im.y1, im.y2)}
                    width={Math.abs(im.x2 - im.x1)}
                    height={Math.abs(im.y1 - im.y2)}
                    data-image-index={index}
                    data-image-drag={1 + 2 + 4 + 8}
                  />
                  <line
                    className="image-control vertical"
                    x1={im.x1}
                    y1={im.y1}
                    x2={im.x1}
                    y2={im.y2}
                    strokeWidth={6 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={1}
                  />
                  <line
                    className="image-control horizontal"
                    x1={im.x1}
                    y1={im.y1}
                    x2={im.x2}
                    y2={im.y1}
                    strokeWidth={6 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={2}
                  />
                  <line
                    className="image-control horizontal"
                    x1={im.x1}
                    y1={im.y2}
                    x2={im.x2}
                    y2={im.y2}
                    strokeWidth={6 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={8}
                  />
                  <line
                    className="image-control vertical"
                    x1={im.x2}
                    y1={im.y1}
                    x2={im.x2}
                    y2={im.y2}
                    strokeWidth={6 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={4}
                  />
                  <circle
                    className="image-control down"
                    cx={im.x1}
                    cy={im.y1}
                    r={3 * strokeWidth}
                    strokeWidth={24 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={1 + 2}
                  />
                  <circle
                    className="image-control up"
                    cx={im.x2}
                    cy={im.y1}
                    r={3 * strokeWidth}
                    strokeWidth={24 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={2 + 4}
                  />
                  <circle
                    className="image-control up"
                    cx={im.x1}
                    cy={im.y2}
                    r={3 * strokeWidth}
                    strokeWidth={24 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={1 + 8}
                  />
                  <circle
                    className="image-control down"
                    cx={im.x2}
                    cy={im.y2}
                    r={3 * strokeWidth}
                    strokeWidth={24 * strokeWidth}
                    data-image-index={index}
                    data-image-drag={4 + 8}
                  />
                </g>
              ))
            : null}
        </>
      ) : null}
    </svg>
  );
}
