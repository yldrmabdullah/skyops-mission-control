import { buildPaginationMeta } from './pagination';

describe('pagination.utils', () => {
  it('should build correct meta object', () => {
    const meta = buildPaginationMeta(1, 10, 25);
    expect(meta).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('should handle empty results', () => {
    const meta = buildPaginationMeta(1, 10, 0);
    expect(meta.totalPages).toBe(0);
  });
});
