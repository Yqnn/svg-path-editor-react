import type { ReactElement, ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';

interface AppTooltipProps {
  title: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  children: ReactElement;
  /** Shifts the tooltip closer to its anchor, like the original `.app-tooltip` class. */
  close?: boolean;
}

export function AppTooltip({
  title,
  placement = 'bottom',
  disabled = false,
  children,
  close = false,
}: AppTooltipProps) {
  return (
    <Tooltip
      title={disabled ? '' : title}
      placement={placement}
      disableInteractive
      enterDelay={0}
      leaveDelay={0}
      slotProps={{
        popper: {
          modifiers: close
            ? [
                {
                  name: 'offset',
                  options: { offset: [0, -11] },
                },
              ]
            : undefined,
        },
      }}
    >
      {children}
    </Tooltip>
  );
}
