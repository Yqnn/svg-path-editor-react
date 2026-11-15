import type { ReactNode } from 'react';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

function makeIcon(displayName: string, viewBox: string, children: ReactNode) {
  function Icon(props: SvgIconProps) {
    return (
      <SvgIcon viewBox={viewBox} {...props}>
        {children}
      </SvgIcon>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const MoreIcon = makeIcon(
  'MoreIcon',
  '0 0 10 10',
  <path d="M2 4a1 1 0 10.001 0H5a1 1 0 10.001 0H8a1 1 0 10.001 0" />,
);

export const GithubIcon = makeIcon(
  'GithubIcon',
  '0 0 16 16',
  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />,
);

export const SponsorIcon = makeIcon(
  'SponsorIcon',
  '0 0 16 13.92',
  <path
    d="M8 13.24C4.45 11.3.75 8 .75 4.5.75 2.2 2.55.75 4.25.75 6 .75 7.5 2 8 3.75c.5-1.75 2-3 3.75-3 1.7 0 3.5 1.45 3.5 3.75 0 3.5-3.7 6.8-7.25 8.74z"
    fill="none"
    stroke="#bf3989"
    strokeLinejoin="round"
    strokeWidth="1.5"
  />,
);

export const ZoomFitIcon = makeIcon(
  'ZoomFitIcon',
  '-4 -4 40 40',
  <path d="m12 0a1 1 0 000 24 1 1 0 000-24m0 20.5a1 1 0 010-17 1 1 0 010 17M9 10v-2q1.5 0 2-1h2v8h2v2h-6v-2h2v-5zm10.5 10.8 1 1v1.4l9 8.8 2.5-2.5-8.8-9h-1.4l-1-1" />,
);

export const ZoomInIcon = makeIcon(
  'ZoomInIcon',
  '-4 -4 40 40',
  <path d="m12 0a1 1 0 000 24 1 1 0 000-24m0 20.5a1 1 0 010-17 1 1 0 010 17m-1-13h2v3.5h3.5v2h-3.5v3.5h-2v-3.5h-3.5v-2h3.5zm8.5 13.3 1 1v1.4l9 8.8 2.5-2.5-8.8-9h-1.4l-1-1" />,
);

export const ZoomOutIcon = makeIcon(
  'ZoomOutIcon',
  '-4 -4 40 40',
  <path d="m12 0a1 1 0 000 24 1 1 0 000-24m0 20.5a1 1 0 010-17 1 1 0 010 17M7.5 11h9v2h-9zm12 9.8 1 1v1.4l9 8.8 2.5-2.5-8.8-9h-1.4l-1-1" />,
);
