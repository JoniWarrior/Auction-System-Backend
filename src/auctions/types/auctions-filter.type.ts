import { IsEnum, IsInt, IsOptional } from "class-validator";
import { STATUS } from "../entities/auction.entity";
import { Type } from "class-transformer";

export type FindAuctionsFilter = {
    // @IsOptional()
    // @IsEnum(STATUS, { message: "Status should be either active, pending or finished" })
    status?: STATUS;

    // @IsOptional()
    // @IsInt()
    // @Type(() => Number)
    limit?: number

    // @IsOptional()
    // @IsInt()
    // @Type(() => Number)
    page?: number;
}