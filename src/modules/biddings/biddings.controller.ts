import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BiddingsService } from './biddings.service';
import { type CreateBidding } from './types/create-bidding.type';
import { type UpdateBidding } from './types/update-bidding.type';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { Roles, RolesGuard } from '../../auth/guards/roles.guards';
import Joi from 'joi';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';

@Controller('biddings')
@UseGuards(JwtAuthGuard)
export class BiddingsController {
  constructor(private readonly biddingsService: BiddingsService) {}

  @Post()
  @Roles('bidder')
  @UseGuards(RolesGuard)
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
  ) {
    return this.biddingsService.create(createBidding);
  }

  @Get()
  findAll() {
    return this.biddingsService.findAll();
  }

  @Get(':id/biddings')
  findBidderBids(@Param('id') id: string) {
    return this.biddingsService.findBidderBids(id);
  }

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
    return this.biddingsService.remove(id);
  }
}
