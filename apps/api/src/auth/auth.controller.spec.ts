import { Test, TestingModule } from '@nestjs/testing';
import { createMockJwtUser } from '../test-utils/mock-jwt-user';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = createMockJwtUser({ email: 'test@test.com' });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue({ accessToken: 'token' }),
            login: jest.fn().mockResolvedValue({ accessToken: 'token' }),
            getProfile: jest.fn().mockResolvedValue({ id: 'user-1' }),
            updateNotificationPreferences: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should call updatePrefs with correct DTO', async () => {
    const dto = { emailOnMaintenanceDue: true };
    await controller.updatePrefs(mockUser, dto);
    expect(service.updateNotificationPreferences).toHaveBeenCalledWith(
      'user-1',
      dto,
    );
  });
});
