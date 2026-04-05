export const PASSWORD_POLICY_HINT =
  'At least 8 characters, including one letter and one number.';

const HAS_LETTER_AND_DIGIT = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/** Client-side checks before calling the API. Returns an error message or null if valid. */
export function validatePasswordChange(
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (newPassword !== confirmPassword) {
    return 'New passwords do not match.';
  }
  if (newPassword.length < 8) {
    return 'New password must be at least 8 characters.';
  }
  if (!HAS_LETTER_AND_DIGIT.test(newPassword)) {
    return PASSWORD_POLICY_HINT;
  }
  return null;
}
