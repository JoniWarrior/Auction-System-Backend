import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisClient: Redis;
  private readonly redlock: Redlock;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: '127.0.0.1',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
    });

    this.redlock = new Redlock([this.redisClient], {
      retryCount: 20,
      retryDelay: 80,
      retryJitter: 50,
    });
  }

  async withResourceLock<T>(
    resourceId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const resource = `lock:auction:${resourceId}`;
    const ttl = 15000;

    try {
      const lock = await this.redlock.acquire([resource], ttl);
      try {
        this.logger.log(`Acquired lock for resource ${resourceId}`);
        return await fn();
      } finally {
        this.logger.log(`Released lock for resource ${resourceId}`);
        await lock.release();
      }
    } catch (err: any) {
      if (err.name === 'LockError') {
        throw new Error('Too many requests!');
      }
      if (err.name === 'ExecutionError') {
        throw new Error('Auction is currently locked. Try again.');
      }
      throw err;
    }
  }
}
