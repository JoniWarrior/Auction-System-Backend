import { CreateItem } from './create-item.type';

export type UpdateItem = Partial<Omit<CreateItem, 'sellerId'>>;
