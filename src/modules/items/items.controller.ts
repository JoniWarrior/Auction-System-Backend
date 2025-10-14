import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ItemsService } from './items.service';
import { type CreateItem } from "./types/create-item.type"
import { type UpdateItem } from './types/update-item.type';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import {Roles, RolesGuard} from "../../auth/guards/roles.guards";
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from "multer";
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import Joi from 'joi';

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("seller")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  create(@Body(ValidationPipe.from(Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required().min(15),
  sellerId: Joi.string().guid({ version: 'uuidv4' }),
}))) createItem: CreateItem, @UploadedFile() file: Express.Multer.File) {
    return this.itemsService.create(createItem, file);
  }

  @Get()
  findAll() {
    return this.itemsService.findAll();
  }

  @Get("/my-empty-items")
  findMyEmptyItems(@Req() req : Request) {
    const id = req["user"].id;
    const user = req["user"];
    return this.itemsService.findMyItemsWithoutAuction(user.id);
  }

  @Get(':id/items')
  findSellerItems(@Param('id') id: string) {
    return this.itemsService.findSellerItems(id);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe.from(Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required().min(15),
  sellerId: Joi.string().guid({ version: 'uuidv4' }),
}))) updateItem: UpdateItem) {
    return this.itemsService.update(id, updateItem);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}