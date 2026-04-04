import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { InAppNotification } from './entities/in-app-notification.entity';
import { User } from '../auth/entities/user.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Repository<InAppNotification>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(InAppNotification),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
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
    repository = module.get<Repository<InAppNotification>>(
      getRepositoryToken(InAppNotification),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should record notification if pref is enabled', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue({
      notificationPreferences: { inAppOnScheduleConflict: true },
    } as any);
    jest.spyOn(repository, 'save').mockResolvedValue({} as any);

    await service.notifyScheduleConflictIfEnabled('user-1', 'Conflict detail');

    expect(repository.save).toHaveBeenCalled();
  });

  it('should mark notification as read', async () => {
    const mockNotif = { id: 'notif-1', readAt: null, userId: 'user-1' };
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockNotif as any);
    jest
      .spyOn(repository, 'save')
      .mockResolvedValue({ ...mockNotif, readAt: new Date() } as any);

    const result = await service.markRead('user-1', 'notif-1');

    expect(result.readAt).toBeDefined();
  });
});
