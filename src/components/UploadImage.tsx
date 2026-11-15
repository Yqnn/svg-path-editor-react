import { useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import type { Image } from '../editor/image';
import { AppTooltip } from './AppTooltip';
import { CheckboxField } from './CheckboxField';
import { FilledField } from './FilledField';
import { RaisedButton } from './buttons';

interface UploadImageDialogProps {
  open: boolean;
  onClose: (image?: Image) => void;
}

export function UploadImageDialog({ open, onClose }: UploadImageDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [x, setX] = useState('0');
  const [y, setY] = useState('0');
  const [width, setWidth] = useState('20');
  const [height, setHeight] = useState('20');
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);

  const importFile = (file: File) => {
    if (window.FileReader !== undefined) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData(event.target?.result?.toString() ?? null);
      };
      setName(file.name);
      reader.readAsDataURL(file);
    } else {
      alert('FileReader not supported');
    }
  };

  const onFileSelected = (input: HTMLInputElement) => {
    if (typeof FileReader !== 'undefined') {
      if (input.files) {
        importFile(input.files[0]);
      }
    } else {
      alert('FileReader not supported');
    }
  };

  const onDrop = (event: ReactDragEvent<HTMLElement>) => {
    if (event.dataTransfer && event.dataTransfer.files) {
      const file = event.dataTransfer.files[0];
      if (/^image\//.test(file.type)) {
        importFile(file);
      }
    }
    event.preventDefault();
  };

  const onDragOver = (event: ReactDragEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const onUploadImage = () => {
    if (!data) {
      return;
    }
    onClose({
      data,
      x1: parseFloat(x),
      y1: parseFloat(y),
      x2: parseFloat(x) + parseFloat(width),
      y2: parseFloat(y) + parseFloat(height),
      preserveAspectRatio,
      opacity: 1.0,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth={false}
      slotProps={{
        paper: { sx: { width: 800, maxWidth: '80vw' } },
      }}
    >
      <DialogTitle>Import image</DialogTitle>
      <DialogContent
        className="upload-image-dialog-content"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="upload-button-row">
          <RaisedButton onClick={() => fileInputRef.current?.click()} onDrop={onDrop}>
            Choose File
          </RaisedButton>
          {data ? <img className="preview" src={data} alt={`Preview of ${name}`} /> : null}
          <span className="filename">{name}</span>
        </div>
        <div style={{ width: 'calc(50% - 4px)' }}>
          <FilledField label="x" value={x} onChange={setX} />
        </div>
        <div style={{ width: 'calc(50% - 4px)' }}>
          <FilledField label="y" value={y} onChange={setY} />
        </div>
        <div style={{ width: 'calc(50% - 4px)' }}>
          <FilledField label="width" value={width} onChange={setWidth} />
        </div>
        <div style={{ width: 'calc(50% - 4px)' }}>
          <FilledField label="height" value={height} onChange={setHeight} />
        </div>
        <div>
          <CheckboxField checked={preserveAspectRatio} onChange={setPreserveAspectRatio}>
            Preserve Aspect Ratio
          </CheckboxField>
        </div>
        <input
          ref={fileInputRef}
          hidden
          onChange={(event) => onFileSelected(event.target)}
          accept="image/*"
          type="file"
        />
      </DialogContent>
      <DialogActions>
        <RaisedButton color="primary" onClick={() => onClose()}>
          Cancel
        </RaisedButton>
        <RaisedButton color="secondary" disabled={!data} onClick={onUploadImage}>
          Import
        </RaisedButton>
      </DialogActions>
    </Dialog>
  );
}

interface UploadImageButtonProps {
  className?: string;
  onOpen: () => void;
}

export function UploadImageButton({ className, onOpen }: UploadImageButtonProps) {
  return (
    <AppTooltip title="Import image">
      <Fab
        size="small"
        color="primary"
        className={className}
        onClick={onOpen}
        aria-label="Import image"
      >
        <Icon>add_photo_alternate</Icon>
      </Fab>
    </AppTooltip>
  );
}
