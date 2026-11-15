export type MenuMode = 'default' | 'before' | 'side';

/**
 * Chooses menu origins, reproducing Angular Material's `mat-menu` placement:
 * - `default`: opens below, left edges aligned with the trigger (`xPosition="after"`).
 * - `before`: opens below, right edges aligned with the trigger (`xPosition="before"`).
 * - `side`: opens beside a menu item, left edge aligned with the item's right edge.
 * Menus flip above their trigger when there is not enough room below.
 */
export function getMenuOrigins(anchorEl: HTMLElement | null, itemCount: number, mode: MenuMode) {
  const estimatedHeight = itemCount * 48 + 16;
  const rect = anchorEl?.getBoundingClientRect();
  const openAbove = rect ? window.innerHeight - rect.bottom < estimatedHeight : false;

  if (mode === 'side') {
    return {
      anchorOrigin: { vertical: 'top' as const, horizontal: 'right' as const },
      transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    };
  }

  return {
    anchorOrigin: {
      vertical: openAbove ? ('top' as const) : ('bottom' as const),
      horizontal: mode === 'default' ? ('left' as const) : ('right' as const),
    },
    transformOrigin: {
      vertical: openAbove ? ('bottom' as const) : ('top' as const),
      horizontal: mode === 'before' ? ('right' as const) : ('left' as const),
    },
  };
}

export function SubmenuArrow() {
  return (
    <svg viewBox="0 0 5 10" focusable="false" aria-hidden="true" className="menu-submenu-arrow">
      <polygon points="0,0 5,5 0,10" />
    </svg>
  );
}
