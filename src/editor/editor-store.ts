import { Point, SvgPath, SvgControlPoint, SvgItem, SvgPoint, formatNumber } from '../lib/svg';
import type { SvgCommandType, SvgCommandTypeAny } from '../lib/svg-command-types';
import { reversePath } from '../lib/reverse-path';
import { optimizePath } from '../lib/optimize-path';
import { changePathOrigin } from '../lib/change-path-origin';
import { browserComputePathBoundingBox } from './svg-bbox';
import { type Config, type ExportConfig, createConfig, createExportConfig } from './config';
import { Storage } from './storage';
import { kDefaultPath } from './constants/default-path.const';
import type { Image } from './image';
import { canInsertAfterType } from './path-rules';

export type VectorPoint = { x: number; y: number };
export type CursorPosition = Point & { decimals?: number };

type Listener = () => void;

/**
 * Central application state. It mirrors the original Angular `App` and `Canvas`
 * components so that behaviour is preserved as closely as possible.
 */
export class EditorStore {
  private readonly listeners = new Set<Listener>();
  private version = 0;
  private notifyScheduled = false;

  readonly cfg: Config = createConfig();
  readonly exportCfg: ExportConfig = createExportConfig();
  readonly storage = new Storage();

  // SvgPath path data model:
  parsedPath: SvgPath;
  targetPoints: SvgPoint[] = [];
  controlPoints: SvgControlPoint[] = [];

  // Raw path:
  private _rawPath = '';
  /** Non-minified path string used by the canvas renderer. */
  renderPath = '';
  pathName = '';
  invalidSyntax = false;

  // Undo/redo
  history: string[] = [];
  historyCursor = -1;
  historyDisabled = false;

  // Path operations panel inputs:
  scaleX = 1;
  scaleY = 1;
  translateX = 0;
  translateY = 0;
  rotateX = 0;
  rotateY = 0;
  rotateAngle = 0;
  roundValuesDecimals = 1;

  // Canvas data:
  svgElement: SVGSVGElement | null = null;
  canvasWidth = 100;
  canvasHeight = 100;
  strokeWidth = 1;

  // Dragged & hovered elements
  draggedPoint: SvgPoint | null = null;
  focusedItem: SvgItem | null = null;
  hoveredItem: SvgItem | null = null;
  wasCanvasDragged = false;
  draggedIsNew = false;
  dragging = false;
  cursorPosition?: CursorPosition;
  hoverPosition?: VectorPoint;

  // Images
  images: Image[] = [];
  focusedImage: Image | null = null;

  // UI state
  isLeftPanelOpened = true;
  isContextualMenuOpened = false;
  isEditingImages = false;

  // Canvas drag internals
  private draggedEvt: MouseEvent | TouchEvent | null = null;
  private dragWithoutClick = true;
  private draggedImage: Image | null = null;
  private draggedImageType = 0;

  constructor() {
    this.parsedPath = new SvgPath('');
    this._rawPath = this.storage.getPath()?.path || kDefaultPath;
    this.reloadPath(this.rawPath, true);
  }

  // ---------------------------------------------------------------------------
  // Store plumbing
  // ---------------------------------------------------------------------------

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): number => this.version;

  /**
   * Coalesces all store changes that happen in the same task into a single
   * notification, like Angular's change detection does after an event. This
   * avoids rendering the whole editor several times for one pointer move
   * (hover position, path, focused item and cursor position are updated in
   * sequence by `drag`).
   */
  emit() {
    this.version++;
    if (this.notifyScheduled) {
      return;
    }
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      for (const listener of this.listeners) {
        listener();
      }
    });
  }

  updateCfg(patch: Partial<Config>) {
    Object.assign(this.cfg, patch);
    this.emit();
  }

  updateExportCfg(patch: Partial<ExportConfig>) {
    Object.assign(this.exportCfg, patch);
    this.emit();
  }

  // ---------------------------------------------------------------------------
  // Raw path, history
  // ---------------------------------------------------------------------------

  get rawPath(): string {
    return this._rawPath;
  }

  set rawPath(value: string) {
    this._rawPath = value;
    this.pushHistory();
    this.emit();
  }

  get decimals() {
    return this.cfg.snapToGrid ? 0 : this.cfg.decimalPrecision;
  }

  setIsDragging(dragging: boolean) {
    this.dragging = dragging;
    this.setHistoryDisabled(dragging);
    if (!dragging) {
      this.draggedIsNew = false;
    }
    this.emit();
  }

  setCursorPosition(position?: CursorPosition) {
    this.cursorPosition = position;
    this.emit();
  }

  setHoverPosition(position?: VectorPoint) {
    this.hoverPosition = position;
    this.emit();
  }

  setHistoryDisabled(value: boolean) {
    this.historyDisabled = value;
    if (!value) {
      this.pushHistory();
    }
    this.emit();
  }

  pushHistory() {
    if (!this.historyDisabled && this.rawPath !== this.history[this.historyCursor]) {
      this.historyCursor++;
      this.history.splice(
        this.historyCursor,
        this.history.length - this.historyCursor,
        this.rawPath,
      );
      this.storage.addPath(null, this.rawPath);
      this.emit();
    }
  }

  canUndo(): boolean {
    return this.historyCursor > 0 && !this.isEditingImages;
  }

  undo() {
    if (this.canUndo()) {
      this.historyDisabled = true;
      this.historyCursor--;
      this.reloadPath(this.history[this.historyCursor]);
      this.historyDisabled = false;
      this.emit();
    }
  }

  canRedo(): boolean {
    return this.historyCursor < this.history.length - 1 && !this.isEditingImages;
  }

  redo() {
    if (this.canRedo()) {
      this.historyDisabled = true;
      this.historyCursor++;
      this.reloadPath(this.history[this.historyCursor]);
      this.historyDisabled = false;
      this.emit();
    }
  }

  // ---------------------------------------------------------------------------
  // Viewport
  // ---------------------------------------------------------------------------

  updateViewPort(x: number, y: number, w: number | null, h: number | null, force = false) {
    if (!force && this.cfg.viewPortLocked) {
      return;
    }
    if (w === null && h !== null) {
      w = (this.canvasWidth * h) / this.canvasHeight;
    }
    if (h === null && w !== null) {
      h = (this.canvasHeight * w) / this.canvasWidth;
    }
    if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h)) {
      return;
    }

    this.cfg.viewPortX = parseFloat((1 * x).toPrecision(6));
    this.cfg.viewPortY = parseFloat((1 * y).toPrecision(6));
    this.cfg.viewPortWidth = parseFloat((1 * w).toPrecision(4));
    this.cfg.viewPortHeight = parseFloat((1 * h).toPrecision(4));
    this.strokeWidth = this.cfg.viewPortWidth / this.canvasWidth;
    this.emit();
  }

  zoomAuto() {
    if (this.cfg.viewPortLocked) {
      return;
    }
    const bbox = browserComputePathBoundingBox(this.rawPath);

    const k = this.canvasHeight / this.canvasWidth;
    let w = bbox.width + 2;
    let h = bbox.height + 2;
    if (k < h / w) {
      w = h / k;
    } else {
      h = k * w;
    }

    this.updateViewPort(bbox.x - 1, bbox.y - 1, w, h);
  }

  attachCanvas(element: SVGSVGElement | null) {
    this.svgElement = element;
  }

  refreshCanvasSize() {
    const parent = this.svgElement?.parentElement;
    if (!parent) {
      return;
    }
    const rect = parent.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    this.updateViewPort(this.cfg.viewPortX, this.cfg.viewPortY, this.cfg.viewPortWidth, null, true);
  }

  zoomViewPort(scale: number, pt?: VectorPoint) {
    if (!pt) {
      pt = {
        x: this.cfg.viewPortX + 0.5 * this.cfg.viewPortWidth,
        y: this.cfg.viewPortY + 0.5 * this.cfg.viewPortHeight,
      };
    }
    const w = scale * this.cfg.viewPortWidth;
    const h = scale * this.cfg.viewPortHeight;
    const x =
      this.cfg.viewPortX + (pt.x - this.cfg.viewPortX - scale * (pt.x - this.cfg.viewPortX));
    const y =
      this.cfg.viewPortY + (pt.y - this.cfg.viewPortY - scale * (pt.y - this.cfg.viewPortY));

    this.updateViewPort(x, y, w, h);
  }

  eventToLocation(event: MouseEvent | TouchEvent, idx = 0): VectorPoint {
    const element = this.svgElement;
    if (!element) {
      return { x: 0, y: 0 };
    }
    const rect = element.getBoundingClientRect();
    const touch = event instanceof MouseEvent ? event : event.touches[idx];
    const x = this.cfg.viewPortX + (touch.clientX - rect.left) * this.strokeWidth;
    const y = this.cfg.viewPortY + (touch.clientY - rect.top) * this.strokeWidth;
    return { x, y };
  }

  private pinchToZoom(previousEvent: MouseEvent | TouchEvent, event: MouseEvent | TouchEvent) {
    if (
      window.TouchEvent &&
      previousEvent instanceof TouchEvent &&
      event instanceof TouchEvent &&
      previousEvent.touches.length >= 2 &&
      event.touches.length >= 2
    ) {
      const pt = this.eventToLocation(event, 0);
      const pt2 = this.eventToLocation(event, 1);
      const oriPt = this.eventToLocation(previousEvent, 0);
      const oriPt2 = this.eventToLocation(previousEvent, 1);
      const ptm = { x: 0.5 * (pt.x + pt2.x), y: 0.5 * (pt.y + pt2.y) };
      const oriPtm = { x: 0.5 * (oriPt.x + oriPt2.x), y: 0.5 * (oriPt.y + oriPt2.y) };
      const delta = { x: oriPtm.x - ptm.x, y: oriPtm.y - ptm.y };
      const k =
        Math.sqrt(
          (oriPt.x - oriPt2.x) * (oriPt.x - oriPt2.x) + (oriPt.y - oriPt2.y) * (oriPt.y - oriPt2.y),
        ) / Math.sqrt((pt.x - pt2.x) * (pt.x - pt2.x) + (pt.y - pt2.y) * (pt.y - pt2.y));
      return { zoom: k, delta, center: ptm };
    }
    return null;
  }

  mousewheel(event: { event: WheelEvent; deltaY: number }) {
    const scale = Math.pow(1.005, event.deltaY);
    const pt = this.eventToLocation(event.event);

    this.zoomViewPort(scale, pt);
  }

  // ---------------------------------------------------------------------------
  // Path operations
  // ---------------------------------------------------------------------------

  insert(type: SvgCommandTypeAny, after: SvgItem | null, convert: boolean) {
    if (convert) {
      if (after) {
        this.focusedItem = this.parsedPath.changeType(
          after,
          after.relative ? (type.toLowerCase() as SvgCommandTypeAny) : type,
        );
        this.afterModelChange();
      }
    } else {
      this.draggedIsNew = true;
      const pts = this.targetPoints;
      let point1: Point;

      let newItem: SvgItem | null = null;
      if (after) {
        point1 = after.targetLocation();
      } else if (pts.length === 0) {
        newItem = SvgItem.Make(['M', '0', '0']);
        this.parsedPath.insert(newItem);
        point1 = new Point(0, 0);
      } else {
        point1 = pts[pts.length - 1];
      }

      if (type.toLowerCase() !== 'm' || !newItem) {
        const relative = type.toLowerCase() === type;
        const X = (relative ? 0 : point1.x).toString();
        const Y = (relative ? 0 : point1.y).toString();
        switch (type.toLocaleLowerCase()) {
          case 'm':
          case 'l':
          case 't':
            newItem = SvgItem.Make([type, X, Y]);
            break;
          case 'h':
            newItem = SvgItem.Make([type, X]);
            break;
          case 'v':
            newItem = SvgItem.Make([type, Y]);
            break;
          case 's':
          case 'q':
            newItem = SvgItem.Make([type, X, Y, X, Y]);
            break;
          case 'c':
            newItem = SvgItem.Make([type, X, Y, X, Y, X, Y]);
            break;
          case 'a':
            newItem = SvgItem.Make([type, '1', '1', '0', '0', '0', X, Y]);
            break;
          case 'z':
            newItem = SvgItem.Make([type]);
        }
        if (newItem) {
          this.parsedPath.insert(newItem, after ?? undefined);
        }
      }
      this.setHistoryDisabled(true);
      this.afterModelChange();

      if (newItem) {
        this.focusedItem = newItem;
        const target = newItem.targetLocation();
        this.draggedPoint = target;
        // Mirror the Canvas `ngOnChanges` behaviour: the newly inserted point
        // immediately enters drag mode and follows the mouse until clicked.
        this.setIsDragging(true);
        this.setCursorPosition({ ...target, decimals: this.decimals });
        this.emit();
      }
    }
  }

  scale(x: number, y: number) {
    this.parsedPath.scale(1 * x, 1 * y);
    this.scaleX = 1;
    this.scaleY = 1;
    this.afterModelChange();
  }

  translate(x: number, y: number) {
    this.parsedPath.translate(1 * x, 1 * y);
    this.translateX = 0;
    this.translateY = 0;
    this.afterModelChange();
  }

  rotate(x: number, y: number, angle: number) {
    this.parsedPath.rotate(1 * x, 1 * y, 1 * angle);
    this.afterModelChange();
  }

  setRelative(rel: boolean) {
    this.parsedPath.setRelative(rel);
    this.afterModelChange();
  }

  reverse() {
    reversePath(this.parsedPath);
    this.afterModelChange();
  }

  optimize() {
    optimizePath(this.parsedPath, {
      removeUselessCommands: true,
      useHorizontalAndVerticalLines: true,
      useRelativeAbsolute: true,
      useReverse: true,
      useShorthands: true,
    });
    this.cfg.minifyOutput = true;
    this.afterModelChange();
  }

  setValue(item: SvgItem, idx: number, val: number) {
    if (!isNaN(val)) {
      item.values[idx] = val;
      this.parsedPath.refreshAbsolutePositions();
      this.afterModelChange();
    }
  }

  delete(item: SvgItem) {
    this.focusedItem = null;
    this.parsedPath.delete(item);
    this.afterModelChange();
  }

  useAsOrigin(item: SvgItem, subpathOnly?: boolean) {
    const idx = this.parsedPath.path.indexOf(item);
    changePathOrigin(this.parsedPath, idx, subpathOnly);
    this.afterModelChange();
    this.focusedItem = null;
    this.emit();
  }

  reverseSubPath(item: SvgItem) {
    const idx = this.parsedPath.path.indexOf(item);
    reversePath(this.parsedPath, idx);
    this.afterModelChange();
    this.focusedItem = null;
    this.emit();
  }

  afterModelChange() {
    this.reloadPoints();
    this.renderPath = this.parsedPath.asString(4, false);
    this.rawPath = this.cfg.minifyOutput ? this.parsedPath.asString(4, true) : this.renderPath;
    if (this.focusedItem && this.parsedPath.path.indexOf(this.focusedItem) === -1) {
      this.focusedItem = null;
    }
    this.emit();
  }

  roundValues(decimals: number) {
    this.reloadPath(this.parsedPath.asString(decimals, this.cfg.minifyOutput));
  }

  canDelete(item: SvgItem): boolean {
    const idx = this.parsedPath.path.indexOf(item);
    return idx > 0;
  }

  canInsertAfter(item: SvgItem | null, type: SvgCommandType): boolean {
    let previousType: SvgCommandType | null = null;
    if (item !== null) {
      previousType = item.getType().toUpperCase() as SvgCommandType;
    } else if (this.parsedPath.path.length > 0) {
      previousType = this.parsedPath.path[this.parsedPath.path.length - 1]
        .getType()
        .toUpperCase() as SvgCommandType;
    }
    return canInsertAfterType(previousType, type);
  }

  canConvert(item: SvgItem, to: SvgCommandType): boolean {
    const idx = this.parsedPath.path.indexOf(item);
    if (idx === 0) {
      return false;
    }
    if (idx > 0) {
      return this.canInsertAfter(this.parsedPath.path[idx - 1], to);
    }
    return false;
  }

  canUseAsOrigin(item: SvgItem): boolean {
    return item.getType().toUpperCase() !== 'Z' && this.parsedPath.path.indexOf(item) > 1;
  }

  hasSubPaths(): boolean {
    let moveCount = 0;
    for (const command of this.parsedPath.path) {
      if (command.getType(true) === 'M') {
        moveCount++;
        if (moveCount == 2) {
          return true;
        }
      }
    }
    return false;
  }

  getTooltip(item: SvgItem, idx: number): string {
    const labels: Record<SvgCommandTypeAny, string[]> = {
      M: ['x', 'y'],
      m: ['dx', 'dy'],
      L: ['x', 'y'],
      l: ['dx', 'dy'],
      V: ['y'],
      v: ['dy'],
      H: ['x'],
      h: ['dx'],
      C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
      c: ['dx1', 'dy1', 'dx2', 'dy2', 'dx', 'dy'],
      S: ['x2', 'y2', 'x', 'y'],
      s: ['dx2', 'dy2', 'dx', 'dy'],
      Q: ['x1', 'y1', 'x', 'y'],
      q: ['dx1', 'dy1', 'dx', 'dy'],
      T: ['x', 'y'],
      t: ['dx', 'dy'],
      A: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'x', 'y'],
      a: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'dx', 'dy'],
      Z: [],
      z: [],
    };
    const commandType = item.getType() as SvgCommandTypeAny;
    return labels[commandType][idx];
  }

  openPath(newPath: string, name: string): void {
    this.pathName = name;
    this.history = [];
    this.historyCursor = -1;
    this.reloadPath(newPath, true);
  }

  reloadPath(newPath: string, autozoom = false): void {
    this.hoveredItem = null;
    this.focusedItem = null;
    this.rawPath = newPath;
    this.invalidSyntax = false;
    try {
      this.parsedPath = new SvgPath(this.rawPath);
      this.renderPath = this.parsedPath.asString(4, false);
      this.reloadPoints();
      if (autozoom) {
        this.zoomAuto();
      }
    } catch {
      this.invalidSyntax = true;
      if (!this.parsedPath) {
        this.parsedPath = new SvgPath('');
      }
    }
    this.emit();
  }

  reloadPoints(): void {
    this.targetPoints = this.parsedPath.targetLocations();
    this.controlPoints = this.parsedPath.controlLocations();
  }

  setPathName(name: string) {
    this.pathName = name;
    this.emit();
  }

  setNumberField(
    key:
      | 'scaleX'
      | 'scaleY'
      | 'translateX'
      | 'translateY'
      | 'rotateX'
      | 'rotateY'
      | 'rotateAngle'
      | 'roundValuesDecimals',
    value: number,
  ) {
    this[key] = value;
    this.emit();
  }

  toggleLeftPanel(): void {
    this.isLeftPanelOpened = !this.isLeftPanelOpened;
    this.emit();
  }

  setContextualMenuOpened(opened: boolean) {
    this.isContextualMenuOpened = opened;
    this.emit();
  }

  // ---------------------------------------------------------------------------
  // Focus / hover
  // ---------------------------------------------------------------------------

  setFocusedItem(item: SvgItem | null) {
    this.focusedItem = item;
    this.emit();
  }

  focusItem(it: SvgItem | null): void {
    if (it !== this.focusedItem) {
      this.focusedItem = it;
      this.emit();
      if (it) {
        const idx = this.parsedPath.path.indexOf(it);
        const el = document.getElementById(`svg_command_row_${idx}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  setHoveredItem(item: SvgItem | null) {
    this.hoveredItem = item;
    this.emit();
  }

  // ---------------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------------

  deleteImage(image: Image): void {
    this.images.splice(this.images.indexOf(image), 1);
    this.focusedImage = null;
    this.emit();
  }

  addImage(newImage: Image): void {
    this.focusedImage = newImage;
    this.images.push(newImage);
    this.emit();
  }

  updateImage(image: Image, patch: Partial<Image>): void {
    Object.assign(image, patch);
    this.emit();
  }

  cancelAddImage(): void {
    if (this.images.length === 0) {
      this.isEditingImages = false;
      this.focusedImage = null;
      this.emit();
    }
  }

  toggleImageEditing(): boolean {
    this.isEditingImages = !this.isEditingImages;
    this.focusedImage = null;
    this.focusedItem = null;
    this.emit();
    return this.isEditingImages && this.images.length === 0;
  }

  setFocusedImage(image: Image | null) {
    this.focusedImage = image;
    this.emit();
  }

  // ---------------------------------------------------------------------------
  // Canvas interactions
  // ---------------------------------------------------------------------------

  startDrag(item: SvgPoint) {
    if (item !== this.draggedPoint) {
      this.dragWithoutClick = false;
    }

    this.setIsDragging(true);
    this.setCursorPosition({ ...item, decimals: this.decimals });

    if (item.itemReference.getType().toLowerCase() === 'z') {
      return;
    }
    this.focusItem(item.itemReference);
    this.draggedPoint = item;
    this.emit();
  }

  startDragCanvas(event: MouseEvent | TouchEvent) {
    this.draggedEvt = event;
    this.wasCanvasDragged = false;
    this.dragWithoutClick = false;
    this.emit();
  }

  startDragImage(event: MouseEvent | TouchEvent, im: Image, type: number): void {
    this.setIsDragging(true);
    this.draggedEvt = event;
    this.draggedImage = im;
    this.draggedImageType = type;
    this.focusedImage = im;
    this.emit();
  }

  stopDrag() {
    if (this.draggedPoint && this.draggedEvt) {
      this.drag(this.draggedEvt);
    }
    this.setIsDragging(false);

    if (!this.draggedPoint && !this.wasCanvasDragged) {
      // unselect action
      this.focusedItem = null;
      this.setCursorPosition(undefined);
    }
    if (!this.draggedImage && !this.wasCanvasDragged) {
      this.focusedImage = null;
    }

    this.draggedPoint = null;
    this.draggedEvt = null;
    this.dragWithoutClick = true;

    this.draggedImage = null;
    this.emit();
  }

  drag(event: MouseEvent | TouchEvent) {
    const pt = this.eventToLocation(event);
    this.setHoverPosition(pt);

    if (this.draggedPoint || this.draggedEvt || this.draggedImage) {
      if (!this.dragWithoutClick && event instanceof MouseEvent && event.buttons === 0) {
        // Stop dragging if click is not maintained anymore.
        this.stopDrag();
        return;
      }

      event.stopPropagation();
      if (this.draggedImage && this.draggedEvt) {
        const oriPt = this.eventToLocation(this.draggedEvt);
        if (this.draggedImageType & 0b0001) {
          this.draggedImage.x1 += pt.x - oriPt.x;
        }
        if (this.draggedImageType & 0b0010) {
          this.draggedImage.y1 += pt.y - oriPt.y;
        }
        if (this.draggedImageType & 0b0100) {
          this.draggedImage.x2 += pt.x - oriPt.x;
        }
        if (this.draggedImageType & 0b1000) {
          this.draggedImage.y2 += pt.y - oriPt.y;
        }
        this.draggedEvt = event;
        this.emit();
      } else if (this.draggedPoint) {
        const draggedPoint = this.draggedPoint;
        const parsedPath = this.parsedPath;
        const decimals = event.ctrlKey ? (this.decimals ? 0 : 3) : this.decimals;
        pt.x = parseFloat(pt.x.toFixed(decimals));
        pt.y = parseFloat(pt.y.toFixed(decimals));
        parsedPath.setLocation(draggedPoint, pt as Point);
        if (this.draggedIsNew) {
          const previousIdx = parsedPath.path.indexOf(draggedPoint.itemReference) - 1;
          if (previousIdx >= 0) {
            draggedPoint.itemReference.resetControlPoints(parsedPath.path[previousIdx]);
          }
        }
        this.afterModelChange();
        this.draggedEvt = null;
        this.setCursorPosition({ ...pt, decimals });
      } else if (this.draggedEvt) {
        this.wasCanvasDragged = true;
        this.setHoverPosition(undefined);

        const pinchToZoom = this.pinchToZoom(this.draggedEvt, event);
        if (pinchToZoom !== null) {
          const w = pinchToZoom.zoom * this.cfg.viewPortWidth;
          const h = pinchToZoom.zoom * this.cfg.viewPortHeight;
          const x =
            this.cfg.viewPortX +
            pinchToZoom.delta.x +
            (pinchToZoom.center.x - this.cfg.viewPortX) * (1 - pinchToZoom.zoom);
          const y =
            this.cfg.viewPortY +
            pinchToZoom.delta.y +
            (pinchToZoom.center.y - this.cfg.viewPortY) * (1 - pinchToZoom.zoom);
          this.updateViewPort(x, y, w, h);
        } else {
          const oriPt = this.eventToLocation(this.draggedEvt);
          this.updateViewPort(
            this.cfg.viewPortX + (oriPt.x - pt.x),
            this.cfg.viewPortY + (oriPt.y - pt.y),
            this.cfg.viewPortWidth,
            this.cfg.viewPortHeight,
          );
        }
        this.draggedEvt = event;
        this.emit();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers exposed to components
  // ---------------------------------------------------------------------------

  max = Math.max;
  formatNumber = (v: number) => formatNumber(v, 4);
}
