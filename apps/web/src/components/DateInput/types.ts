export type DateInputType = 'date' | 'datetime-local';

export interface DateInputProps {
  /** Smaller control + label (e.g. filter toolbars). */
  compact?: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: DateInputType;
  value: string;
}
