import { IsNumber, IsUUID, IsPositive } from "class-validator";

export class CreateBiddingDto {

    @IsNumber({}, {message : "Amount must be a number"})
    @IsPositive({message : "Amount must be positive"})
    amount : number

    @IsUUID("4", {message: "Auction ID must be a valid UUID"})
    auctionId : string

    @IsUUID("4", {message : "Bidder ID must be a valid UUID"})
    bidderId : string
 

}
