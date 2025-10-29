import { forwardRef, Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../../entity/item.entity';
import { User } from '../../entity/user.entity';
import { CloudinaryConfig } from 'cloudinary.config';
import { UsersModule } from 'src/module/users/users.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Item, User]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ItemsController],
  providers: [ItemsService, CloudinaryConfig],
  exports: [ItemsService],
})
export class ItemsModule {}
