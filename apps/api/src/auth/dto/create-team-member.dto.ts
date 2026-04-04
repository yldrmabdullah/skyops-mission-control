import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { OperatorRole } from '../operator-role.enum';

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'pilot@skyops.io' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Jamie Pilot' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ enum: [OperatorRole.PILOT, OperatorRole.TECHNICIAN] })
  @IsIn([OperatorRole.PILOT, OperatorRole.TECHNICIAN], {
    message: 'Team members must be Pilot or Technician.',
  })
  role: OperatorRole.PILOT | OperatorRole.TECHNICIAN;
}
