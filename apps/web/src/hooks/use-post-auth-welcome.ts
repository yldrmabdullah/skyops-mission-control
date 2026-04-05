import { useEffect, useRef, useState } from 'react';
import { consumePostAuthWelcomeFlag } from '../auth/post-auth-welcome';
import type { AuthUser } from '../types/api';
import { postAuthWelcomeMessage } from '../lib/role-descriptions';

export function usePostAuthWelcomeMessage(user: AuthUser | null | undefined) {
  const [message, setMessage] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!user || handled.current) {
      return;
    }

    handled.current = true;

    if (!consumePostAuthWelcomeFlag()) {
      return;
    }

    const text = postAuthWelcomeMessage(user.role);
    queueMicrotask(() => {
      setMessage(text);
    });
  }, [user]);

  return message;
}
