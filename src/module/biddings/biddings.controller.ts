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
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { Roles, RolesGuard } from '../../auth/guards/roles.guards';
import Joi from 'joi';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import { CurrentLoggedInUser } from 'src/decorator/current-user.decorator';
// import { type PaginationQuery } from './types/find-bidding.type';
import { type PaginationQuery } from 'src/def/types/bidding/find-bidding.type';
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
  } // endpoint not used in front

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.biddingsService.findOne(id);
  }

  @Patch(':id')
  @Roles('bidder')
  @UseGuards(RolesGuard)
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
  @Roles('bidder')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.biddingsService.delete(id);
  }
}
