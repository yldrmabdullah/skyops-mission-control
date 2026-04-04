import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { OperatorRole } from './operator-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'find' | 'create' | 'save' | 'count'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((u) => u as User),
      save: jest.fn((u) => Promise.resolve(u as User)),
      count: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registerBootstrap rejects when workspace already exists', async () => {
    usersRepository.count.mockResolvedValue(1);

    await expect(
      service.registerBootstrap({
        email: 'new@example.com',
        password: 'Secret1a',
        fullName: 'Test',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('registerBootstrap rejects when email exists', async () => {
    usersRepository.count.mockResolvedValue(0);
    usersRepository.findOne.mockResolvedValue({ id: 'u1' } as User);

    await expect(
      service.registerBootstrap({
        email: 'taken@example.com',
        password: 'Secret1a',
        fullName: 'Test',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('registerBootstrap creates first Manager', async () => {
    usersRepository.count.mockResolvedValue(0);
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockImplementation(async (u) => u as User);

    await service.registerBootstrap({
      email: 'mgr@example.com',
      password: 'Secret1a',
      fullName: 'Manager User',
    });

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: OperatorRole.MANAGER,
        workspaceOwnerId: null,
        mustChangePassword: false,
      }),
    );
  });

  it('rejects login when user is missing', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'Secret1a' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('createTeamMember creates Pilot with mustChangePassword', async () => {
    usersRepository.findOne
      .mockResolvedValueOnce({
        id: 'mgr-1',
        role: OperatorRole.MANAGER,
        workspaceOwnerId: null,
      } as User)
      .mockResolvedValueOnce(null);
    usersRepository.save.mockImplementation(async (u) => ({
      ...(u as User),
      id: 'pilot-1',
      createdAt: new Date(),
    }));

    const result = await service.createTeamMember('mgr-1', {
      email: 'p@example.com',
      fullName: 'Pilot',
      role: OperatorRole.PILOT,
    });

    expect(result.temporaryPassword).toBeTruthy();
    expect(result.member.role).toBe(OperatorRole.PILOT);
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceOwnerId: 'mgr-1',
        mustChangePassword: true,
      }),
    );
  });

  it('listWorkspaceDirectory returns owner and invitees sorted by name', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'mgr-1',
      email: 'm@example.com',
      fullName: 'Zed Manager',
      role: OperatorRole.MANAGER,
      workspaceOwnerId: null,
    } as User);
    usersRepository.find.mockResolvedValue([
      {
        id: 'p1',
        email: 'a@example.com',
        fullName: 'Alex Pilot',
        role: OperatorRole.PILOT,
        mustChangePassword: true,
      },
    ] as User[]);

    const rows = await service.listWorkspaceDirectory('mgr-1', 'mgr-1');

    expect(rows).toHaveLength(2);
    expect(rows[0].fullName).toBe('Alex Pilot');
    expect(rows[1].fullName).toBe('Zed Manager');
    expect(rows[0].mustChangePassword).toBe(true);
  });

  it('listWorkspaceDirectory hides mustChangePassword from non-managers', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'mgr-1',
      email: 'm@example.com',
      fullName: 'Manager',
      role: OperatorRole.MANAGER,
      workspaceOwnerId: null,
    } as User);
    usersRepository.find.mockResolvedValue([
      {
        id: 'p1',
        email: 'p@example.com',
        fullName: 'Pilot',
        role: OperatorRole.PILOT,
        mustChangePassword: true,
      },
    ] as User[]);

    const rows = await service.listWorkspaceDirectory('mgr-1', 'p1');

    expect(rows.find((r) => r.id === 'p1')?.mustChangePassword).toBeUndefined();
  });
});
