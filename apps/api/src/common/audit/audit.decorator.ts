import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA_KEY = 'audit_metadata';

export interface AuditOptions {
  action: string;
  entityType: string;
  /**
   * Optional function to extract entityId from the result or arguments
   */
  extractEntityId?: (result: unknown) => string;
}

export const Audit = (options: AuditOptions) =>
  SetMetadata(AUDIT_METADATA_KEY, options);
