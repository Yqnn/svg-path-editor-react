import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import type { SvgItem } from '../lib/svg';
import { useEditor } from '../editor/EditorProvider';
import { MoreIcon } from './icons';
import { CommandMenu, CreateCommandMenu } from './CommandMenus';
import { ImageMenu } from './ImageMenu';

export function ContextualAddButton() {
  const store = useEditor();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuItem, setMenuItem] = useState<SvgItem | null>(null);

  const focusedItem = store.focusedItem;
  const visible =
    ((!store.draggedPoint && focusedItem) || store.parsedPath.path.length === 0) &&
    !(store.cfg.preview || store.isEditingImages);

  if (!visible) {
    return null;
  }

  const target = focusedItem ? focusedItem.targetLocation() : { x: 0, y: 0 };
  const left = 6 + (target.x - store.cfg.viewPortX) / store.strokeWidth;
  const top = 6 + (target.y - store.cfg.viewPortY) / store.strokeWidth;
  const opened = anchorEl !== null;

  const handleOpen = (event: ReactMouseEvent<HTMLButtonElement>) => {
    setMenuItem(store.focusedItem);
    setAnchorEl(event.currentTarget);
    store.setContextualMenuOpened(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    store.setContextualMenuOpened(false);
  };

  return (
    <>
      <Fab
        size="small"
        color="secondary"
        className={`add-button${opened ? ' opened' : ''}`}
        style={{ left: `${left}px`, top: `${top}px` }}
        onClick={handleOpen}
      >
        {focusedItem ? <MoreIcon /> : <Icon>add</Icon>}
      </Fab>
      {menuItem ? (
        <CommandMenu anchorEl={anchorEl} open={opened} item={menuItem} onClose={handleClose} />
      ) : (
        <CreateCommandMenu
          anchorEl={anchorEl}
          open={opened}
          item={null}
          convert={false}
          onClose={handleClose}
        />
      )}
    </>
  );
}

export function ContextualImageButton() {
  const store = useEditor();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [alignRight, setAlignRight] = useState(false);
  const image = store.focusedImage;

  if (!image || store.cfg.preview || store.dragging) {
    return null;
  }

  const left = 8 + (Math.max(image.x1, image.x2) - store.cfg.viewPortX) / store.strokeWidth;
  const top = 8 + (Math.max(image.y1, image.y2) - store.cfg.viewPortY) / store.strokeWidth;
  const opened = anchorEl !== null;

  return (
    <>
      <Fab
        size="small"
        color="secondary"
        className={`add-button${opened ? ' opened' : ''}`}
        style={{ left: `${left}px`, top: `${top}px` }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setAlignRight(window.innerWidth - rect.right < 320);
          setAnchorEl(event.currentTarget);
          store.setContextualMenuOpened(true);
        }}
      >
        <MoreIcon />
      </Fab>
      <ImageMenu
        anchorEl={anchorEl}
        open={opened}
        image={image}
        alignRight={alignRight}
        onClose={() => {
          setAnchorEl(null);
          store.setContextualMenuOpened(false);
        }}
      />
    </>
  );
}
