import Checkbox from '@mui/material/Checkbox';
import type { ReactNode } from 'react';

interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function CheckboxField({
  checked,
  onChange,
  children,
  disabled,
  style,
}: CheckboxFieldProps) {
  return (
    <label className="checkbox-field" style={style}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}
