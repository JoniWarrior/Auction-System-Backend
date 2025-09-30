import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Item } from "./../items/entities/item.entity";
import { Bidding } from "./../biddings/entities/bidding.entity";
import { JwtAuthModule } from "./../auth/guards/jwt-auth.module";
import { BiddingsModule } from 'src/biddings/biddings.module';
import { ItemsModule } from 'src/items/items.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Item, Bidding]),
    JwtAuthModule,
    BiddingsModule,
    ItemsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }
