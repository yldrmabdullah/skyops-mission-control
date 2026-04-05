import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Jamie Pilot' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;
}
