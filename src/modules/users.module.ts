import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UsersController } from '../users/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Item } from "../entities/item.entity";
import { Bidding } from "../entities/bidding.entity";
import { JwtAuthModule } from "../auth/guards/jwt-auth.module";
import { BiddingsModule } from './biddings.module';
import { ItemsModule } from 'src/modules/items.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Item, Bidding]),
    JwtAuthModule,
    forwardRef(() => BiddingsModule),
    forwardRef(() => ItemsModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }
