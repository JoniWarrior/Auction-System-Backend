import { PartialType } from '@nestjs/mapped-types';
import { CreateBiddingDto } from './create-bidding.dto';

export class UpdateBiddingDto extends PartialType(CreateBiddingDto) {}
