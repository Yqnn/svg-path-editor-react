import { useEffect, useRef, useState } from 'react';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useStore } from '../editor/EditorProvider';
import { PathPreview } from './PathPreview';
import { FilledField } from './FilledField';
import { AppTooltip } from './AppTooltip';
import { RaisedButton } from './buttons';
import { useSnackbar } from './SnackbarProvider';

interface ShareDialogProps {
  open: boolean;
  path: string;
  onClose: () => void;
}

export function ShareDialog({ open, path, onClose }: ShareDialogProps) {
  const { showCopied } = useSnackbar();
  const inputRef = useRef<HTMLInputElement>(null);

  const getUrl = () => {
    const loc = window.location;
    const fragment = path.replace(/ +/g, '_');
    return `${loc.protocol}//${loc.host}${loc.pathname}#P=${fragment}`;
  };

  const selectText = () => {
    const el = inputRef.current;
    if (!el) {
      return;
    }
    el.focus();
    el.select();
    el.scrollLeft = 0;
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const timeout = window.setTimeout(selectText, 0);
    return () => window.clearTimeout(timeout);
  }, [open]);

  const copy = () => {
    selectText();
    void navigator.clipboard.writeText(inputRef.current?.value ?? '');
    showCopied();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      disableAutoFocus
      slotProps={{
        paper: { sx: { width: 800, maxWidth: '80vw' } },
      }}
    >
      <DialogTitle>Share path as URL</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex' }}>
          <div className="path-preview">
            <PathPreview path={path} />
          </div>
          <div className="dialog-text" style={{ padding: '0 32px', flex: 1 }}>
            <p>The current path can be shared using the following link:</p>
            <FilledField
              label="URL"
              value={getUrl()}
              readOnly
              inputRef={inputRef}
              endAdornment={
                <AppTooltip title="Copy to clipboard">
                  <IconButton onClick={copy} aria-label="Copy to clipboard">
                    <Icon>content_pasted</Icon>
                  </IconButton>
                </AppTooltip>
              }
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <RaisedButton color="primary" onClick={onClose}>
          Close
        </RaisedButton>
      </DialogActions>
    </Dialog>
  );
}

export function Share() {
  const store = useStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppTooltip title="Share as link">
        <Fab
          size="small"
          color="primary"
          style={{ marginLeft: 0 }}
          onClick={() => setOpen(true)}
          aria-label="Share as link"
        >
          <Icon>share</Icon>
        </Fab>
      </AppTooltip>
      <ShareDialog open={open} path={store.rawPath} onClose={() => setOpen(false)} />
    </>
  );
}
