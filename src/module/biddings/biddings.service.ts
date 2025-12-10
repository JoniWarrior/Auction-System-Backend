import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBidding } from 'src/def/types/bidding/create-bidding.type';
import { UpdateBidding } from 'src/def/types/bidding/update-bidding.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Bidding } from '../../entity/bidding.entity';
import { ILike, Repository } from 'typeorm';
import { BiddingsGateway } from './biddings-gateway';
import { AuctionBiddingHelperService } from '../shared/auction-bidding-helper.service';
import { PaginationQuery } from 'src/def/pagination-query';
import { PokApiService } from '../external/pok-api.service';
import { Transaction } from '../../entity/transaction.entity';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BiddingsService {
  private readonly merchantId: string;
  constructor(
    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,

    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,

    @Inject()
    private readonly biddingsGateway: BiddingsGateway,
    private readonly helperService: AuctionBiddingHelperService,
    private readonly pokApiService: PokApiService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly userService: UsersService,
  ) {
    this.merchantId = this.configService.get<string>('POK_MERCHANT_ID') ?? '';
  }

  async create(createBidding: CreateBidding, bidderId: string): Promise<any> {
    // 1. Take auctionId and amount from frontend
    const { auctionId, amount } = createBidding;

    // 2. Validate auction and bidder
    const auction = await this.helperService.validateAuctionForBidding(
      auctionId,
      bidderId,
    );
    const bidder = await this.userService.findOne(bidderId);

    if (!bidder) {
      throw new NotFoundException(
        `User (bidder) with ID ${bidderId} not found`,
      );
    }
    const currentHighestBid = await this.helperService.getHighestBid(auction);
    const highestAmount = currentHighestBid?.amount;

    if (highestAmount && currentHighestBid?.bidder.id === bidderId) {
      throw new Error('You already have the highest bidding amount!');
    }

    if (highestAmount && amount <= highestAmount) {
      throw new BadRequestException(
        `Bid amount must be higher than $${highestAmount}`,
      );
    }

    let previousTransaction: string | null = null;
    let previousBidderEmail: string | null = null;
    if (currentHighestBid && currentHighestBid.bidder.id !== bidderId) {
      previousTransaction = currentHighestBid?.transaction?.sdkOrderId;
      previousBidderEmail = currentHighestBid?.bidder?.email;
    }
    // 3. Save bidding in DB
    const { id } = await this.biddingsRepository.save({
      amount,
      auctionId,
      bidderId,
    });

    // 4. Update auction currentPrice and status
    const isFirstBid = (auction.biddings?.length ?? 0) === 0;
    const updatedAuction = await this.helperService.updateAuction(auction, {
      amount,
      isFirstBid,
    });

    // 5. Broadcast events
    const fullBid = await this.biddingsRepository.findOneOrFail({
      where: { id },
      relations: ['auction', 'bidder', 'transaction'],
    });
    console.log('Bid created: ', fullBid);
    this.biddingsGateway.broadcastNewBid(updatedAuction.id, fullBid);

    const pastBidders = auction.biddings
      .map((b) => b.bidder.id)
      .filter((id) => id !== bidderId);
    const uniquePastBidders = [...new Set(pastBidders)];
    console.time('broadcastOutBid');
    await this.biddingsGateway.broadcastOutBid(
      updatedAuction.id,
      fullBid,
      uniquePastBidders,
    );
    if (previousBidderEmail) {
      await this.emailService.sendOutBidEmail(previousBidderEmail, {
        auctionTitle: auction?.item?.title,
        newBidAmount: amount,
      });
    }
    return {
      previousTransaction,
      bidding: fullBid,
    };
  }

  async findAll({ qs, pageSize, page }: PaginationQuery): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { bidder: { name: ILike(`%${qs}%`) } },
      relations: ['auction', 'bidder'],
      take: pageSize,
      // @ts-ignore
      skip: (page - 1) * pageSize,
      order: { amount: 'ASC' },
    });
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
  }

  async update(id: string, updateBidding: UpdateBidding): Promise<Bidding> {
    const bidding = await this.findOne(id);
    const updatedBidding = this.biddingsRepository.merge(
      bidding,
      updateBidding,
    );
    return this.biddingsRepository.save(updatedBidding);
  }

  async delete(id: string) {
    const existingBid = await this.biddingsRepository.findOne({
      where: { id },
    });
    if (!existingBid)
      throw new NotFoundException(`Bidding with Id: ${id} not found!`);
    await this.biddingsRepository.softDelete(id);
    return { message: `Bidding ${id} has been soft-deleted` };
  }

  async findByAuction(auctionId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { auctionId },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });
  }

  async findBidsByBider(bidderId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: {
        bidderId,
      },
      relations: ['auction', 'auction.item', 'auction.item.seller'],
    });
  }
}
