import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { OperatorRole } from '../operator-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtPayloadUser {
  userId: string;
  email: string;
  role: OperatorRole;
  /** Fleet / drone / mission scope (manager id for team members, else own id). */
  fleetOwnerId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        'local-dev-only-change-in-production-32chars',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayloadUser> {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException();
    }

    const fleetOwnerId = user.workspaceOwnerId ?? user.id;

    return {
      userId: user.id,
      email: user.email,
      role: user.role ?? OperatorRole.PILOT,
      fleetOwnerId,
    };
  }
}
