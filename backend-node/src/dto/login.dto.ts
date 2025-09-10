import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Username for login' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password for login' })
  @IsString()
  password: string;
}
