import { beforeEach, describe, expect, it } from 'vitest';
import { createConfig, createExportConfig } from './config';
import { getConfigKey } from './constants/storage.const';

describe('config persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses the original Angular defaults', () => {
    const cfg = createConfig();
    expect(cfg.viewPortX).toBe(0);
    expect(cfg.viewPortY).toBe(0);
    expect(cfg.viewPortWidth).toBe(30);
    expect(cfg.viewPortHeight).toBe(30);
    expect(cfg.viewPortLocked).toBe(false);
    expect(cfg.filled).toBe(true);
    expect(cfg.preview).toBe(false);
    expect(cfg.showTicks).toBe(false);
    expect(cfg.minifyOutput).toBe(false);
    expect(cfg.snapToGrid).toBe(true);
    expect(cfg.decimalPrecision).toBe(3);
  });

  it('writes values under the same localStorage keys as the Angular decorator', () => {
    const cfg = createConfig();
    cfg.viewPortX = 12.5;
    cfg.snapToGrid = false;

    expect(localStorage.getItem(getConfigKey('Config', 'viewPortX'))).toBe('12.5');
    expect(localStorage.getItem(getConfigKey('Config', 'snapToGrid'))).toBe('false');
  });

  it('reads persisted values back', () => {
    localStorage.setItem(getConfigKey('Config', 'viewPortWidth'), '42');
    localStorage.setItem(getConfigKey('Config', 'preview'), 'true');
    const cfg = createConfig();
    expect(cfg.viewPortWidth).toBe(42);
    expect(cfg.preview).toBe(true);
  });

  it('persists export configuration', () => {
    const cfg = createExportConfig();
    expect(cfg).toEqual({
      fill: true,
      fillColor: '#000000',
      stroke: false,
      strokeColor: '#FF0000',
      strokeWidth: 0.1,
    });
    cfg.stroke = true;
    expect(localStorage.getItem(getConfigKey('ExportConfig', 'stroke'))).toBe('true');
  });
});
