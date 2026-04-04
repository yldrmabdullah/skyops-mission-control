import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtPayloadUser {
  userId: string;
  email: string;
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

    return { userId: user.id, email: user.email };
  }
}
