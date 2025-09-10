import {
  Controller,
  Get,
  Body,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SlugsService } from './slugs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShortenDto } from '../dto/shorten.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('slugs')
@ApiBearerAuth()
@Controller('api')
export class SlugsController {
  constructor(private readonly slugsService: SlugsService) {}

  @Post('/shorten')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a short URL' })
  @ApiResponse({ status: 201, description: 'Short URL created' })
  async shorten(@Body() dto: ShortenDto, @Req() req) {
    return await this.slugsService.shorten(dto, req);
  }

  @Get('/slugs')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List user slugs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'includeExpired', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of user slugs' })
  async getUserSlugs(
    @Req() req,
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('includeExpired') includeExpired?: string | boolean,
  ) {
    const username = req.user?.username;
    const pageNum = page && page > 0 ? page : 1;
    const sizeNum = size && size > 0 ? size : 100;
    let includeExpiredBool = false;
    if (typeof includeExpired === 'string') {
      includeExpiredBool = includeExpired.toLowerCase() === 'true';
    } else if (typeof includeExpired === 'boolean') {
      includeExpiredBool = includeExpired;
    }
    return this.slugsService.listUserSlugs(
      username,
      pageNum,
      sizeNum,
      includeExpiredBool,
    );
  }
}
