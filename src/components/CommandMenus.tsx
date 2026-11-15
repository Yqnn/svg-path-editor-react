import { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Icon from '@mui/material/Icon';
import type { SvgItem } from '../lib/svg';
import type { SvgCommandType } from '../lib/svg-command-types';
import { useEditor } from '../editor/EditorProvider';
import { getMenuOrigins, SubmenuArrow } from './menu-position';

const COMMAND_TYPES: { type: SvgCommandType; label: string }[] = [
  { type: 'M', label: 'Move to' },
  { type: 'L', label: 'Line to' },
  { type: 'V', label: 'Vertical Line to' },
  { type: 'H', label: 'Horizontal Line to' },
  { type: 'C', label: 'Curve to' },
  { type: 'S', label: 'Shorthand Curve to' },
  { type: 'Q', label: 'Quadratic Bezier Curve to' },
  { type: 'T', label: 'Shorthand Quadratic Bezier Curve to' },
  { type: 'A', label: 'Elliptical Arc' },
  { type: 'Z', label: 'Close Path' },
];

interface CreateCommandMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  item: SvgItem | null;
  convert: boolean;
  onClose: () => void;
  onInserted?: () => void;
  side?: boolean;
}

export function CreateCommandMenu({
  anchorEl,
  open,
  item,
  convert,
  onClose,
  onInserted,
  side = false,
}: CreateCommandMenuProps) {
  const store = useEditor();
  const origins = getMenuOrigins(anchorEl, COMMAND_TYPES.length, side ? 'side' : 'default');

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transitionDuration={120}
      marginThreshold={0}
      anchorOrigin={origins.anchorOrigin}
      transformOrigin={origins.transformOrigin}
    >
      {COMMAND_TYPES.map(({ type, label }) => {
        const disabled = convert
          ? !item || !store.canConvert(item, type)
          : !store.canInsertAfter(item, type);
        return (
          <MenuItem
            key={type}
            disabled={disabled}
            onClick={() => {
              store.insert(type, item, convert);
              onInserted?.();
              if (!onInserted) {
                onClose();
              }
            }}
          >
            <strong>{type}</strong>&nbsp;{label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}

interface CommandMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  item: SvgItem | null;
  onClose: () => void;
}

export function CommandMenu({ anchorEl, open, item, onClose }: CommandMenuProps) {
  const store = useEditor();
  const [submenu, setSubmenu] = useState<{ anchor: HTMLElement | null; convert: boolean }>({
    anchor: null,
    convert: false,
  });

  const origins = getMenuOrigins(anchorEl, 7, 'before');

  if (!item) {
    return null;
  }

  const closeAll = () => {
    setSubmenu({ anchor: null, convert: false });
    onClose();
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => {
          setSubmenu({ anchor: null, convert: false });
          onClose();
        }}
        transitionDuration={120}
        marginThreshold={0}
        anchorOrigin={origins.anchorOrigin}
        transformOrigin={origins.transformOrigin}
      >
        <MenuItem onClick={(event) => setSubmenu({ anchor: event.currentTarget, convert: false })}>
          <ListItemIcon>
            <Icon>add</Icon>
          </ListItemIcon>
          Insert After
          <SubmenuArrow />
        </MenuItem>
        <MenuItem onClick={(event) => setSubmenu({ anchor: event.currentTarget, convert: true })}>
          <ListItemIcon>
            <Icon>autorenew</Icon>
          </ListItemIcon>
          Convert To
          <SubmenuArrow />
        </MenuItem>
        <MenuItem
          onClick={() => {
            item.setRelative(!item.relative);
            store.afterModelChange();
            closeAll();
          }}
        >
          <ListItemIcon>
            <Icon>autorenew</Icon>
          </ListItemIcon>
          {item.relative ? 'Set Absolute' : 'Set Relative'}
        </MenuItem>
        <MenuItem
          disabled={!store.canUseAsOrigin(item)}
          onClick={() => {
            store.useAsOrigin(item);
            closeAll();
          }}
        >
          <ListItemIcon>
            <Icon>vertical_align_top</Icon>
          </ListItemIcon>
          Start Path From Here
        </MenuItem>
        <MenuItem
          disabled={!store.canUseAsOrigin(item) || !store.hasSubPaths()}
          onClick={() => {
            store.useAsOrigin(item, true);
            closeAll();
          }}
        >
          <ListItemIcon>
            <Icon>vertical_align_top</Icon>
          </ListItemIcon>
          Start Subpath From Here
        </MenuItem>
        <MenuItem
          disabled={!store.hasSubPaths()}
          onClick={() => {
            store.reverseSubPath(item);
            closeAll();
          }}
        >
          <ListItemIcon>
            <Icon>swap_vert</Icon>
          </ListItemIcon>
          Reverse Subpath
        </MenuItem>
        <MenuItem
          disabled={!store.canDelete(item)}
          onClick={() => {
            store.delete(item);
            closeAll();
          }}
        >
          <ListItemIcon>
            <Icon>delete</Icon>
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
      <CreateCommandMenu
        anchorEl={submenu.anchor}
        open={submenu.anchor !== null}
        item={item}
        convert={submenu.convert}
        side
        onClose={() => setSubmenu({ anchor: null, convert: false })}
        onInserted={closeAll}
      />
    </>
  );
}
