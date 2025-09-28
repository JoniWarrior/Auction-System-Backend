import { IsNumber, IsUUID, IsPositive, IsDate, MinDate } from "class-validator";
import { Type } from "class-transformer";


export class CreateAuctionDto {

    @IsNumber({}, {message : "Starting price must be a number"})
    @IsPositive({message : "Starting price must be positive"})
    starting_price : number

    @IsDate({message : "Required a valid date "})
    @MinDate(new Date(), {message : "End time must be in the future"})
    @Type(() => Date)
    end_time : Date

    @IsUUID("4", {message : "Item ID must be valid UUID"})
    itemId : string

}
