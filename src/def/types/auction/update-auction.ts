import type { CreateAuction } from "./create-auction";

export type UpdateAuction = Partial<Omit<CreateAuction, 'itemId'>>;