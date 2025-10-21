import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notifications.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,
  ) {}

  async create(userId: string, auctionId: string, message: string) {
    const notification = this.notificationsRepo.create({
      userId,
      auctionId,
      message,
    });
    return await this.notificationsRepo.save(notification);
  }

  async findUserNotifications(userId: string) {
    return await this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    return this.notificationsRepo.update(id, { isRead: true });
  }

  async delete(id: string) {
    await this.notificationsRepo.softDelete(id);
    return { message: `Notification ${id} has been soft-deleted` };
  }
}
