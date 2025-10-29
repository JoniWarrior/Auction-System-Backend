import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity';
import { Item } from '../../entity/item.entity';
import { Bidding } from '../../entity/bidding.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Item, Bidding]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
