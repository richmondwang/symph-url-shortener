import {
  Controller,
  Get,
  GoneException,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import { RedirectService } from './redirect.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('redirect')
@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Redirect to destination URL by slug' })
  @ApiParam({ name: 'slug', description: 'Short URL slug' })
  @ApiResponse({ status: 301, description: 'Permanent redirect' })
  @ApiResponse({ status: 302, description: 'Temporary redirect' })
  @ApiResponse({ status: 404, description: 'Slug not found' })
  @ApiResponse({ status: 410, description: 'Link expired' })
  async redirectSlug(@Param('slug') slug: string, @Req() req) {
    const result = await this.redirectService.getSlug(slug);
    if (!result || !result.url) {
      throw new NotFoundException();
    }
    // Expired
    if (result.expireAt && new Date(result.expireAt) < new Date()) {
      throw new GoneException('This link has expired');
    }
    // Use 302 for temporary links (with expiration), 301 for permanent
    let status = 301;
    if (result.expireAt && new Date(result.expireAt) > new Date()) {
      status = 302;
    }
    // Depending on the requirement, adjust or remove the no-cache headers
    if (req && result.trackClicks) {
      req.res?.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      req.res?.setHeader('Pragma', 'no-cache');
      req.res?.setHeader('Expires', '0');
    }
    // Redirect
    req.res?.redirect(status, result.url);
    return;
  }
}
