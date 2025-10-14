import { forwardRef, Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../entities/item.entity';
import { User } from "../entities/user.entity";
import { JwtAuthModule } from "./../auth/guards/jwt-auth.module";
import { CloudinaryConfig } from 'cloudinary.config';
import { UsersModule } from 'src/users/users.module';
@Module({
  imports: [TypeOrmModule.forFeature([Item, User]),
    JwtAuthModule,
  forwardRef(() => UsersModule)],
  controllers: [ItemsController],
  providers: [ItemsService, CloudinaryConfig],
  exports: [ItemsService]
})
export class ItemsModule { }
