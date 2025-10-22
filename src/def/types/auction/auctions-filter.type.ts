import { AuctionStatus } from 'src/def/enums/auction_status';
export type FindAuctionsFilter = {
    status?: AuctionStatus;
    limit?: number
    page?: number;
}