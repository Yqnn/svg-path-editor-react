import type { SvgCommandType } from '../lib/svg-command-types';

/**
 * Returns whether a command of type `type` can be inserted after a command of
 * type `previousType` (null when the path is empty).
 */
export function canInsertAfterType(
  previousType: SvgCommandType | null,
  type: SvgCommandType,
): boolean {
  if (!previousType) {
    return type !== 'Z';
  }
  if (previousType === 'M') {
    return type !== 'M' && type !== 'Z' && type !== 'T' && type !== 'S';
  }
  if (previousType === 'Z') {
    return type !== 'Z' && type !== 'T' && type !== 'S';
  }
  if (previousType === 'C' || previousType === 'S') {
    return type !== 'T';
  }
  if (previousType === 'Q' || previousType === 'T') {
    return type !== 'S';
  }
  return type !== 'T' && type !== 'S';
}
