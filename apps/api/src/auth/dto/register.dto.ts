import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'jane.pilot@skyops.io' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'SecurePass1',
    description: 'At least 8 characters, with one letter and one number.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must include at least one letter and one number.',
  })
  password: string;

  @ApiProperty({ example: 'Jane Pilot' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;
}
