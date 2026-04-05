import { SetMetadata } from '@nestjs/common';
import { OperatorRole } from '../operator-role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: OperatorRole[]) =>
  SetMetadata(ROLES_KEY, roles);
