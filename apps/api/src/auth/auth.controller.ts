import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { BootstrapRegisterDto } from './dto/bootstrap-register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OperatorRole } from './operator-role.enum';
import type { JwtPayloadUser } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Whether registration is open' })
  @ApiResponse({ status: 200 })
  async status() {
    return { bootstrapAvailable: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Create a new workspace Manager' })
  @ApiResponse({ status: 201, description: 'Registered and authenticated' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() dto: BootstrapRegisterDto) {
    return this.authService.registerManager(dto);
  }

  @Public()
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Sign in and receive a JWT' })
  @ApiResponse({ status: 200, description: 'Authenticated' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current session profile' })
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.authService.getProfile(user.userId);
  }

  @Patch('me/profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update display name' })
  updateProfile(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @Patch('me/password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password (required after one-time login password)' })
  @ApiResponse({ status: 401, description: 'Current password wrong' })
  changePassword(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Patch('me/notification-preferences')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update notification preference flags' })
  updatePrefs(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.authService.updateNotificationPreferences(user.userId, dto);
  }

  @Post('team/members')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create Pilot or Technician with one-time password (Manager only)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, description: 'Not a workspace Manager' })
  @Roles(OperatorRole.MANAGER)
  createTeamMember(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.authService.createTeamMember(user.userId, dto);
  }

  @Get('team/members')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'List workspace members (email, name, role). Managers also see pending first-time password for invitees.',
  })
  listWorkspaceMembers(@CurrentUser() user: JwtPayloadUser) {
    return this.authService.listWorkspaceDirectory(
      user.fleetOwnerId,
      user.userId,
    );
  }
}
