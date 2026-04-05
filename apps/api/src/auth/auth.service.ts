import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { BootstrapRegisterDto } from './dto/bootstrap-register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from './notification-preferences.types';
import { OperatorRole } from './operator-role.enum';
import type { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

function generateTemporaryPassword(): string {
  return randomBytes(14).toString('base64url');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /** Register a new workspace Manager account (each is an independent fleet owner). */
  async registerManager(dto: BootstrapRegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: OperatorRole.MANAGER,
      workspaceOwnerId: null,
      mustChangePassword: false,
      notificationPreferences: { ...defaultNotificationPreferences },
    });

    await this.usersRepository.save(user);
    return this.buildAuthResponse(user);
  }

  async createTeamMember(managerId: string, dto: CreateTeamMemberDto) {
    const manager = await this.usersRepository.findOne({
      where: { id: managerId },
    });
    if (
      !manager ||
      manager.role !== OperatorRole.MANAGER ||
      manager.workspaceOwnerId !== null
    ) {
      throw new ForbiddenException(
        'Only the workspace Manager can create team accounts.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const user = this.usersRepository.create({
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role,
      workspaceOwnerId: managerId,
      mustChangePassword: true,
      notificationPreferences: { ...defaultNotificationPreferences },
    });

    await this.usersRepository.save(user);

    return {
      member: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
      temporaryPassword,
    };
  }

  /**
   * Workspace directory: root Manager + everyone they invited.
   * Any authenticated member of the workspace may read it.
   * `mustChangePassword` is included only for the workspace Manager (invite tracking).
   */
  async listWorkspaceDirectory(fleetOwnerId: string, actorUserId: string) {
    const owner = await this.usersRepository.findOne({
      where: { id: fleetOwnerId },
      select: ['id', 'email', 'fullName', 'role', 'workspaceOwnerId'],
    });

    if (!owner || owner.workspaceOwnerId !== null) {
      throw new ForbiddenException('Invalid workspace.');
    }

    const invitees = await this.usersRepository.find({
      where: { workspaceOwnerId: fleetOwnerId },
      select: ['id', 'email', 'fullName', 'role', 'mustChangePassword'],
    });

    const isRootManager = actorUserId === fleetOwnerId;

    const rows: {
      id: string;
      email: string;
      fullName: string;
      role: OperatorRole;
      mustChangePassword?: boolean;
    }[] = [
      {
        id: owner.id,
        email: owner.email,
        fullName: owner.fullName,
        role: owner.role,
      },
      ...invitees.map((m) => ({
        id: m.id,
        email: m.email,
        fullName: m.fullName,
        role: m.role,
        ...(isRootManager ? { mustChangePassword: m.mustChangePassword } : {}),
      })),
    ];

    rows.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }),
    );

    return rows;
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException();
    }

    const prefs: NotificationPreferences = {
      ...defaultNotificationPreferences,
      ...(user.notificationPreferences ?? {}),
    };

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      workspaceOwnerId: user.workspaceOwnerId,
      notificationPreferences: prefs,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    user.fullName = dto.fullName.trim();
    await this.usersRepository.save(user);
    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = false;
    await this.usersRepository.save(user);

    return { success: true as const };
  }

  async updateNotificationPreferences(
    userId: string,
    patch: Partial<NotificationPreferences>,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException();
    }

    user.notificationPreferences = {
      ...defaultNotificationPreferences,
      ...(user.notificationPreferences ?? {}),
      ...patch,
    };

    await this.usersRepository.save(user);

    return {
      notificationPreferences: user.notificationPreferences,
    };
  }

  private async buildAuthResponse(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const notificationPreferences: NotificationPreferences = {
      ...defaultNotificationPreferences,
      ...(user.notificationPreferences ?? {}),
    };

    return {
      accessToken,
      tokenType: 'Bearer' as const,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        workspaceOwnerId: user.workspaceOwnerId ?? null,
        notificationPreferences,
      },
    };
  }
}
