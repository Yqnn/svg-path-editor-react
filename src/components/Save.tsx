import { useState } from 'react';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useStore } from '../editor/EditorProvider';
import { AppTooltip } from './AppTooltip';
import { FilledField } from './FilledField';
import { RaisedButton } from './buttons';

interface SaveDialogProps {
  open: boolean;
  onClose: (name?: string) => void;
}

export function SaveDialog({ open, onClose }: SaveDialogProps) {
  const store = useStore();
  const [name, setName] = useState(() => {
    let defaultName = store.pathName;
    if (!defaultName) {
      let i = 1;
      defaultName = 'My path';
      while (store.storage.hasPath(defaultName)) {
        defaultName = `My path ${i}`;
        i++;
      }
    }
    return defaultName;
  });

  const existing = store.storage.hasPath(name);
  const valid = !!name;

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth={false}
      slotProps={{
        paper: { sx: { width: 350, maxWidth: '80vw' } },
      }}
    >
      <DialogTitle>Save path</DialogTitle>
      <DialogContent>
        <FilledField label="Name" value={name} onChange={setName} autoFocus id="save-path-name" />
        {existing ? (
          <p>
            A path with this name already exists, press <i>Replace</i> to replace it.
          </p>
        ) : (
          <p>
            Press <i>Save</i> to save current path in your browser.
          </p>
        )}
      </DialogContent>
      <DialogActions>
        <RaisedButton color="primary" onClick={() => onClose()}>
          Cancel
        </RaisedButton>
        <RaisedButton
          color="secondary"
          disabled={!valid}
          onClick={() => {
            store.storage.addPath(name, store.rawPath);
            store.setPathName(name);
            onClose();
          }}
        >
          {existing ? 'Replace' : 'Save'}
        </RaisedButton>
      </DialogActions>
    </Dialog>
  );
}

export function Save() {
  const [dialog, setDialog] = useState({ open: false, key: 0 });

  return (
    <>
      <AppTooltip title="Save" close>
        <Fab
          size="small"
          color="primary"
          style={{ transform: 'none', margin: '0 4px' }}
          onClick={() => setDialog((state) => ({ open: true, key: state.key + 1 }))}
          aria-label="Save"
        >
          <Icon>save</Icon>
        </Fab>
      </AppTooltip>
      <SaveDialog
        key={dialog.key}
        open={dialog.open}
        onClose={() => setDialog((state) => ({ ...state, open: false }))}
      />
    </>
  );
}
