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
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import Joi from 'joi';
import { CurrentLoggedInUser } from 'src/decorator/current-user.decorator';
import { AuctionStatus } from 'src/def/enums/auction_status';
import { type PaginationQuery } from 'src/def/pagination-query';
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @UseGuards(JwtAuthGuard)
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
    @CurrentLoggedInUser('id') ownerId: string,
  ) {
    return this.auctionsService.create(createAuction, ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/my-auctions-as-seller')
  findMyAuctions(
    @Query(
      ValidationPipe.from(
        Joi.object({
          status: Joi.string()
            .valid(...Object.values(AuctionStatus))
            .optional(),
          pageSize: Joi.number(),
          page: Joi.number(),
          qs: Joi.string().allow('').optional(),
        }),
      ),
    )
    query: PaginationQuery & { status?: string },
    @CurrentLoggedInUser('id') sellerId: string,
  ) {
    const { pageSize, page = 1, qs, status } = query;
    return this.auctionsService.findMyAuctionsAsSeller(
      {
        page: Number(page),
        pageSize: Number(pageSize) || 9,
        qs: qs || '',
      },
      sellerId,
      status || 'all',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/my-auctions-as-bidder')
  findMyAuctionsAsBidder(
    @Query(
      ValidationPipe.from(
        Joi.object({
          status: Joi.string()
            .valid(...Object.values(AuctionStatus))
            .optional(),
          pageSize: Joi.number(),
          page: Joi.number(),
          qs: Joi.string().allow('').optional(),
        }),
      ),
    )
    query: PaginationQuery & { status?: string },
    @CurrentLoggedInUser('id') bidderId: string,
  ) {
    const { pageSize, page = 1, qs, status } = query;
    return this.auctionsService.findMyAuctionsAsBidder(
      {
        page: Number(page),
        pageSize: Number(pageSize) || 9,
        qs: qs || '',
      },
      bidderId,
      status || 'all',
    );
  }

  @Get()
  async findAll(
    @Query(
      ValidationPipe.from(
        Joi.object({
          status: Joi.string()
            .valid(...Object.values(AuctionStatus))
            .optional(),
          pageSize: Joi.number(),
          page: Joi.number(),
          qs: Joi.string().allow('').optional(),
        }),
      ),
    )
    query: PaginationQuery & { status?: string },
  ) {
    const { pageSize, page = 1, qs, status } = query;
    return this.auctionsService.findAll(
      {
        page: Number(page),
        pageSize: Number(pageSize) || 9,
        qs: qs || '',
      },
      status || '',
    );
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
    return this.auctionsService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:auctionId/biddings')
  findBiddingsOfAuction(@Param('auctionId') auctionId: string) {
    return this.auctionsService.findBiddingsOfAuction(auctionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  async closeAuction(
    @Param('id') auctionId: string,
    @CurrentLoggedInUser('id') currentUserId: string,
  ) {
    return await this.auctionsService.closeAuction(auctionId, currentUserId);
  }
}
