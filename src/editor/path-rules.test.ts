import { describe, expect, it } from 'vitest';
import { canInsertAfterType } from './path-rules';

describe('canInsertAfterType', () => {
  it('allows any command except Z on an empty path', () => {
    expect(canInsertAfterType(null, 'M')).toBe(true);
    expect(canInsertAfterType(null, 'L')).toBe(true);
    expect(canInsertAfterType(null, 'Z')).toBe(false);
  });

  it('applies the original rules', () => {
    expect(canInsertAfterType('M', 'M')).toBe(false);
    expect(canInsertAfterType('M', 'Z')).toBe(false);
    expect(canInsertAfterType('M', 'T')).toBe(false);
    expect(canInsertAfterType('M', 'S')).toBe(false);
    expect(canInsertAfterType('M', 'L')).toBe(true);

    expect(canInsertAfterType('Z', 'Z')).toBe(false);
    expect(canInsertAfterType('Z', 'T')).toBe(false);
    expect(canInsertAfterType('Z', 'S')).toBe(false);
    expect(canInsertAfterType('Z', 'M')).toBe(true);

    expect(canInsertAfterType('C', 'T')).toBe(false);
    expect(canInsertAfterType('S', 'T')).toBe(false);
    expect(canInsertAfterType('Q', 'S')).toBe(false);
    expect(canInsertAfterType('T', 'S')).toBe(false);

    expect(canInsertAfterType('L', 'T')).toBe(false);
    expect(canInsertAfterType('L', 'S')).toBe(false);
    expect(canInsertAfterType('L', 'C')).toBe(true);
  });
});
