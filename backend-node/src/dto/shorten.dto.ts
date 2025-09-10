import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShortenDto {
  @ApiProperty({ description: 'Destination URL to shorten' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Custom slug for the short URL' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Expiration date/time (ISO string)' })
  @IsOptional()
  @IsString()
  expiration?: string;

  @ApiPropertyOptional({
    description: 'UTM parameters for tracking',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  utms?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Enable click tracking',
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  trackClicks?: boolean;
}
