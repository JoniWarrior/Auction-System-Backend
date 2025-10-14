import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Item } from '../../entities/item.entity';
import { Bidding } from '../../entities/bidding.entity';
import { JwtAuthModule } from '../../auth/guards/jwt-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Item, Bidding]),
    JwtAuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
