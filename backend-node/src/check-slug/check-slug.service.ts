import { Injectable } from '@nestjs/common';
import { MongoService } from '../services/mongo.service';
import { validateSlug } from '../utils/validateSlug';

@Injectable()
export class CheckSlugService {
  constructor(private readonly mongo: MongoService) {}

  async check(slug: string) {
    if (!validateSlug(slug)) {
      return { available: false, message: 'Invalid format' };
    }
    const existing = await this.mongo.findUrlBySlug(slug);
    if (existing) {
      return { available: false, message: 'Slug already exists' };
    }
    return { available: true, message: '' };
  }
}
