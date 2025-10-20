import { AuctionStatus } from '../../../def/enums/auction_status.enum';

export type FindAuctionsFilter = {
    status?: AuctionStatus;
    limit?: number
    page?: number;
}
