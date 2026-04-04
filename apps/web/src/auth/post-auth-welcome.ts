const POST_AUTH_WELCOME_KEY = 'skyops_post_auth_welcome';

export function consumePostAuthWelcomeFlag(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }

  if (sessionStorage.getItem(POST_AUTH_WELCOME_KEY) !== '1') {
    return false;
  }

  sessionStorage.removeItem(POST_AUTH_WELCOME_KEY);
  return true;
}

export function markPostAuthWelcome() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(POST_AUTH_WELCOME_KEY, '1');
  }
}
