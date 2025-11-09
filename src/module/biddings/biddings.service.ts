import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
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
    if (!highestAmount) {
      throw new NotFoundException('Only Starting Price Not allowed');
    }

    if (amount <= highestAmount) {
      throw new BadRequestException(
        `Bid amount must be higher than $${highestAmount}`,
      );
    }

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
    const fullBid = await this.biddingsRepository.findOneOrFail({
      where: { id: savedBid.id },
      relations: ['auction', 'bidder', 'auction.item'],
    });
    this.biddingsGateway.broadcastNewBid(updatedAuction.id, fullBid);

    const pastBidders = auction.biddings
      .map((b) => b.bidder.id)
      .filter((id) => id !== bidderId);

    const uniquePastBidders = [...new Set(pastBidders)];

    await this.biddingsGateway.broadcastOutBid(
      updatedAuction.id,
      fullBid,
      uniquePastBidders,
    );

    return fullBid;
  }

  // async findAll({ qs, pageSize, page }: PaginationQuery): Promise<Bidding[]> {
  //   return this.biddingsRepository.find({
  //     where: [{ bidder: ILike(`%${qs}%`) }, { bidderId: ILike(`${qs}`) }],
  //     relations: ['auction', 'bidder'],
  //     take: pageSize,
  //     // @ts-ignore
  //     skip: (page - 1) * pageSize,
  //     order: { amount: 'ASC' },
  //   });
  // }

  async findAll({qs, pageSize, page} : PaginationQuery) : Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where : {bidder : {name : ILike(`%${qs}%`)}},
      relations : ['auction', 'bidder'],
      take : pageSize,
      // @ts-ignore
      skip : (page - 1) * pageSize,
      order : { amount : "ASC"}

    })
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
      relations: ['auction', 'auction.item', ''],
    });
  }
}
