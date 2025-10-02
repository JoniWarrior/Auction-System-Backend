import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateBiddingDto } from './dto/create-bidding.dto';
import { UpdateBiddingDto } from './dto/update-bidding.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bidding } from './entities/bidding.entity';
import { Repository } from 'typeorm';
import { Auction, STATUS } from './../auctions/entities/auction.entity';
import { Role } from './../users/entities/user.entity';
import { AuctionsService } from './../auctions/auctions.service';
import { BiddingsGateway } from './biddings-gateway';
import { UsersService } from './../users/users.service';

@Injectable()
export class BiddingsService {
  constructor(
    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,

    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
 
    @Inject(forwardRef(() => AuctionsService))
    private auctionsService: AuctionsService,

    @Inject()
    private readonly biddingsGateway: BiddingsGateway,
  ) {}

  private getHighestBid(auction: Auction): number {
    return auction.biddings.length
      ? Math.max(...auction.biddings.map((b) => b.amount))
      : auction.starting_price;
  }

  private async saveAndLoadBidding(bidding: Bidding): Promise<Bidding> {
    const saved = await this.biddingsRepository.save(bidding);
    return this.biddingsRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['auction', 'bidder', 'auction.item'],
    });
  }

  async create(createBiddingDto: CreateBiddingDto): Promise<Bidding> {
    const { auctionId, bidderId, amount } = createBiddingDto;

    const auction =
      await this.auctionsService.validateAuctionForBidding(auctionId);
    const user = await this.usersService.findOne(bidderId);
    if (user.role !== Role.BIDDER)
      throw new BadRequestException(`User with Id ${bidderId} is not a bidder`);
    const currentHighestBid = this.getHighestBid(auction);

    if (amount <= currentHighestBid)
      throw new BadRequestException(
        `Bid amount must be higher than $${currentHighestBid}`,
      );

    const isFirstBid = (auction.biddings?.length ?? 0) === 0;
    const bidding = this.biddingsRepository.create({
      amount: amount,
      auction: { id: auction.id },
      bidder: { id: user.id },
    });

    const fullBid = await this.saveAndLoadBidding(bidding);
    await this.auctionsService.update(auction.id, {
      current_price: amount,
      ...(isFirstBid && { status: STATUS.ACTIVE }),
    });

    this.biddingsGateway.broadcastNewBid(auction.id, fullBid);

    // Version 1:
    // this.biddingsGateway.broadcastOutBid(auction.id, fullBid, bidderId);

    const pastBidders = auction.biddings
      .map((b) => b.bidder.id)
      .filter((id) => id !== bidderId); // exlcude current bider

    const uniquePastBidders = [...new Set(pastBidders)];

    await this.biddingsGateway.broadcastOutBid(
      auction.id,
      fullBid,
      uniquePastBidders,
    );

    return fullBid;
  }

  async findAll(): Promise<Bidding[]> {
    const biddings = await this.biddingsRepository.find({
      relations: ['auction', 'bidder'],
      order: { amount: 'DESC' },
    });
    if (!biddings.length) throw new NotFoundException('No biddings found');
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

  async update(
    id: string,
    updateBiddingDto: UpdateBiddingDto,
  ): Promise<Bidding> {
    const bidding = await this.findOne(id);
    const updatedBidding = this.biddingsRepository.merge(
      bidding,
      updateBiddingDto,
    );
    return this.biddingsRepository.save(updatedBidding);
  }

  async remove(id: string): Promise<Bidding> {
    const bidding = await this.findOne(id);
    await this.biddingsRepository.remove(bidding);
    return bidding;
  }

  async findByAuction(auctionId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { auction: { id: auctionId } },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });
  }

  async findBidsByBider(userId: string): Promise<Bidding[]> {
    return this.biddingsRepository
      .createQueryBuilder('bidding')
      .leftJoinAndSelect('bidding.auction', 'auction')
      .leftJoinAndSelect('auction.item', 'item')
      .select([
        'bidding.id',
        'bidding.amount',
        'bidding.created_at',
        'auction.id',
        'auction.starting_price',
        'auction.current_price',
        'auction.end_time',
        'auction.status',
        'item.title',
        'item.description',
      ])
      .where('bidding.bidder_id = :bidderId', { bidderId: userId })
      .getMany();
  }
}
