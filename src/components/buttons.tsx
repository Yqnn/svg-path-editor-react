import { forwardRef } from 'react';
import Button, { type ButtonProps } from '@mui/material/Button';

export const FlatButton = forwardRef<HTMLButtonElement, ButtonProps>(function FlatButton(
  { className = '', ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="contained"
      disableElevation
      className={`flat-button ${className}`.trim()}
      {...props}
    />
  );
});

export const RaisedButton = forwardRef<HTMLButtonElement, ButtonProps>(function RaisedButton(
  { className = '', ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="contained"
      className={`raised-button ${className}`.trim()}
      {...props}
    />
  );
});
