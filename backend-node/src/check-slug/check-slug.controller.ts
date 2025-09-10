import { Controller, Post, Body } from '@nestjs/common';
import { CheckSlugService } from './check-slug.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('check-slug')
@Controller('api')
export class CheckSlugController {
  constructor(private readonly checkSlugService: CheckSlugService) {}

  @Post('checkSlug')
  @ApiOperation({ summary: 'Check if a slug is available' })
  @ApiBody({
    schema: { type: 'object', properties: { slug: { type: 'string' } } },
  })
  @ApiResponse({ status: 200, description: 'Slug is available' })
  async check(@Body('slug') slug: string) {
    return await this.checkSlugService.check(slug);
  }
}
