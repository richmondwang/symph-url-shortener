import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Username for registration' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password for registration' })
  @IsString()
  password: string;
}
