import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { SvgPath } from '../lib/svg';
import { useEditor } from '../editor/EditorProvider';
import { kDefaultPath } from '../editor/constants/default-path.const';
import { PathPreview } from './PathPreview';
import { RaisedButton } from './buttons';

function readPathFromUrl(): string {
  let fragment: string;
  try {
    fragment = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return '';
  }
  const check = /^P=[mMlLvVhHcCsSqQtTaAzZ0-9\-e._,]+$/;
  if (check.test(fragment)) {
    const path = fragment.slice(2).replace(/_/g, ' ');
    try {
      // Validate the path before accepting it.
      new SvgPath(path);
      return path;
    } catch {
      // Ignore malformed paths from the URL fragment.
    }
  }
  return '';
}

interface ImportDialogProps {
  open: boolean;
  path: string;
  onDiscard: () => void;
  onImport: () => void;
}

function ImportDialog({ open, path, onDiscard, onImport }: ImportDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onDiscard}
      maxWidth={false}
      disableAutoFocus
      slotProps={{
        paper: { sx: { width: 800, maxWidth: '80vw' } },
      }}
    >
      <DialogTitle>Import shared path</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex' }}>
          <div className="path-preview">
            <PathPreview path={path} />
          </div>
          <div className="dialog-text" style={{ padding: '0 32px' }}>
            <p>
              Press <b>Import</b> to import this SVG path in the editor.
            </p>
            <p>Please note it will erase any unsaved change.</p>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <RaisedButton color="primary" onClick={onDiscard}>
          Discard
        </RaisedButton>
        <RaisedButton color="secondary" onClick={onImport}>
          Import
        </RaisedButton>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Reads a shared path from the URL fragment (`#P=...`) and imports it, asking
 * for confirmation when the current path has unsaved changes.
 */
export function ImportFromUrl() {
  const store = useEditor();

  const [initial] = useState(() => {
    const urlPath = readPathFromUrl();
    if (!urlPath) {
      return { dialogPath: null as string | null, directPath: null as string | null };
    }
    const openedPath = store.storage.getPath();
    const unsavedChanges = openedPath && openedPath.path !== kDefaultPath;
    if (urlPath === openedPath?.path) {
      return { dialogPath: null as string | null, directPath: null as string | null };
    }
    if (unsavedChanges) {
      return { dialogPath: urlPath, directPath: null as string | null };
    }
    return { dialogPath: null as string | null, directPath: urlPath };
  });
  const [dialogPath, setDialogPath] = useState<string | null>(initial.dialogPath);

  useEffect(() => {
    if (initial.directPath) {
      store.openPath(initial.directPath, '');
      window.location.hash = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalize = (result: boolean) => {
    if (result && dialogPath) {
      store.openPath(dialogPath, '');
    }
    setDialogPath(null);
    window.location.hash = '';
  };

  return (
    <ImportDialog
      open={dialogPath !== null}
      path={dialogPath ?? ''}
      onDiscard={() => finalize(false)}
      onImport={() => finalize(true)}
    />
  );
}
