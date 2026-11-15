import { describe, expect, it } from 'vitest';
import { sanitizeNumberInput } from './formatter';

describe('sanitizeNumberInput', () => {
  it('keeps floats', () => {
    expect(sanitizeNumberInput('12.5', 'float')).toBe('12.5');
    expect(sanitizeNumberInput('-12,5', 'float')).toBe('-12.5');
    expect(sanitizeNumberInput('1e-3', 'float')).toBe('1e-3');
    expect(sanitizeNumberInput('abc12.5xyz', 'float')).toBe('12.5');
  });

  it('keeps positive floats', () => {
    expect(sanitizeNumberInput('-12.5', 'positive-float')).toBe('12.5');
    expect(sanitizeNumberInput('1,5', 'positive-float')).toBe('1.5');
  });

  it('keeps integers', () => {
    expect(sanitizeNumberInput('-12.5', 'integer')).toBe('-125');
    expect(sanitizeNumberInput('a1b2', 'integer')).toBe('12');
  });

  it('keeps positive integers', () => {
    expect(sanitizeNumberInput('-12.5', 'positive-integer')).toBe('125');
  });
});
