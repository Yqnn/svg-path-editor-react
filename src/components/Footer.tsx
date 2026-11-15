import { memo } from 'react';
import { GithubIcon, SponsorIcon } from './icons';

export const Footer = memo(function Footer() {
  return (
    <div className="footer">
      <a href="https://github.com/Yqnn/svg-path-editor" target="_blank" rel="noreferrer">
        <GithubIcon /> GitHub
      </a>
      <a href="https://github.com/sponsors/Yqnn" target="_blank" rel="noreferrer">
        <SponsorIcon className="sponsor" /> Sponsor
      </a>
    </div>
  );
});
