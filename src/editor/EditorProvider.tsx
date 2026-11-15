import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { EditorStore } from './editor-store';

const EditorStoreContext = createContext<EditorStore | null>(null);

export function EditorProvider({ children, store }: { children: ReactNode; store: EditorStore }) {
  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>;
}

/** Returns the store instance without subscribing to changes. */
export function useStore(): EditorStore {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useStore must be used inside an EditorProvider');
  }
  return store;
}

/**
 * Returns the store and subscribes the calling component to every change.
 * The app is small enough that a single global subscription is both simple and
 * sufficiently fast, and it matches Angular's change detection behaviour.
 */
export function useEditor(): EditorStore {
  const store = useStore();
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return store;
}
