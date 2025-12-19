export type CreateBidding = {
  amount: number;
  transactionId: string; // take the finalAmount from transaction
  auctionId: string;
};
