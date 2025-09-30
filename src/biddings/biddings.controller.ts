import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { BiddingsService } from './biddings.service';
import { CreateBiddingDto } from './dto/create-bidding.dto';
import { UpdateBiddingDto } from './dto/update-bidding.dto';
import { JwtAuthGuard } from './../auth/guards/auth.guards';
import {Roles, RolesGuard} from "./../auth/guards/roles.guards";

@Controller('biddings')
@UseGuards(JwtAuthGuard)
export class BiddingsController {
  constructor(private readonly biddingsService: BiddingsService) {}

  @Post()
  @Roles("bidder")
  @UseGuards(RolesGuard) 
  create(@Body() createBiddingDto: CreateBiddingDto) {
    return this.biddingsService.create(createBiddingDto);
  }

  @Get()
  findAll() {
    return this.biddingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.biddingsService.findOne(id);
  }

  @Patch(':id')
  @Roles("bidder")
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateBiddingDto: UpdateBiddingDto) {
    return this.biddingsService.update(id, updateBiddingDto);
  }

  @Delete(':id')
  @Roles("bidder")
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.biddingsService.remove(id);
  }

}
