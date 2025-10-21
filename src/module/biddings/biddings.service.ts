import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CreateBidding } from './types/create-bidding.type';
import { UpdateBidding } from './types/update-bidding.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Bidding } from '../../entities/bidding.entity';
import { Repository } from 'typeorm';
import { Auction } from '../../entities/auction.entity';
import { BiddingsGateway } from './biddings-gateway';
import { AuctionBiddingHelperService } from '../shared/auction-bidding-helper.service';
import { User } from 'src/entities/user.entity';

@Injectable()
export class BiddingsService {
  constructor(
    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @Inject()
    private readonly biddingsGateway: BiddingsGateway,
    private readonly helperService: AuctionBiddingHelperService,
  ) {}

  private getHighestBid(auction: Auction): number {
    return auction.biddings.length
      ? Math.max(...auction.biddings.map((b) => b.amount))
      : auction.startingPrice;
  }

  // Version 2 :
  async create(
    createBidding: CreateBidding,
    bidderId: string,
  ): Promise<Bidding> {
    const { auctionId, amount } = createBidding;

    const auction = await this.helperService.validateAuctionForBidding(
      auctionId,
      bidderId,
    );
    const bidder = await this.usersRepository.findOne({
      where: { id: bidderId },
    });

    if (!bidder) {
      throw new NotFoundException(
        `User (bidder) with ID ${bidderId} not found`,
      );
    }
    const currentHighestBid = this.getHighestBid(auction);
    if (amount <= currentHighestBid) {
      throw new BadRequestException(
        `Bid amount must be higher than $${currentHighestBid}`,
      );
    }

    const isFirstBid = (auction.biddings?.length ?? 0) === 0;
    const updatedAuction = await this.helperService.updateAuction(auction, {
      amount,
      isFirstBid,
    });

    const bidding = this.biddingsRepository.create({
      amount,
      auction: { id: updatedAuction.id },
      bidder: { id: bidder.id },
    });

    const savedBid = await this.biddingsRepository.save(bidding);
    const fullBid = await this.biddingsRepository.findOne({
      where: { id: savedBid.id },
      relations: ['auction', 'bidder', 'auction.item'],
    });

    if (!fullBid) throw new BadRequestException('Not exist!');
    this.biddingsGateway.broadcastNewBid(updatedAuction.id, fullBid);

    const pastBidders = auction.biddings
      .map((b) => b.bidder.id)
      .filter((id) => id !== bidderId);

    const uniquePastBidders = [...new Set(pastBidders)];

    const broadcastOutBid = await this.biddingsGateway.broadcastOutBid(
      updatedAuction.id,
      fullBid,
      uniquePastBidders,
    );
    console.log('BroadCast OutBid: ', broadcastOutBid);

    return fullBid;
  }

  async findAll(): Promise<Bidding[]> {
    const biddings = await this.biddingsRepository.find({
      relations: ['auction', 'bidder'],
      order: { amount: 'DESC' },
    });
    return biddings;
  }

  async findOne(id: string): Promise<Bidding> {
    const bidding = await this.biddingsRepository.findOne({
      where: { id },
      relations: ['auction', 'bidder'],
    });
    if (!bidding)
      throw new NotFoundException(`Bidding with ID ${id} not found`);
    return bidding;
  }

  async findMyBiddings(id: string): Promise<Bidding[]> {
    return this.findBidsByBider(id);
  } // endpoint not used in front

  async update(id: string, updateBidding: UpdateBidding): Promise<Bidding> {
    const bidding = await this.findOne(id);
    const updatedBidding = this.biddingsRepository.merge(
      bidding,
      updateBidding,
    );
    return this.biddingsRepository.save(updatedBidding);
  }

  async delete(id: string) {
    await this.biddingsRepository.softDelete(id);
    return { message: `Bidding ${id} has been soft-deleted` };
  }

  async findByAuction(auctionId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { auction: { id: auctionId } },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });
  }

  async findBidsByBider(bidderId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: {
        bidder: { id: bidderId },
      },
      relations: ['auction', 'auction.item', ''],
    });
  }
}
