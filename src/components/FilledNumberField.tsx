import type { FormatterType } from '../editor/formatter';
import { NumberInput } from './NumberInput';

interface FilledNumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  formatterType?: FormatterType;
  disabled?: boolean;
  id?: string;
}

export function FilledNumberField({
  label,
  value,
  onChange,
  formatterType = 'float',
  disabled,
  id,
}: FilledNumberFieldProps) {
  return (
    <div className="filled-field-wrap">
      <div className={`filled-field floating${disabled ? ' disabled' : ''}`}>
        <label htmlFor={id}>{label}</label>
        <NumberInput
          id={id}
          value={value}
          onChange={onChange}
          formatterType={formatterType}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
