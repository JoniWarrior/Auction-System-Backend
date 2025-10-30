import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { type CreateItem } from 'src/def/types/item/create-item.type';
import { type UpdateItem } from 'src/def/types/item/update-item.type';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import Joi from 'joi';
import { CurrentLoggedInUser } from 'src/decorator/current-user.decorator';
import { type PaginationQuery } from 'src/def/pagination-query';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', { storage: multer.memoryStorage() }),
  )
  create(
    @Body(
      ValidationPipe.from(
        Joi.object({
          title: Joi.string().required(),
          description: Joi.string().required().min(15),
          sellerId: Joi.string().guid({ version: 'uuidv4' }),
        }),
      ),
    )
    createItem: CreateItem,
    @UploadedFile() file: Express.Multer.File,
    @CurrentLoggedInUser('id') sellerId: string,
  ) {
    return this.itemsService.create(createItem, file, sellerId);
  }

  @Get()
  findItems(
    @Query(
      ValidationPipe.from(
        Joi.object({
          qs: Joi.string(),
          page: Joi.number().positive().default(1),
          pageSize: Joi.number().positive().default(10),
        }),
      ),
    )
    query: PaginationQuery,
  ) {
    return this.itemsService.findAll(query);
  }

  @Get('/my-empty-items')
  findMyEmptyItems(@CurrentLoggedInUser('id') sellerId: string) {
    return this.itemsService.findMyItemsWithoutAuction(sellerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(
      ValidationPipe.from(
        Joi.object({
          title: Joi.string().required(),
          description: Joi.string().required().min(15),
          sellerId: Joi.string().guid({ version: 'uuidv4' }),
        }),
      ),
    )
    updateItem: UpdateItem,
  ) {
    return this.itemsService.update(id, updateItem);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemsService.delete(id);
  }
}
