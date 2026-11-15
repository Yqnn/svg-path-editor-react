import { beforeEach, describe, expect, it } from 'vitest';
import { Storage } from './storage';
import { STORAGE } from './constants/storage.const';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds, updates and reads paths', () => {
    const storage = new Storage();
    storage.addPath('one', 'M 0 0 L 1 1');
    expect(storage.hasPath('one')).toBe(true);
    expect(storage.getPath('one')?.path).toBe('M 0 0 L 1 1');
    expect(storage.isEmpty()).toBe(false);

    storage.addPath('one', 'M 2 2');
    expect(storage.getPath('one')?.path).toBe('M 2 2');
    expect(storage.storedPaths).toHaveLength(1);

    storage.addPath(null, 'M 3 3');
    expect(storage.getPath()?.path).toBe('M 3 3');
    expect(storage.isEmpty()).toBe(false);
  });

  it('ignores unnamed paths when checking emptiness', () => {
    const storage = new Storage();
    storage.addPath(null, 'M 0 0');
    expect(storage.isEmpty()).toBe(true);
  });

  it('removes paths', () => {
    const storage = new Storage();
    storage.addPath('one', 'M 0 0');
    storage.removePath('one');
    expect(storage.getPath('one')).toBeUndefined();
    expect(storage.isEmpty()).toBe(true);
  });

  it('persists and restores dates', () => {
    const storage = new Storage();
    storage.addPath('one', 'M 0 0');
    const raw = JSON.parse(localStorage.getItem(STORAGE.STORED_PATHS) || '[]');
    expect(raw[0].creationDate).toBeTypeOf('string');

    const reloaded = new Storage();
    const path = reloaded.getPath('one');
    expect(path?.creationDate).toBeInstanceOf(Date);
    expect(path?.changeDate).toBeInstanceOf(Date);
    expect(path?.path).toBe('M 0 0');
  });
});
