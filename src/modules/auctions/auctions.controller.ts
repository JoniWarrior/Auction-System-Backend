import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { type CreateAuction } from './types/create-auction.type';
import { type UpdateAuction } from './types/update-auction.type';
import { JwtAuthGuard } from 'src/auth/guards/auth.guards';
import { Roles, RolesGuard } from 'src/auth/guards/roles.guards';
import { type FindAuctionsFilter } from './types/auctions-filter.type';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import Joi from 'joi';
import { STATUS } from 'src/entities/auction.entity';
import { CurrentLoggedInUser } from 'src/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Roles('seller')
  @UseGuards(RolesGuard)
  @Post()
  create(
    @Body(
      ValidationPipe.from(
        Joi.object({
          starting_price: Joi.number().required().min(0),
          end_time: Joi.date().required(),
          itemId: Joi.string().guid({ version: 'uuidv4' }).required(),
        }),
      ),
    )
    createAuction: CreateAuction,
  ) {
    return this.auctionsService.create(createAuction);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('seller')
  @UseGuards(RolesGuard)
  @Get('/my-auctions-as-seller')
  findMyAuctions(@CurrentLoggedInUser('id') sellerId: string) {
    return this.auctionsService.findMyAuctionsAsSeller(sellerId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('/my-auctions-as-bidder')
  findMyAuctionsAsBidder(@CurrentLoggedInUser('id') bidderId: string) {
    return this.auctionsService.findMyAuctionsAsBidder(bidderId);
  }

  @Get()
  async findAll(
    @Query(
      ValidationPipe.from(
        Joi.object({
          status: Joi.string().valid(...Object.values(STATUS)),
          limit: Joi.number(),
          page: Joi.number(),
        }),
      ),
    )
    filters: FindAuctionsFilter,
  ) {
    return this.auctionsService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(
      ValidationPipe.from(
        Joi.object({
          starting_price: Joi.number().required().min(0),
          end_time: Joi.date().required(),
          itemId: Joi.string().guid({ version: 'uuidv4' }).required(),
        }),
      ),
    )
    updateAuction: UpdateAuction,
  ) {
    return this.auctionsService.update(id, updateAuction);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auctionsService.remove(id);
  }

  @Get('/:auctionId/biddings')
  findBiddingsOfAuction(@Param('auctionId') auctionId: string) {
    return this.auctionsService.findBiddingsOfAuction(auctionId);
  }

  // @Get(":id/winner")
  // async getWinningBid(@Param("id") id : string) {
  //   return await this.auctionsService.getAuctionWinner(id);
  // }

  @Post(':id/close')
  async closeAuction(@Param('id') id: string) {
    return await this.auctionsService.closeAuction(id);
  }
}
