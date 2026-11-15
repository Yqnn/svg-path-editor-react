import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { EditorStore } from './editor-store';
import { kDefaultPath } from './constants/default-path.const';
import type { Image } from './image';

beforeAll(() => {
  // jsdom does not implement SVG geometry APIs.
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      top: 0,
      right: 10,
      bottom: 10,
      left: 0,
      toJSON: () => ({}),
    }),
  });
});

const createStore = () => new EditorStore();

describe('EditorStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads the default path and initializes history', () => {
    const store = createStore();
    expect(store.rawPath).toBe(kDefaultPath);
    expect(store.parsedPath.path).toHaveLength(23);
    expect(store.targetPoints).toHaveLength(23);
    expect(store.history).toEqual([kDefaultPath]);
    expect(store.historyCursor).toBe(0);
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
  });

  it('inserts, undoes and redoes commands', () => {
    const store = createStore();
    const after = store.parsedPath.path[1];
    store.insert('L', after, false);

    expect(store.parsedPath.path).toHaveLength(24);
    expect(store.focusedItem).toBe(store.parsedPath.path[2]);
    expect(store.dragging).toBe(true);
    expect(store.historyDisabled).toBe(true);

    store.setIsDragging(false);
    expect(store.history).toHaveLength(2);
    expect(store.canUndo()).toBe(true);

    store.undo();
    expect(store.parsedPath.path).toHaveLength(23);
    expect(store.rawPath).toBe(kDefaultPath);

    store.redo();
    expect(store.parsedPath.path).toHaveLength(24);
  });

  it('deletes and updates commands', () => {
    const store = createStore();
    store.delete(store.parsedPath.path[1]);
    expect(store.parsedPath.path).toHaveLength(22);

    const item = store.parsedPath.path[1];
    store.setValue(item, 0, 99);
    expect(item.values[0]).toBe(99);
    expect(store.rawPath.startsWith('M 4 8 L 99')).toBe(true);
  });

  it('converts command types', () => {
    const store = createStore();
    const item = store.parsedPath.path[2];
    store.insert('C', item, true);
    expect(store.parsedPath.path[2].getType(true)).toBe('C');
    expect(store.focusedItem).toBe(store.parsedPath.path[2]);
  });

  it('computes insertion and conversion capabilities', () => {
    const store = createStore();
    const first = store.parsedPath.path[0];
    const second = store.parsedPath.path[1];
    expect(store.canInsertAfter(first, 'M')).toBe(false);
    expect(store.canInsertAfter(first, 'L')).toBe(true);
    expect(store.canConvert(first, 'L')).toBe(false);
    expect(store.canConvert(second, 'L')).toBe(true);
    expect(store.canDelete(first)).toBe(false);
    expect(store.canDelete(second)).toBe(true);
    expect(store.canUseAsOrigin(second)).toBe(false);
    expect(store.canUseAsOrigin(store.parsedPath.path[2])).toBe(true);
    expect(store.hasSubPaths()).toBe(true);
  });

  it('rounds values using the requested precision', () => {
    const store = createStore();
    store.roundValues(0);
    for (const item of store.parsedPath.path) {
      for (const value of item.values) {
        expect(value).toBe(Math.round(value));
      }
    }
  });

  it('minifies the output', () => {
    const store = createStore();
    store.updateCfg({ minifyOutput: true });
    store.afterModelChange();
    expect(store.rawPath.startsWith('M4 8')).toBe(true);
    expect(store.rawPath).not.toContain(' L ');
  });

  it('applies global path operations', () => {
    const store = createStore();
    store.translate(1, 2);
    expect(store.parsedPath.path[0].getType()).toBe('M');
    expect(store.translateX).toBe(0);
    expect(store.translateY).toBe(0);

    store.scale(2, 2);
    expect(store.scaleX).toBe(1);
    expect(store.scaleY).toBe(1);

    store.setRelative(true);
    expect(store.parsedPath.path[1].relative).toBe(true);
    store.setRelative(false);
    expect(store.parsedPath.path[1].relative).toBe(false);

    const before = store.rawPath;
    store.reverse();
    expect(store.rawPath).not.toBe(before);

    store.optimize();
    expect(store.cfg.minifyOutput).toBe(true);
  });

  it('reloads valid paths and reports invalid syntax', () => {
    const store = createStore();
    store.reloadPath('M 0 0 L 10 10', false);
    expect(store.invalidSyntax).toBe(false);
    expect(store.parsedPath.path).toHaveLength(2);

    store.reloadPath('not a path', false);
    expect(store.invalidSyntax).toBe(true);
    expect(store.parsedPath.path).toHaveLength(2);
  });

  it('resets history when opening a stored path', () => {
    const store = createStore();
    store.openPath('M 0 0 L 1 1', 'my path');
    expect(store.pathName).toBe('my path');
    expect(store.history).toEqual(['M 0 0 L 1 1']);
    expect(store.historyCursor).toBe(0);
  });

  it('manages images', () => {
    const store = createStore();
    const image: Image = {
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      preserveAspectRatio: true,
      opacity: 1,
      data: 'data:image/png;base64,',
    };

    expect(store.toggleImageEditing()).toBe(true);
    expect(store.isEditingImages).toBe(true);

    store.addImage(image);
    expect(store.images).toHaveLength(1);
    expect(store.focusedImage).toBe(image);

    store.deleteImage(image);
    expect(store.images).toHaveLength(0);
    expect(store.focusedImage).toBeNull();

    expect(store.toggleImageEditing()).toBe(false);
    expect(store.isEditingImages).toBe(false);
  });

  it('honours the viewport lock', () => {
    const store = createStore();
    store.updateViewPort(1, 2, 10, 20);
    expect(store.cfg.viewPortX).toBe(1);
    expect(store.cfg.viewPortY).toBe(2);
    expect(store.cfg.viewPortWidth).toBe(10);
    expect(store.cfg.viewPortHeight).toBe(20);
    expect(store.strokeWidth).toBe(10 / store.canvasWidth);

    store.updateCfg({ viewPortLocked: true });
    store.updateViewPort(5, 5, 5, 5);
    expect(store.cfg.viewPortX).toBe(1);
    expect(store.cfg.viewPortWidth).toBe(10);

    store.updateViewPort(5, 5, 5, 5, true);
    expect(store.cfg.viewPortX).toBe(5);
    expect(store.cfg.viewPortWidth).toBe(5);
  });

  it('returns the tooltip labels for arc flags', () => {
    const store = createStore();
    const arc = store.parsedPath.path.find((item) => item.getType(true) === 'A')!;
    expect(store.getTooltip(arc, 0)).toBe('rx');
    expect(store.getTooltip(arc, 3)).toBe('large-arc-flag');
    expect(store.getTooltip(arc, 4)).toBe('sweep-flag');
    expect(store.getTooltip(arc, 6)).toBe('y');
  });

  it('ignores viewport updates when the canvas has no size', () => {
    const store = createStore();
    const before = {
      x: store.cfg.viewPortX,
      w: store.cfg.viewPortWidth,
      h: store.cfg.viewPortHeight,
    };
    store.canvasWidth = 0;
    store.canvasHeight = 0;
    expect(() => store.refreshCanvasSize()).not.toThrow();
    expect(() => store.updateViewPort(0, 0, 30, null, true)).not.toThrow();
    expect(() => store.zoomAuto()).not.toThrow();
    expect(store.cfg.viewPortX).toBe(before.x);
    expect(store.cfg.viewPortWidth).toBe(before.w);
    expect(store.cfg.viewPortHeight).toBe(before.h);
  });
});
