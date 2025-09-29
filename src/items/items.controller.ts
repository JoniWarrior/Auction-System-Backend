import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from './../auth/guards/auth.guards';
import {Roles, RolesGuard} from "./../auth/guards/roles.guards";
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from "multer";

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles("seller")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  create( @Body() createItemDto: CreateItemDto, @UploadedFile() file: Express.Multer.File) {
    return this.itemsService.create(createItemDto, file);
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}