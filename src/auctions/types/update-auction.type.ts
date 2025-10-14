import type { CreateAuction } from './create-auction.type';

export type UpdateAuction = Partial<Omit<CreateAuction, 'itemId'>>;
