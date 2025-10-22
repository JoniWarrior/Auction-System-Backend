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
import { type CreateAuction } from 'src/def/types/auction/create-auction';
import { type UpdateAuction } from 'src/def/types/auction/update-auction';
import { JwtAuthGuard } from 'src/auth/guards/auth.guards';
import { Roles, RolesGuard } from 'src/auth/guards/roles.guards';
// import { type FindAuctionsFilter } from './types/auctions-filter.type';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import Joi from 'joi';
import { CurrentLoggedInUser } from 'src/decorator/current-user.decorator';
import { AuctionStatus } from 'src/def/enums/auction_status';
// import { type PaginationQuery } from '../../def/enums/types/userTypes.ts/auctionsTypes.ts/auctions-filter.type';
import { type PaginationQuery } from 'src/def/types/user/find-users-query';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Roles('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(
    @Body(
      ValidationPipe.from(
        Joi.object({
          startingPrice: Joi.number().required().min(0),
          endTime: Joi.date().required(),
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
          status: Joi.string().valid(...Object.values(AuctionStatus)),
          limit: Joi.number(),
          page: Joi.number(),
        }),
      ),
    )
    query : PaginationQuery
  ) {
    return this.auctionsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(
      ValidationPipe.from(
        Joi.object({
          startingPrice: Joi.number().required().min(0),
          endTime: Joi.date().required(),
          itemId: Joi.string().guid({ version: 'uuidv4' }).required(),
        }),
      ),
    )
    updateAuction: UpdateAuction,
  ) {
    return this.auctionsService.update(id, updateAuction);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auctionsService.  delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:auctionId/biddings')
  findBiddingsOfAuction(@Param('auctionId') auctionId: string) {
    return this.auctionsService.findBiddingsOfAuction(auctionId);
  }

  // @Get(":id/winner")
  // async getWinningBid(@Param("id") id : string) {
  //   return await this.auctionsService.getAuctionWinner(id);
  // }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  async closeAuction(@Param('id') id: string) {
    return await this.auctionsService.closeAuction(id);
  }
}
