import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from './../auth/guards/auth.guards';
import {Roles, RolesGuard} from "./../auth/guards/roles.guards";
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from "multer";

@Controller('items')
@UseGuards(JwtAuthGuard) 
@Roles("seller")
@UseGuards(RolesGuard) 
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('File in controller:', {
      originalname: file?.originalname,
      buffer: file?.buffer ? 'exists' : 'missing',
      size: file?.size,
    });
    return this.itemsService.create(createItemDto, file);
  }

  @Get()
  findAll() {
    return this.itemsService.findAll();
  }

  @Get("/my-empty-items")
  findMyEmptyItems(@Req() req : Request) {
    const id = req["user"].id;
    console.log("Id: ", id);
    const user = req["user"];
    console.log("User from Req Body: ", user);
    return this.itemsService.findMyEmptyItems(user.id);
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

