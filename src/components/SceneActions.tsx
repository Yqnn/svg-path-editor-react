import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import { useStore } from '../editor/EditorProvider';
import { AppTooltip } from './AppTooltip';
import { Export } from './Export';
import { Share } from './Share';
import { UploadImageButton } from './UploadImage';
import { ZoomFitIcon, ZoomInIcon, ZoomOutIcon } from './icons';

interface SceneActionsProps {
  onOpenUpload: () => void;
}

export function SceneActions({ onOpenUpload }: SceneActionsProps) {
  const store = useStore();
  const { cfg } = store;

  const toggleImageEditing = () => {
    if (store.toggleImageEditing()) {
      onOpenUpload();
    }
  };

  const unlock = () => store.updateCfg({ viewPortLocked: false });

  return (
    <>
      <div className="scene-top-actions">
        <AppTooltip title="Undo" close>
          <Fab
            size="small"
            color="primary"
            disabled={!store.canUndo()}
            onClick={() => store.undo()}
            aria-label="Undo"
          >
            <Icon>undo</Icon>
          </Fab>
        </AppTooltip>
        <AppTooltip title="Redo" close>
          <Fab
            size="small"
            color="primary"
            disabled={!store.canRedo()}
            onClick={() => store.redo()}
            aria-label="Redo"
          >
            <Icon>redo</Icon>
          </Fab>
        </AppTooltip>

        <UploadImageButton
          className={`add-image-button${store.isEditingImages ? ' displayed' : ''}`}
          onOpen={onOpenUpload}
        />

        <AppTooltip title={store.isEditingImages ? '' : 'Toggle image management mode'} close>
          <Fab
            size="small"
            color={store.isEditingImages ? 'secondary' : 'primary'}
            style={{ marginRight: 24, marginLeft: 24 }}
            onClick={toggleImageEditing}
            aria-label="Toggle image management mode"
          >
            <Icon>image</Icon>
          </Fab>
        </AppTooltip>

        <Export />
        <Share />
      </div>
      <div className="scene-bottom-actions">
        <AppTooltip title="Snap to Grid" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={() => store.updateCfg({ snapToGrid: !cfg.snapToGrid })}
            aria-label="Snap to Grid"
          >
            <Icon>{cfg.snapToGrid ? 'grid_on' : 'grid_off'}</Icon>
          </Fab>
        </AppTooltip>
        <AppTooltip title="Zoom In" placement="left">
          <Fab
            size="small"
            color="primary"
            style={{ marginTop: 24 }}
            onClick={() => {
              unlock();
              store.zoomViewPort(9 / 10);
            }}
            aria-label="Zoom In"
          >
            <ZoomInIcon />
          </Fab>
        </AppTooltip>
        <AppTooltip title="Zoom to Fit" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={() => {
              unlock();
              store.zoomAuto();
            }}
            aria-label="Zoom to Fit"
          >
            <ZoomFitIcon />
          </Fab>
        </AppTooltip>
        <AppTooltip title="Zoom Out" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={() => {
              unlock();
              store.zoomViewPort(10 / 9);
            }}
            aria-label="Zoom Out"
          >
            <ZoomOutIcon />
          </Fab>
        </AppTooltip>
      </div>
    </>
  );
}
