import { OperatorRole } from '../auth/operator-role.enum';
import type { JwtPayloadUser } from '../auth/strategies/jwt.strategy';

export function createMockJwtUser(
  overrides: Partial<JwtPayloadUser> = {},
): JwtPayloadUser {
  return {
    userId: 'user-1',
    email: 'user-1@example.com',
    role: OperatorRole.MANAGER,
    fleetOwnerId: 'user-1',
    ...overrides,
  };
}
