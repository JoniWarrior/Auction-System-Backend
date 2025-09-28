import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CreateBiddingDto } from './dto/create-bidding.dto';
import { UpdateBiddingDto } from './dto/update-bidding.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bidding } from './entities/bidding.entity';
import { Repository } from 'typeorm';
import { Auction, STATUS } from './../auctions/entities/auction.entity';
import { User } from './../users/entities/user.entity';
import { AuctionsService } from './../auctions/auctions.service';
import { BiddingsGateway } from './biddings-gateway';

@Injectable()
export class BiddingsService {
  constructor(
    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,

    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private auctionsService: AuctionsService,

    @Inject()
    private readonly biddingsGateway: BiddingsGateway,
  ) {}

  async create(createBiddingDto: CreateBiddingDto): Promise<Bidding> {
    const auction = await this.auctionsService.validateAuctionForBidding(createBiddingDto.auctionId);
    
    const user = await this.usersRepository.findOneBy({ id: createBiddingDto.bidderId });
    if (!user) {
      throw new NotFoundException(`User with ID ${createBiddingDto.bidderId} not found`);
    }

    if (user.role !== "bidder") {
      throw new BadRequestException(`User with Id ${createBiddingDto.bidderId} is not a bidder`);
    }

    const currentHighestBid = auction.biddings?.length > 0
      ? Math.max(...auction.biddings.map(bid => bid.amount))
      : auction.starting_price;

    if (createBiddingDto.amount <= currentHighestBid) {
      throw new BadRequestException(`Bid amount must be higher than $${currentHighestBid}`);
    }

    const totalBidCount = await this.biddingsRepository.count({
      where: { auction: { id: auction.id } }
    });

    const bidding = this.biddingsRepository.create({
      amount: createBiddingDto.amount,
      auction: { id: auction.id },
      bidder: { id: user.id }
    });

    const savedBidding = await this.biddingsRepository.save(bidding);


    if (totalBidCount === 0) {
      await this.auctionsRepository.update(auction.id, {
        current_price: createBiddingDto.amount,
        status: STATUS.ACTIVE
      });
    } else {
      await this.auctionsRepository.update(auction.id, {
        current_price: createBiddingDto.amount
      });
    }

    const fullBid = await this.biddingsRepository.findOneOrFail({
      where: { id: savedBidding.id },
      relations: ['auction', 'bidder', 'auction.item']
    });

    this.biddingsGateway.broadcastNewBid(auction.id, fullBid);
    return fullBid;
  }

  async findAll(): Promise<Bidding[]> {
    const biddings = await this.biddingsRepository.find({
      relations: ['auction', 'bidder']
    });

    if (biddings.length === 0) {
      throw new NotFoundException('No biddings found');
    }

    return biddings;
  }

  async findOne(id: string): Promise<Bidding> {
    const bidding = await this.biddingsRepository.findOne({
      where: { id },
      relations: ['auction', 'bidder']
    });

    if (!bidding) {
      throw new NotFoundException(`Bidding with ID ${id} not found`);
    }

    return bidding;
  }

  async update(id: string, updateBiddingDto: UpdateBiddingDto): Promise<Bidding> {
    const bidding = await this.biddingsRepository.findOneBy({ id });

    if (!bidding) {
      throw new NotFoundException(`Bidding with ID ${id} not found`);
    }

    const updatedBidding = this.biddingsRepository.merge(bidding, updateBiddingDto);
    return this.biddingsRepository.save(updatedBidding);
  }

  async remove(id: string): Promise<Bidding> {
    const bidding = await this.biddingsRepository.findOneBy({ id });

    if (!bidding) {
      throw new NotFoundException(`Bidding with ID ${id} not found`);
    }

    await this.biddingsRepository.remove(bidding);
    return bidding;
  }

  async findByAuction(auctionId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { auction: { id: auctionId } },
      relations: ['bidder'],
      order: { amount: 'DESC' }
    });
  }
  async findByUser(userId: string): Promise<Bidding[]> {
    return await this.biddingsRepository.find({
      where: { bidder: { id: userId } },
      order: { amount: "DESC" }
    })
  };
}
