import { getConfigKey } from './constants/storage.const';

/**
 * Creates an object whose properties are persisted in localStorage, using the
 * same key layout as the original Angular `@save()` decorator.
 */
function createPersisted<T extends object>(className: string, defaults: T): T {
  const result = {} as T;
  for (const [propertyKey, defaultValue] of Object.entries(defaults)) {
    const localStorageKey = getConfigKey(className, propertyKey);
    const storedValue = localStorage.getItem(localStorageKey);
    let value: unknown = storedValue !== null ? JSON.parse(storedValue) : defaultValue;

    Object.defineProperty(result, propertyKey, {
      get: () => value,
      set: (newValue: unknown) => {
        value = newValue;
        localStorage.setItem(localStorageKey, JSON.stringify(newValue));
      },
      enumerable: true,
      configurable: true,
    });
  }
  return result;
}

export interface Config {
  viewPortX: number;
  viewPortY: number;
  viewPortWidth: number;
  viewPortHeight: number;
  viewPortLocked: boolean;
  filled: boolean;
  preview: boolean;
  showTicks: boolean;
  minifyOutput: boolean;
  snapToGrid: boolean;
  decimalPrecision: number;
}

export interface ExportConfig {
  fill: boolean;
  fillColor: string;
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export const createConfig = (): Config =>
  createPersisted<Config>('Config', {
    viewPortX: 0,
    viewPortY: 0,
    viewPortWidth: 30,
    viewPortHeight: 30,
    viewPortLocked: false,
    filled: true,
    preview: false,
    showTicks: false,
    minifyOutput: false,
    snapToGrid: true,
    decimalPrecision: 3,
  });

export const createExportConfig = (): ExportConfig =>
  createPersisted<ExportConfig>('ExportConfig', {
    fill: true,
    fillColor: '#000000',
    stroke: false,
    strokeColor: '#FF0000',
    strokeWidth: 0.1,
  });
