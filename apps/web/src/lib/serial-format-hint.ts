const SERIAL_FORMAT_OK =
  'Matches the required SKY-XXXX-XXXX pattern.' as const;

export function getSerialFormatHint(raw: string): {
  valid: boolean;
  text: string;
} {
  const v = raw.trim().toUpperCase();

  if (/^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(v)) {
    return { valid: true, text: SERIAL_FORMAT_OK };
  }

  if (v.length === 0) {
    return {
      valid: false,
      text: 'Pattern: SKY- then two groups of 4 letters or digits (example: SKY-A1B2-C3D4).',
    };
  }

  if (!v.startsWith('SKY')) {
    return { valid: false, text: 'Start with SKY- (SkyOps serial prefix).' };
  }

  if (v.length === 3) {
    return { valid: false, text: 'Add a hyphen after SKY: SKY-' };
  }

  if (v[3] !== '-') {
    return { valid: false, text: 'The fourth character must be a hyphen (-).' };
  }

  const rest = v.slice(4);
  const hyphenIdx = rest.indexOf('-');

  if (hyphenIdx === -1) {
    const invalidChar = [...rest].some((c) => !/[A-Z0-9]/.test(c));
    if (invalidChar) {
      return {
        valid: false,
        text: 'First group: use only letters and digits.',
      };
    }
    if (rest.length < 4) {
      return {
        valid: false,
        text: `First group: ${rest.length}/4 characters.`,
      };
    }
    if (rest.length > 4) {
      return {
        valid: false,
        text: 'First group is 4 characters, then add another hyphen.',
      };
    }
    return {
      valid: false,
      text: 'Add a hyphen, then the second 4-character group.',
    };
  }

  const block1 = rest.slice(0, hyphenIdx);
  const block2 = rest.slice(hyphenIdx + 1);

  if (block1.length > 4) {
    return {
      valid: false,
      text: 'First group can be at most 4 characters before the second hyphen.',
    };
  }

  if (!/^[A-Z0-9]*$/.test(block1)) {
    return { valid: false, text: 'First group: only letters and digits.' };
  }

  if (block1.length < 4) {
    return {
      valid: false,
      text: `First group: ${block1.length}/4 characters.`,
    };
  }

  if (!/^[A-Z0-9]*$/.test(block2)) {
    return { valid: false, text: 'Second group: only letters and digits.' };
  }

  if (block2.length < 4) {
    return {
      valid: false,
      text: `Second group: ${block2.length}/4 characters.`,
    };
  }

  if (block2.length > 4) {
    return {
      valid: false,
      text: 'Second group must be exactly 4 characters (no extra characters after).',
    };
  }

  return { valid: true, text: SERIAL_FORMAT_OK };
}
