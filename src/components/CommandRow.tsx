import { memo, useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import type { SvgItem } from '../lib/svg';
import { useStore } from '../editor/EditorProvider';
import { NumberInput } from './NumberInput';
import { AppTooltip } from './AppTooltip';
import { MoreIcon } from './icons';
import { CommandMenu } from './CommandMenus';

interface CommandRowProps {
  item: SvgItem;
  index: number;
  /**
   * Changes only when the row's rendered state changes. Props are compared by
   * `memo` so that dragging a point only re-renders the affected command row
   * instead of all of them.
   */
  signature: string;
}

export const CommandRow = memo(function CommandRow({ item, index }: CommandRowProps) {
  const store = useStore();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const isArc = item.getType().toLowerCase() === 'a';
  const hovered = item === store.hoveredItem && !store.draggedPoint;
  const dragged =
    (store.draggedPoint && item === store.draggedPoint.itemReference) || store.focusedItem === item;

  const className = `row${hovered ? ' hovered' : ''}${dragged ? ' dragged' : ''}`;

  return (
    <div
      className={className}
      style={{ paddingTop: 1, paddingBottom: 1 }}
      id={`svg_command_row_${index}`}
      tabIndex={0}
      onMouseEnter={() => store.setHoveredItem(item)}
      onMouseLeave={() => store.setHoveredItem(null)}
      onClick={() => store.setFocusedItem(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          store.setFocusedItem(item);
        }
        if (event.key === ' ') {
          store.setFocusedItem(item);
          event.preventDefault();
        }
      }}
    >
      <div
        className={`type-token${item.relative ? ' type-token-relative' : ''}`}
        role="button"
        aria-label={`Toggle ${item.getType()} command type`}
        aria-pressed={item.relative}
        tabIndex={0}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        onClick={() => {
          item.setRelative(!item.relative);
          store.afterModelChange();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            item.setRelative(!item.relative);
            store.afterModelChange();
          }
          if (event.key === ' ') {
            item.setRelative(!item.relative);
            store.afterModelChange();
            event.preventDefault();
          }
        }}
      >
        {item.getType()}
      </div>
      {item.values.map((value, i) => {
        if (isArc && (i === 3 || i === 4)) {
          return (
            <span key={i} className="small-checkbox">
              <AppTooltip title={store.getTooltip(item, i)} close>
                <Checkbox
                  checked={!!value}
                  onChange={(event) => store.setValue(item, i, event.target.checked ? 1 : 0)}
                  onFocus={() => store.setFocusedItem(item)}
                />
              </AppTooltip>
            </span>
          );
        }
        const col = isArc && i > 4 ? i - 1 : i;
        return (
          <NumberInput
            key={i}
            value={value}
            onChange={(newValue) => store.setValue(item, i, newValue)}
            formatterType="float"
            className="svg-value app-input"
            id={`svg_command_${index}_${col}`}
            tooltip={store.getTooltip(item, i)}
            onFocus={() => store.setFocusedItem(item)}
            keyboardNavigableIdPrefix="svg_command"
          />
        );
      })}
      <div style={{ flex: 1 }} />
      <IconButton
        className="more-button"
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        aria-label="Open command menu"
      >
        <MoreIcon />
      </IconButton>
      <CommandMenu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        item={item}
        onClose={() => setMenuAnchor(null)}
      />
    </div>
  );
});
