import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Icon from '@mui/material/Icon';
import Slider from '@mui/material/Slider';
import type { Image } from '../editor/image';
import { useStore } from '../editor/EditorProvider';
import { getMenuOrigins } from './menu-position';

interface ImageMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  image: Image | null;
  onClose: () => void;
  alignRight?: boolean;
}

export function ImageMenu({ anchorEl, open, image, onClose, alignRight = false }: ImageMenuProps) {
  const store = useStore();

  const origins = getMenuOrigins(anchorEl, 3, alignRight ? 'before' : 'default');

  if (!image) {
    return null;
  }

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
      <MenuItem
        disableRipple
        tabIndex={0}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <ListItemIcon>
          <Icon>opacity</Icon>
        </ListItemIcon>
        Opacity
        <div style={{ display: 'inline-flex', alignItems: 'center', width: 180 }}>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={image.opacity}
            onChange={(_, value) => {
              store.updateImage(image, { opacity: value as number });
            }}
            style={{ margin: '0 16px', minWidth: 100, width: 100 }}
          />
          <span>{image.opacity}</span>
        </div>
      </MenuItem>
      <MenuItem
        onClick={(event) => {
          event.stopPropagation();
          store.updateImage(image, { preserveAspectRatio: !image.preserveAspectRatio });
        }}
      >
        <ListItemIcon>
          <Icon>aspect_ratio</Icon>
        </ListItemIcon>
        Toggle Preserve Aspect Ratio
      </MenuItem>
      <MenuItem
        onClick={() => {
          store.deleteImage(image);
          onClose();
        }}
      >
        <ListItemIcon>
          <Icon>delete</Icon>
        </ListItemIcon>
        Delete
      </MenuItem>
    </Menu>
  );
}
