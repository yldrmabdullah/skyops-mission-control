import { Injectable, Scope } from '@nestjs/common';

/**
 * Request-scoped provider to hold the current workspace context.
 * This avoids passing the fleetOwnerId as a parameter through every service call.
 */
@Injectable({ scope: Scope.REQUEST })
export class WorkspaceContext {
  private _fleetOwnerId?: string;
  private _actorId?: string;

  set(fleetOwnerId: string, actorId: string) {
    this._fleetOwnerId = fleetOwnerId;
    this._actorId = actorId;
  }

  get fleetOwnerId(): string {
    if (!this._fleetOwnerId) {
      throw new Error(
        'Workspace context was accessed before being initialized in the request.',
      );
    }
    return this._fleetOwnerId;
  }

  get actorId(): string {
    if (!this._actorId) {
      throw new Error(
        'Workspace context was accessed before being initialized in the request.',
      );
    }
    return this._actorId;
  }

  get isInitialized(): boolean {
    return !!this._fleetOwnerId && !!this._actorId;
  }
}
