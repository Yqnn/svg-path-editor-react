import { useState, type AnimationEvent, type ReactNode } from 'react';
import Icon from '@mui/material/Icon';

interface ExpandableProps {
  panelTitle: string;
  panelInfo?: string;
  opened?: boolean;
  children: ReactNode;
}

export function Expandable({
  panelTitle,
  panelInfo,
  opened: initialOpened = true,
  children,
}: ExpandableProps) {
  const [opened, setOpened] = useState(initialOpened);
  const [rendered, setRendered] = useState(initialOpened);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(false);

  const toggle = () => {
    if (opened) {
      setOpened(false);
      setClosing(true);
    } else {
      setOpened(true);
      setRendered(true);
      setClosing(false);
      setEntering(true);
    }
  };

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (closing) {
      setRendered(false);
      setClosing(false);
    } else {
      setEntering(false);
    }
  };

  return (
    <div className="expandable">
      <div
        className="expandable-title"
        role="button"
        tabIndex={0}
        aria-expanded={opened}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            toggle();
          }
          if (event.key === ' ') {
            toggle();
            event.preventDefault();
          }
        }}
      >
        <span className="panel-title">{panelTitle}</span>
        {panelInfo ? <div className="panel-info">{panelInfo}</div> : null}
        <Icon>{opened ? 'expand_more' : 'expand_less'}</Icon>
      </div>
      {rendered ? (
        <div
          className={`panel${closing ? ' panel-leave' : entering ? ' panel-enter' : ''}`}
          onAnimationEnd={handleAnimationEnd}
        >
          <div className="panel-content">
            <div className="panel-inner">{children}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
