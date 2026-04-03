export const numericTransformer = {
  to(value?: number | null) {
    return value ?? null;
  },
  from(value?: string | null) {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  },
};
