import Button from '@mui/material/Button';
import { useState } from 'react';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { SvgPath } from '../lib/svg';
import { useStore } from '../editor/EditorProvider';
import { browserComputePathBoundingBox } from '../editor/svg-bbox';
import { PathPreview } from './PathPreview';
import { FilledField } from './FilledField';
import { FilledNumberField } from './FilledNumberField';
import { CheckboxField } from './CheckboxField';
import { AppTooltip } from './AppTooltip';
import { RaisedButton } from './buttons';
import { useSnackbar } from './SnackbarProvider';

interface ExportDialogProps {
  open: boolean;
  path: string;
  name: string;
  onClose: () => void;
}

export function ExportDialog({ open, path, name, onClose }: ExportDialogProps) {
  const store = useStore();
  const cfg = store.exportCfg;
  const { showCopied } = useSnackbar();

  const computeViewbox = () => {
    const p = new SvgPath(path);
    const locs = p.targetLocations();
    if (locs.length > 0) {
      const bbox = browserComputePathBoundingBox(path);
      let nx = bbox.x;
      let ny = bbox.y;
      let nw = bbox.width;
      let nh = bbox.height;
      if (cfg.stroke) {
        nx -= cfg.strokeWidth;
        ny -= cfg.strokeWidth;
        nw += 2 * cfg.strokeWidth;
        nh += 2 * cfg.strokeWidth;
      }
      return {
        x: parseFloat(nx.toPrecision(6)),
        y: parseFloat(ny.toPrecision(6)),
        width: parseFloat(nw.toPrecision(4)),
        height: parseFloat(nh.toPrecision(4)),
      };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  };

  const [viewBox, setViewBox] = useState(computeViewbox);
  const { x, y, width, height } = viewBox;

  const refreshViewbox = () => setViewBox(computeViewbox());

  const makeSVG = () =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}">
	<path d="${path}"${cfg.stroke ? ` stroke="${cfg.strokeColor}" stroke-width="${cfg.strokeWidth}"` : ''} fill="${cfg.fill ? cfg.fillColor : 'none'}"/>
</svg>`;

  const download = (fileName: string, data: string) => {
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const anchor = document.createElement('a');
    anchor.href = window.URL.createObjectURL(blob);
    anchor.setAttribute('download', fileName);
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => window.URL.revokeObjectURL(anchor.href), 100);
  };

  const copyToClipboard = (data: string) => {
    void navigator.clipboard.writeText(data);
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
      <DialogTitle>Export as SVG</DialogTitle>
      <DialogContent>
        <div className="export-content">
          <div className="export-form">
            <div className="style-form-title">Style</div>
            <div className="style-form-fill">
              <div>
                <CheckboxField
                  checked={cfg.fill}
                  onChange={(checked) => {
                    store.updateExportCfg({ fill: checked, stroke: cfg.stroke || !checked });
                  }}
                >
                  Fill
                </CheckboxField>
              </div>
              <FilledField
                label="Fill Color"
                value={cfg.fillColor}
                disabled={!cfg.fill}
                onChange={(value) => store.updateExportCfg({ fillColor: value })}
              />
            </div>
            <div className="style-form-stroke">
              <div>
                <CheckboxField
                  checked={cfg.stroke}
                  onChange={(checked) => {
                    store.updateExportCfg({ stroke: checked, fill: cfg.fill || !checked });
                  }}
                >
                  Stroke
                </CheckboxField>
              </div>
              <div className="style-form-stroke-fields">
                <div className="style-form-stroke-field">
                  <FilledField
                    label="Stroke Color"
                    value={cfg.strokeColor}
                    disabled={!cfg.stroke}
                    onChange={(value) => store.updateExportCfg({ strokeColor: value })}
                  />
                </div>
                <div className="style-form-stroke-field">
                  <FilledNumberField
                    label="Stroke width"
                    value={cfg.strokeWidth}
                    disabled={!cfg.stroke}
                    onChange={(value) => store.updateExportCfg({ strokeWidth: value })}
                  />
                </div>
              </div>
            </div>
            <div className="viewbox-form-title">
              <div>ViewBox</div>
              <Button variant="contained" disableElevation onClick={refreshViewbox}>
                Reset
              </Button>
            </div>
            <div className="viewbox-form-field">
              <FilledNumberField
                label="X"
                value={x}
                onChange={(value) => setViewBox((box) => ({ ...box, x: value }))}
              />
            </div>
            <div className="viewbox-form-field">
              <FilledNumberField
                label="Y"
                value={y}
                onChange={(value) => setViewBox((box) => ({ ...box, y: value }))}
              />
            </div>
            <div className="viewbox-form-field">
              <FilledNumberField
                label="Width"
                value={width}
                onChange={(value) => setViewBox((box) => ({ ...box, width: value }))}
                formatterType="positive-float"
              />
            </div>
            <div className="viewbox-form-field">
              <FilledNumberField
                label="Height"
                value={height}
                onChange={(value) => setViewBox((box) => ({ ...box, height: value }))}
                formatterType="positive-float"
              />
            </div>
          </div>
          <div className="preview">
            <div className="path-preview">
              <PathPreview
                x={x}
                y={y}
                width={width}
                height={height}
                path={path}
                fillColor={cfg.fill ? cfg.fillColor : 'none'}
                strokeColor={cfg.stroke ? cfg.strokeColor : 'none'}
                strokeWidth={cfg.strokeWidth}
              />
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <RaisedButton color="primary" onClick={onClose}>
          Cancel
        </RaisedButton>
        <RaisedButton color="primary" onClick={() => copyToClipboard(makeSVG())}>
          Copy to clipboard
        </RaisedButton>
        <RaisedButton
          color="secondary"
          onClick={() => {
            download(name || 'svg-path.svg', makeSVG());
            onClose();
          }}
        >
          Download
        </RaisedButton>
      </DialogActions>
    </Dialog>
  );
}

export function Export() {
  const store = useStore();
  const [dialog, setDialog] = useState({ open: false, key: 0 });

  return (
    <>
      <AppTooltip title="Download as SVG">
        <Fab
          size="small"
          color="primary"
          style={{ marginRight: 8 }}
          onClick={() => setDialog((state) => ({ open: true, key: state.key + 1 }))}
          aria-label="Download as SVG"
        >
          <Icon>get_app</Icon>
        </Fab>
      </AppTooltip>
      <ExportDialog
        key={dialog.key}
        open={dialog.open}
        path={store.rawPath}
        name={store.pathName}
        onClose={() => setDialog((state) => ({ ...state, open: false }))}
      />
    </>
  );
}
