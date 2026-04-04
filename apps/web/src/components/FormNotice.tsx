interface FormNoticeProps {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export function FormNotice({ tone, message }: FormNoticeProps) {
  return <div className={`form-notice ${tone}`}>{message}</div>;
}
