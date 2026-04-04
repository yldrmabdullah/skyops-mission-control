interface FormNoticeProps {
  tone: 'success' | 'error' | 'warning';
  message: string;
}

export function FormNotice({ tone, message }: FormNoticeProps) {
  return <div className={`form-notice ${tone}`}>{message}</div>;
}
