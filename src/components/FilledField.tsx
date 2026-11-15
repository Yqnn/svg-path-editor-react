import { useState, type ReactNode, type Ref } from 'react';

interface FilledFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  id?: string;
  endAdornment?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  type?: string;
}

export function FilledField({
  label,
  value,
  onChange,
  disabled,
  readOnly,
  autoFocus,
  id,
  endAdornment,
  inputRef,
  type = 'text',
}: FilledFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

  return (
    <div className="filled-field-wrap">
      <div
        className={`filled-field${floating ? ' floating' : ''}${focused ? ' focused' : ''}${
          disabled ? ' disabled' : ''
        }`}
      >
        <label htmlFor={id}>{label}</label>
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(event) => onChange?.(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={endAdornment ? { paddingRight: 48 } : undefined}
        />
        {endAdornment ? <div className="end-adornment">{endAdornment}</div> : null}
      </div>
    </div>
  );
}
