import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItem } from './types/create-item.type';
import { UpdateItem } from './types/update-item.type';
import { Item } from '../../entities/item.entity';
import { IsNull, Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('Image is required!');
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'auction_items', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result as { secure_url: string });
          },
        );
        uploadStream.end(file.buffer);
      },
    );
    return result.secure_url;
  }

  async create(
    createItem: CreateItem,
    file: Express.Multer.File,
    sellerId: string,
  ): Promise<Item> {
    try {
      const imageURL = await this.uploadToCloudinary(file);
      const item = this.itemsRepository.create({
        title: createItem.title,
        description: createItem.description,
        imageURL,
        seller: { id: sellerId },
      });
      const savedItem = await this.itemsRepository.save(item);
      return savedItem;
    } catch (error) {
      console.error('Error in itemsService.create:', error);
      throw error;
    }
  }

  async findAll(): Promise<Item[]> {
    const items = await this.itemsRepository.find({ relations: ['seller'] });
    if (items.length === 0)
      throw new NotFoundException('No items found in the DB');
    return items;
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['seller'],
    });
    if (!item) throw new NotFoundException(`Item with Id ${id} not found`);
    return item;
  }

  async findBySeller(sellerId: string): Promise<Item[]> {
    const items = await this.itemsRepository.find({
      select: ['id', 'title', 'description'],
      where: { seller: { id: sellerId } },
      relations: ['seller'],
    });
    if (!items.length)
      throw new NotFoundException(`No items found of seller : ${sellerId}`);
    return items;
  }

  async update(id: string, updateItem: UpdateItem): Promise<Item> {
    const originalItem = await this.findOne(id);
    const updatedItem = this.itemsRepository.merge(originalItem, updateItem);
    return this.itemsRepository.save(updatedItem);
  }

  async remove(id: string): Promise<Item> {
    const item = await this.findOne(id);
    await this.itemsRepository.remove(item);
    return item;
  }

  async findMyItemsWithoutAuction(userId: string): Promise<Item[]> {
  const empty_items = await this.itemsRepository.find({
    where: {
      seller: { id: userId },
      auction: { id : IsNull()},
    },
    relations: ['seller', 'auction'],
  });
  console.log("Empty Items", empty_items);
  return empty_items;
}



  // async findSellerItems(id: string): Promise<Item[]> {
  //   const user = await this.usersService.getUser(id);
  //   if (user.role !== Role.SELLER)
  //     throw new BadRequestException(
  //       `The user with Id: ${id} is not registered as a seller!`,
  //     );
  //   return this.findBySeller(id);
  // } // Not needed
}
