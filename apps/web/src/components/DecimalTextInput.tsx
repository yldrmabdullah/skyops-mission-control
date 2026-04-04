import type { InputHTMLAttributes } from 'react';

type DecimalTextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  value: string;
  onChange: (value: string) => void;
};

export function DecimalTextInput({
  value,
  onChange,
  ...rest
}: DecimalTextInputProps) {
  return (
    <input
      {...rest}
      autoComplete="off"
      inputMode="decimal"
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
