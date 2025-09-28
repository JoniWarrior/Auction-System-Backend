import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { User } from "./../users/entities/user.entity";
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createItemDto: CreateItemDto, file: Express.Multer.File): Promise<Item> {
    try {
      const seller = await this.usersRepository.findOneBy({ id: createItemDto.sellerId });

      if (!seller) {
        throw new NotFoundException(`No user found with userId ${createItemDto.sellerId}`);
      }

      if (seller.role !== "seller") {
        throw new BadRequestException(`User with Id ${createItemDto.sellerId} is not a seller`);
      }

      if (!file) {
        throw new BadRequestException("Image is required!");
      }

      console.log('File details:', {
        originalname: file.originalname,
        path: file.path,
        buffer: file.buffer ? 'exists' : 'undefined',
        size: file.size
      });

      // Upload to Cloudinary with error handling
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'auction_items', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as any);
        },
      );
      uploadStream.end(file.buffer);
    });

      const item = this.itemsRepository.create({
        title: createItemDto.title,
        description: createItemDto.description,
        imageURL: uploadResult.secure_url,
        seller  
      });

      const savedItem = await this.itemsRepository.save(item);

      return this.itemsRepository.findOneOrFail({
        where: { id: savedItem.id },
        relations: ["seller"]
      });
      
    } catch (error) {
      console.error('Error in itemsService.create:', error);
      throw error;
    }
  }

  async findAll() : Promise<Item[]> {
    const items = await this.itemsRepository.find();
    if (items.length === 0) {
      throw new NotFoundException("No items have been created in the DB yet ")
    }
    return items;
  }

  async findOne(id : string) : Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where : {id},
      relations : ["seller"]
     });
    if (!item) {
      throw new NotFoundException(`There is no item with ID ${id} in the DB`)
    }
    return item;
  }

  async update(id : string, updateItemDto : UpdateItemDto) : Promise<Item> {
    const originalItem = await this.itemsRepository.findOneBy({id});
    if (!originalItem) {
      throw new NotFoundException(`There is not item with ID ${id} in the DB`);
    }
    const updatedItem = this.itemsRepository.merge(originalItem, updateItemDto);
    return this.itemsRepository.save(updatedItem);
  }

  async remove(id : string) : Promise<Item> {
    const item = await this.itemsRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found in the DB `)
    }
    await this.itemsRepository.remove(item);
    return item;
  }

  async findMyEmptyItems(userId : string) : Promise<Item[]> {
    const myEmptyItems = await this.itemsRepository
    .createQueryBuilder("item")
    .leftJoinAndSelect("item.seller", "seller")
    .leftJoinAndSelect("item.auction", "auction")
    .where("seller.id = :userId", {userId})
    .andWhere("auction IS NULL")
    .getMany();

    if (myEmptyItems.length === 0) {
      return [];
    }
    return myEmptyItems;
  }
}
