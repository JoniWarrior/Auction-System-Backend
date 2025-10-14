import { STATUS } from "src/entities/auction.entity";

export type FindAuctionsFilter = {
    status?: STATUS;
    limit?: number
    page?: number;
}