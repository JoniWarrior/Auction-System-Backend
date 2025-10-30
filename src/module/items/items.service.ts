import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItem } from 'src/def/types/item/create-item.type';
import { UpdateItem } from 'src/def/types/item/update-item.type';
import { Item } from '../../entity/item.entity';
import { ILike, IsNull, Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { PaginationQuery } from 'src/def/pagination-query';

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
        sellerId,
      });
      const savedItem = await this.itemsRepository.save(item);
      return savedItem;
    } catch (error) {
      console.error('Error in itemsService.create:', error);
      throw error;
    }
  }

  async findAll({ qs, pageSize, page }: PaginationQuery): Promise<Item[]> {
    return this.itemsRepository.find({
      where: [
        { title: ILike(`%${qs}%`) },
        { description: ILike(`%${qs}%`) },
        { imageURL: ILike(`%${qs}%`) },
      ],
      relations: ['seller'],
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { title: 'ASC' },
    });
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
      where: { sellerId },
      relations: ['seller'],
    });
    return items;
  }

  async update(id: string, updateItem: UpdateItem): Promise<Item> {
    const originalItem = await this.findOne(id);
    const updatedItem = this.itemsRepository.merge(originalItem, updateItem);
    return this.itemsRepository.save(updatedItem);
  }

  async delete(id: string) {
    const existingItem = await this.itemsRepository.findOne({ where: { id } });
    if (!existingItem)
      throw new NotFoundException(`Item with Id: ${id} not found! `);
    await this.itemsRepository.softDelete(id);
    return { message: `Item ${id} has been soft-deleted` };
  }

  async findMyItemsWithoutAuction(userId: string): Promise<Item[]> {
    const empty_items = await this.itemsRepository.find({
      where: {
        sellerId: userId,
        auction: { id: IsNull() },
      },
      relations: ['seller', 'auction'],
    });
    return empty_items;
  }
}
