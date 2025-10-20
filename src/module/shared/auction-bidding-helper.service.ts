import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auction } from 'src/entities/auction.entity';
import { Bidding } from 'src/entities/bidding.entity';
import { Repository } from 'typeorm';
import { AuctionStatus } from '../../def/enums/auction_status.enum';

@Injectable()
export class AuctionBiddingHelperService {
  constructor(
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,

    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,

    ) {}

  async validateAuctionForBidding(auctionId: string, bidderId : string): Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({
      where: { id: auctionId },
      relations: ['biddings', 'biddings.bidder', 'item', "item.seller"],
    });

    if (auction?.item.seller.id === bidderId) {
      throw new UnauthorizedException("You cannot bid in your own auction!");
    }

    if (!auction) {
      throw new BadRequestException(`Auction with id ${auctionId} not found`);
    }
    if (auction?.status === AuctionStatus.FINISHED)
      throw new BadRequestException('Auction has already finished');

    const now = new Date();
    if (now > auction.endTime)
      throw new BadRequestException('Auction has ended');
    return auction;
  }

  async findBiddingsOfAuction(auctionId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { auction: { id: auctionId } },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });
  }

  async updateAuction(
    auction: Auction,
    { amount, isFirstBid }: { amount: number; isFirstBid: boolean },
  ): Promise<Auction> {
    const existingAuction = await this.auctionsRepository.findOne({
      where: { id: auction.id },
      relations: ['item', 'biddings'],
    });

    if (!existingAuction) {
      throw new NotFoundException(`Auction with ID ${auction.id} not found`);
    }

    existingAuction.currentPrice = amount;
    if (isFirstBid && existingAuction.status !== AuctionStatus.ACTIVE) {
      existingAuction.status = AuctionStatus.ACTIVE;
    }

    const savedAuction = await this.auctionsRepository.save(existingAuction);

    return this.auctionsRepository.findOneOrFail({
      where: { id: savedAuction.id },
      relations: ['item', 'biddings'],
    });
  }
}
