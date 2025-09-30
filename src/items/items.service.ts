import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { User } from "./../users/entities/user.entity";
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { Role } from './../users/entities/user.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  private async findAndValidateSeller(sellerId: string): Promise<User> {
    const seller = await this.usersRepository.findOneBy({ id: sellerId });
    if (!seller) throw new NotFoundException(`User Id ${sellerId} not found`);
    if (seller.role !== Role.SELLER) throw new BadRequestException(`User with Id ${sellerId} is not a seller`);
    return seller;
  }

  private async uploadToCloudinary(file : Express.Multer.File) : Promise<string> {
    if (!file) throw new BadRequestException("Image is required!");
    const result = await new Promise<{secure_url : string}>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'auction_items', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result as { secure_url: string });
          }
      );
      uploadStream.end(file.buffer);
    });
    return result.secure_url;
  }

  async create(createItemDto: CreateItemDto, file: Express.Multer.File): Promise<Item> {
    try {
      const seller = await this.findAndValidateSeller(createItemDto.sellerId);
      const imageURL = await this.uploadToCloudinary(file);
      const item = this.itemsRepository.create({
        title: createItemDto.title,
        description: createItemDto.description,
        imageURL,
        seller
      });
      const savedItem = await this.itemsRepository.save(item);
      return savedItem;
    
    } catch (error) {
      console.error('Error in itemsService.create:', error);
      throw error;
    }
  }

  async findAll(): Promise<Item[]> {
    const items = await this.itemsRepository.find({ relations: ["seller"] });
    if (items.length === 0) throw new NotFoundException("No items found in the DB")
    return items;
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ["seller"]
    }); 
    if (!item) throw new NotFoundException(`Item with Id ${id} not found`)
    return item;
  }

  async findBySeller(sellerId : string) : Promise<Item[]> {
    const items = await this.itemsRepository.find({
      select : ["id", "title", "description"],
      where : {seller : {id : sellerId}},
      relations : ["seller"]
    });
    if (!items.length)  throw new NotFoundException(`No items found of seller : ${sellerId}`)
      return items;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const originalItem = await this.findOne(id);
    const updatedItem = this.itemsRepository.merge(originalItem, updateItemDto);
    return this.itemsRepository.save(updatedItem);
  }

  async remove(id: string): Promise<Item> {
    const item = await this.findOne(id);
    await this.itemsRepository.remove(item);
    return item;
  }

  async findMyItemsWithoutAuction(userId: string): Promise<Item[]> {
    const myEmptyItems = await this.itemsRepository
      .createQueryBuilder("item")
      .leftJoinAndSelect("item.seller", "seller")
      .leftJoinAndSelect("item.auction", "auction")
      .where("seller.id = :userId", { userId })
      .andWhere("auction IS NULL")
      .getMany();

    if (myEmptyItems.length === 0) return [];
    return myEmptyItems;
  }
}