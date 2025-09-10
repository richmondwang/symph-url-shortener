import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongoService {
  private client: MongoClient;
  private db: Db;
  constructor(private readonly configService: ConfigService) {
    const uri = this.configService.get<string>('MONGO_URI')!;
    this.client = new MongoClient(uri);
  }

  async connect() {
    if (!this.db) {
      await this.client.connect();
      const dbName = this.configService.get<string>('MONGO_DB')!;
      this.db = this.client.db(dbName);
      await this.ensureIndexes();
    }
    return this.db;
  }

  async ensureIndexes() {
    const links = await this.getLinksCollection();
    await links.createIndex({ slug: 1 }, { unique: true });
    await links.createIndex({ expireAt: 1 });
  }

  async getCollection(name: string) {
    await this.connect();
    return this.db.collection(name);
  }

  async getLinksCollection() {
    return this.getCollection('links');
  }

  async getUsersCollection() {
    return this.getCollection('users');
  }

  async incrementClicks(slug: string) {
    const collection = await this.getLinksCollection();
    await collection.updateOne({ slug }, { $inc: { redirectCount: 1 } });
  }

  async findUrlBySlug(slug: string) {
    const collection = await this.getLinksCollection();
    return collection.findOne({ slug });
  }

  async insertShortUrl(shortUrl: any) {
    const collection = await this.getLinksCollection();
    return collection.insertOne(shortUrl);
  }

  async findUserByUsername(username: string) {
    const collection = await this.getUsersCollection();
    return collection.findOne({ username });
  }

  async insertUser(user: any) {
    const collection = await this.getUsersCollection();
    return collection.insertOne(user);
  }

  async findUserSlugs(
    username: string,
    page: number,
    size: number,
    includeExpired: boolean,
  ) {
    const collection = await this.getLinksCollection();
    const query: any = { createdBy: username };
    if (!includeExpired) {
      query.$or = [
        { expireAt: { $exists: false } },
        { expireAt: { $gt: new Date() } },
      ];
    }
    const intSize = Number.isInteger(size)
      ? size
      : parseInt(String(size), 10) || 100;
    const cursor = collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * intSize)
      .limit(intSize);
    return cursor.toArray();
  }
}
