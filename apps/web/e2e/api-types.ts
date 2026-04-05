/** Shape of JSON error bodies from {@link HttpExceptionFilter} (API). */
export type SkyopsApiErrorBody = {
  statusCode?: number;
  message?: string | string[];
  code?: string;
  details?: unknown;
  path?: string;
};
