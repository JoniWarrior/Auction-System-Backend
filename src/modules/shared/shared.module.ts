import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuctionBiddingHelperService } from "./auction-bidding-helper.service";
import { Auction } from "src/entities/auction.entity";
import { Bidding } from "src/entities/bidding.entity";

@Module({
    imports : [TypeOrmModule.forFeature([Auction, Bidding])],
    providers : [AuctionBiddingHelperService],
    exports : [AuctionBiddingHelperService]
})

export class SharedModule {};