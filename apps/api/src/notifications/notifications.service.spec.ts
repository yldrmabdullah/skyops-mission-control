import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { OperatorRole } from '../auth/operator-role.enum';
import { InAppNotification } from './entities/in-app-notification.entity';
import { NotificationsService } from './notifications.service';
import { INotificationsRepository } from './repositories/notifications.repository.interface';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: INotificationsRepository;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: INotificationsRepository,
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn(),
            findByUserId: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<INotificationsRepository>(INotificationsRepository);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should record notification if pref is enabled', async () => {
    const user = {
      id: 'user-1',
      email: 'u@example.com',
      passwordHash: 'hash',
      fullName: 'U',
      role: OperatorRole.MANAGER,
      notificationPreferences: {
        emailOnMaintenanceDue: false,
        inAppOnScheduleConflict: true,
      },
      workspaceOwnerId: null,
      mustChangePassword: false,
      createdAt: new Date(),
    } as User;
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(repository, 'save').mockResolvedValue({} as InAppNotification);

    await service.notifyScheduleConflictIfEnabled('user-1', 'Conflict detail');

    expect(repository.save).toHaveBeenCalled();
  });

  it('should mark notification as read', async () => {
    const mockNotif: InAppNotification = {
      id: 'notif-1',
      readAt: null,
      userId: 'user-1',
      title: 't',
      body: 'b',
      createdAt: new Date(),
    } as InAppNotification;
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockNotif);
    const saved: InAppNotification = {
      ...mockNotif,
      readAt: new Date(),
    } as InAppNotification;
    jest.spyOn(repository, 'save').mockResolvedValue(saved);

    const result = await service.markRead('user-1', 'notif-1');

    expect(result.readAt).toBeDefined();
  });
});
