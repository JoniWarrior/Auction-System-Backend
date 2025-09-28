import { PartialType, OmitType} from '@nestjs/mapped-types';
import { CreateAuctionDto } from './create-auction.dto';

export class UpdateAuctionDto extends PartialType(OmitType(CreateAuctionDto, ["itemId"] as const)) {}
