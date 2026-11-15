import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { formatNumber } from '../lib/svg';
import { sanitizeNumberInput, type FormatterType } from '../editor/formatter';
import { AppTooltip } from './AppTooltip';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  formatterType?: FormatterType;
  suffix?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  tooltip?: string;
  onFocus?: () => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  keyboardNavigableIdPrefix?: string;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Port of the Angular `appFormatter` directive (and `appKeyboardNavigable`
 * when a prefix is provided).
 */
export function NumberInput({
  value,
  onChange,
  formatterType = 'float',
  suffix = '',
  id,
  className,
  style,
  disabled,
  tooltip,
  onFocus,
  onKeyDown,
  keyboardNavigableIdPrefix,
  placeholder,
  ariaLabel,
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const internalValue = useRef(0);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    if (value !== parseFloat(input.value)) {
      input.value = formatNumber(value, 4) + suffix;
      internalValue.current = value;
    }
  }, [value, suffix]);

  const setFocus = (row: number, col: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!keyboardNavigableIdPrefix) {
      return false;
    }
    const el = document.getElementById(
      `${keyboardNavigableIdPrefix}_${row}_${col}`,
    ) as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
      event.preventDefault();
      return true;
    }
    return false;
  };

  const moveFocusTo = (
    type: 'left' | 'right' | 'up' | 'down',
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    const id = inputRef.current?.getAttribute('id') || '';
    let row = parseInt(id.replace(/.*_([0-9]+)_[0-9]+$/, '$1'), 10);
    let col = parseInt(id.replace(/.*_[0-9]+_([0-9]+)$/, '$1'), 10);

    if (type === 'up') {
      row -= 1;
    }
    if (type === 'down') {
      row += 1;
    }
    if (type === 'left') {
      col -= 1;
    }
    if (type === 'right') {
      col += 1;
    }
    let count = 0;
    while (row >= 0 && count < 3) {
      if (setFocus(row, col, event)) {
        return;
      }
      if (type === 'right') {
        if (setFocus(row, col + 1, event) || setFocus(row + 1, 0, event)) {
          return;
        }
      }
      if (type === 'left') {
        if (col > 0 && setFocus(row, col - 1, event)) {
          return;
        }
        let col2 = 7;
        while (col2 >= 0) {
          col2--;
          if (setFocus(row - 1, col2, event)) {
            return;
          }
        }
      }
      let col3 = col;
      while ((type === 'down' || type === 'up') && col3 > 0) {
        col3--;
        if (setFocus(row, col3, event)) {
          return;
        }
      }
      count++;
      if (type === 'up' || type === 'left') {
        row--;
      } else {
        row++;
      }
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (input && keyboardNavigableIdPrefix) {
      const selStart = input.selectionStart;
      const selEnd = input.selectionEnd;
      if (selStart === selEnd) {
        if (selStart === 0) {
          if (event.key === 'ArrowLeft') {
            moveFocusTo('left', event);
          }
          if (event.key === 'ArrowUp') {
            moveFocusTo('up', event);
          }
        }
        if (selStart === input.value.length) {
          if (event.key === 'ArrowRight') {
            moveFocusTo('right', event);
          }
          if (event.key === 'ArrowDown') {
            moveFocusTo('down', event);
          }
        }
      }
    }
    onKeyDown?.(event);
  };

  const input = (
    <input
      ref={inputRef}
      type="text"
      id={id}
      className={className}
      style={style}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={() => {
        const el = inputRef.current;
        if (el && suffix !== '') {
          el.value = el.value.replace(suffix, '');
        }
        onFocus?.();
      }}
      onBlur={() => {
        const el = inputRef.current;
        if (!el) {
          return;
        }
        if (internalValue.current !== parseFloat(el.value)) {
          el.value = formatNumber(internalValue.current, 4);
        }
        if (suffix !== '') {
          el.value += suffix;
        }
      }}
      onInput={() => {
        const el = inputRef.current;
        if (!el) {
          return;
        }
        const sanitized = sanitizeNumberInput(el.value, formatterType);
        if (el.value !== sanitized) {
          el.value = sanitized;
        }
        const floatValue = parseFloat(sanitized);
        if (!isNaN(floatValue)) {
          internalValue.current = floatValue;
          onChange(floatValue);
        }
      }}
      onKeyDown={handleKeyDown}
    />
  );

  if (tooltip !== undefined) {
    return (
      <AppTooltip title={tooltip} close>
        {input}
      </AppTooltip>
    );
  }
  return input;
}
