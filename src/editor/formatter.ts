export type FormatterType = 'float' | 'positive-float' | 'integer' | 'positive-integer';

/**
 * Filters a raw input string the same way the original `appFormatter` directive
 * does, depending on the requested formatter type.
 */
export function sanitizeNumberInput(raw: string, type: FormatterType): string {
  if (type === 'float') {
    return raw.replace(/[\u066B,]/g, '.').replace(/[^\-0-9.eE]/g, '');
  }
  if (type === 'integer') {
    return raw.replace(/[^\-0-9]/g, '');
  }
  if (type === 'positive-float') {
    return raw.replace(/[\u066B,]/g, '.').replace(/[^0-9.eE]/g, '');
  }
  return raw.replace(/[^0-9]/g, '');
}
