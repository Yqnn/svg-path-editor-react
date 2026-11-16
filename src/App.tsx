import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { EditorStore } from './editor/editor-store';
import { EditorProvider, useEditor } from './editor/EditorProvider';
import { SnackbarProvider } from './components/SnackbarProvider';
import { LeftPanel } from './components/LeftPanel';
import { Canvas } from './components/Canvas';
import { Footer } from './components/Footer';
import { SceneActions } from './components/SceneActions';
import { ContextualAddButton, ContextualImageButton } from './components/ContextualButtons';
import { ImportFromUrl } from './components/ImportUrl';
import { UploadImageDialog } from './components/UploadImage';
import { KEYBOARD } from './editor/constants/keyboard.const';
import type { SvgCommandType } from './lib/svg-command-types';
import { RaisedButton } from './components/buttons';
import Icon from '@mui/material/Icon';

function AppContent() {
  const store = useEditor();
  const [panelMounted, setPanelMounted] = useState(true);
  const [panelClosing, setPanelClosing] = useState(false);
  const [panelEntering, setPanelEntering] = useState(false);
  const [uploadDialog, setUploadDialog] = useState({ open: false, key: 0 });

  const openUpload = useCallback(() => {
    setUploadDialog((state) => ({ open: true, key: state.key + 1 }));
  }, []);

  const actionsSignature = [
    store.canUndo(),
    store.canRedo(),
    store.isEditingImages,
    store.cfg.snapToGrid,
  ].join('|');
  const exportConfigSignature = [
    store.exportCfg.fill,
    store.exportCfg.fillColor,
    store.exportCfg.stroke,
    store.exportCfg.strokeColor,
    store.exportCfg.strokeWidth,
  ].join('|');
  const sceneActions = useMemo(
    () => <SceneActions onOpenUpload={openUpload} />,
    // The signatures capture every store value SceneActions and the export
    // dialog inside it display.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actionsSignature, exportConfigSignature, openUpload],
  );

  const openPanel = () => {
    if (!store.isLeftPanelOpened) {
      setPanelMounted(true);
      setPanelClosing(false);
      setPanelEntering(true);
      store.toggleLeftPanel();
    }
  };

  const closePanel = () => {
    if (store.isLeftPanelOpened) {
      setPanelEntering(false);
      setPanelClosing(true);
      store.toggleLeftPanel();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = event.target instanceof Element ? event.target.tagName : null;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }

      if (
        event.shiftKey &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === KEYBOARD.KEYS.UNDO
      ) {
        store.redo();
        event.preventDefault();
      } else if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === KEYBOARD.KEYS.UNDO
      ) {
        store.undo();
        event.preventDefault();
      } else if (
        !event.metaKey &&
        !event.ctrlKey &&
        KEYBOARD.PATTERNS.SVG_COMMAND.test(event.key)
      ) {
        const isLower = event.key === event.key.toLowerCase();
        const key = event.key.toUpperCase() as SvgCommandType;
        if (isLower) {
          // Item insertion
          const lastItem = store.parsedPath.path.length
            ? store.parsedPath.path[store.parsedPath.path.length - 1]
            : null;
          const prevItem = store.focusedItem || lastItem;
          if (store.canInsertAfter(prevItem, key)) {
            store.insert(key, prevItem, false);
            event.preventDefault();
          }
        } else if (!isLower && store.focusedItem && store.canConvert(store.focusedItem, key)) {
          // Item conversion
          store.insert(key, store.focusedItem, true);
          event.preventDefault();
        }
      } else if (!event.metaKey && !event.ctrlKey && event.key === KEYBOARD.KEYS.ESCAPE) {
        if (store.dragging) {
          // If an element is being dragged, undo by reloading the current history entry
          store.reloadPath(store.history[store.historyCursor]);
        } else {
          // stopDrag will unselect selected item if any
          store.stopDrag();
        }
        event.preventDefault();
      } else if (
        !event.metaKey &&
        !event.ctrlKey &&
        (event.key === KEYBOARD.KEYS.DELETE || event.key === KEYBOARD.KEYS.BACKSPACE)
      ) {
        if (store.focusedItem && store.canDelete(store.focusedItem)) {
          store.delete(store.focusedItem);
          event.preventDefault();
        }
        if (store.focusedImage) {
          store.deleteImage(store.focusedImage);
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [store]);

  const cursorPosition = store.cursorPosition;
  const hoverPosition = store.hoverPosition;

  return (
    <>
      <div className="app-root">
        {panelMounted ? (
          <LeftPanel
            closing={panelClosing}
            entering={panelEntering}
            onCloseClick={closePanel}
            onEntered={() => setPanelEntering(false)}
            onClosed={() => {
              setPanelMounted(false);
              setPanelClosing(false);
              setPanelEntering(false);
            }}
          />
        ) : null}

        <div className="drawings">
          {!store.isLeftPanelOpened ? (
            <RaisedButton
              className="left-column-open"
              style={{ borderRadius: 0 }}
              onClick={openPanel}
            >
              <Icon>arrow_right</Icon>
            </RaisedButton>
          ) : null}

          <ContextualAddButton />

          {cursorPosition ? (
            <span className="cursor-position">
              {cursorPosition.x.toFixed(cursorPosition.decimals ?? 0)},{' '}
              {cursorPosition.y.toFixed(cursorPosition.decimals ?? 0)}
            </span>
          ) : null}

          {!cursorPosition && hoverPosition && !store.isEditingImages ? (
            <span className="hover-position">
              {hoverPosition.x.toFixed(3)}, {hoverPosition.y.toFixed(3)}
            </span>
          ) : null}

          <ContextualImageButton />

          {sceneActions}

          <Canvas />
        </div>
      </div>

      {store.isLeftPanelOpened ? <Footer /> : null}

      <ImportFromUrl />

      <UploadImageDialog
        key={uploadDialog.key}
        open={uploadDialog.open}
        onClose={(image) => {
          setUploadDialog((state) => ({ ...state, open: false }));
          if (image) {
            store.addImage(image);
          } else {
            store.cancelAddImage();
          }
        }}
      />
    </>
  );
}

export function App() {
  const [store] = useState(() => new EditorStore());

  return (
    <ThemeProvider theme={theme}>
      <EditorProvider store={store}>
        <SnackbarProvider>
          <AppContent />
        </SnackbarProvider>
      </EditorProvider>
    </ThemeProvider>
  );
}
