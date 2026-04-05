import { useCallback, useState } from 'react';

export type FeedbackTone = 'success' | 'error';

export type FormFeedback = { tone: FeedbackTone; message: string } | null;

export function useFeedbackState() {
  const [feedback, setFeedback] = useState<FormFeedback>(null);
  const clearFeedback = useCallback(() => setFeedback(null), []);
  return { feedback, setFeedback, clearFeedback } as const;
}
