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
import { User } from 'src/entity/user.entity';
import { PaginationQuery } from 'src/def/pagination-query';
import { PokApiService } from '../external/pok-api.service';
import { Transaction } from '../../entity/transaction.entity';
import { TransactionStatus } from '../../def/enums/transaction_status';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionDto } from '../external/types/create-transaction.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class BiddingsService {
  private readonly merchantId: string;
  constructor(
    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,

    @Inject()
    private readonly biddingsGateway: BiddingsGateway,
    private readonly helperService: AuctionBiddingHelperService,
    private readonly pokApiService: PokApiService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.merchantId = this.configService.get<string>('POK_MERCHANT_ID') ?? '';
  }

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
    if (currentHighestBid && currentHighestBid.bidder.id !== bidderId) {
      const previousBidder = currentHighestBid.bidder;
      const previousTransaction = currentHighestBid?.transaction?.sdkOrderId;
      console.log('Previous transaction', previousTransaction);

      if (previousTransaction) {
        try {
          console.log(
            `Refunding previous highest bidder ${previousBidder.id} for amount ${currentHighestBid.amount}`,
          );

          await this.pokApiService.refund(
            this.merchantId,
            previousTransaction,
            'Outbid refund',
            currentHighestBid.amount,
          ); // call POK for refunding the previous highest bidder

          await this.transactionsRepository.update(
            { sdkOrderId: previousTransaction },
            { status: TransactionStatus.REFUNDED },
          );
        } catch (err) {
          console.log('Error in pok api service', err);
        }
      }
    }
    const transactionPayload: CreateTransactionDto = {
      amount: createBidding?.amount,
      currencyCode: 'ALL',
      autoCapture: false,
      description: `Biding for auction ${auction.id} by ${bidder.name} with value ${amount}`,
      // ?
      merchantCustomReference: this.merchantId,
      // webhookUrl: 'https://63bd926533f0.ngrok-free.app//webhook/transaction',
      webhookUrl: process.env.WEBHOOK_PROXY_URL,
      products: [
        {
          name: auction?.item?.title,
          quantity: 1,
          price: createBidding.amount,
        },
      ],
    };
    const transactionResponse =
      await this.pokApiService.createTransaction(transactionPayload);
    console.log('POK Transaction in POK DB created: ', transactionResponse);

    const isFirstBid = (auction.biddings?.length ?? 0) === 0;
    const updatedAuction = await this.helperService.updateAuction(auction, {
      amount,
      isFirstBid,
    });

    const bidding = this.biddingsRepository.create({
      amount,
      auctionId: updatedAuction.id,
      bidderId,
    });
    const savedBid = await this.biddingsRepository.save(bidding);
    const savedTransaction = await this.transactionsRepository.save({
      sdkOrderId: transactionResponse?.data?.sdkOrder?.id,
      status: TransactionStatus.ON_HOLD, // success after payment done
      bidding: savedBid,
    });
    const fullBid = await this.biddingsRepository.findOneOrFail({
      where: { id: savedBid.id },
      relations: ['auction', 'bidder', 'transaction'],
    });
    console.log('Full Bid: ', fullBid);
    this.biddingsGateway.broadcastNewBid(updatedAuction.id, fullBid);

    const pastBidders = auction.biddings
      .map((b) => b.bidder.id)
      .filter((id) => id !== bidderId);
    const uniquePastBidders = [...new Set(pastBidders)];
    for (const bidderId of uniquePastBidders) {
      const user = await this.usersRepository.findOne({
        where: { id: bidderId },
        select: ['email'],
      });
      const bidderEmail = user?.email;
      if (!bidderEmail) throw new NotFoundException('Bidder email not found');
      await this.emailService.sendOutBidEmail(bidderEmail, {
        auctionTitle: auction?.item?.title,
        newBidAmount: amount,
      });
    }

    await this.biddingsGateway.broadcastOutBid(
      updatedAuction.id,
      fullBid,
      uniquePastBidders,
    );
    // TODO : capture behet automatikisht ne back dhe refund pas cdo bidi ose kur mbaron auctioni

    // their webhook
    return fullBid;
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
