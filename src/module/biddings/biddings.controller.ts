import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BiddingsService } from './biddings.service';
import { type CreateBidding } from 'src/def/types/bidding/create-bidding.type';
import { type UpdateBidding } from 'src/def/types/bidding/update-bidding.type';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import Joi from 'joi';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import { CurrentLoggedInUser } from 'src/decorator/current-user.decorator';
import { type PaginationQuery } from 'src/def/pagination-query';
@Controller('biddings')
@UseGuards(JwtAuthGuard)
export class BiddingsController {
  constructor(private readonly biddingsService: BiddingsService) {}

  @Post()
  create(
    @Body(
      ValidationPipe.from(
        Joi.object({
          amount: Joi.number().required().min(0),
          auctionId: Joi.string().guid({ version: 'uuidv4' }),
          bidderId: Joi.string().guid({ version: 'uuidv4' }),
        }),
      ),
    )
    createBidding: CreateBidding,
    @CurrentLoggedInUser('id') bidderId: string,
  ) {
    return this.biddingsService.create(createBidding, bidderId);
  }

  @Get()
  findUsers(
    @Query(
      ValidationPipe.from(
        Joi.object({
          qs: Joi.string().required(),
          page: Joi.number().positive().default(1),
          pageSize: Joi.number().positive().default(10),
        }),
      ),
    )
    query: PaginationQuery,
  ) {
    return this.biddingsService.findAll(query);
  }

  @Get('/my-biddings')
  findMyBiddings(@CurrentLoggedInUser('id') bidderId: string) {
    return this.biddingsService.findMyBiddings(bidderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.biddingsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(
      ValidationPipe.from(
        Joi.object({
          amount: Joi.number().required().min(0),
          auctionId: Joi.string().guid({ version: 'uuidv4' }),
          bidderId: Joi.string().guid({ version: 'uuidv4' }),
        }),
      ),
    )
    updateBidding: UpdateBidding,
  ) {
    return this.biddingsService.update(id, updateBidding);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.biddingsService.delete(id);
  }
}
