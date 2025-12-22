import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../../entity/user.entity';
import { CreateUser } from 'src/def/types/user/create-user.type';
import { UpdateUser } from 'src/def/types/user/update-user.type';
import { NotFoundException } from '@nestjs/common';
import { PaginationQuery } from 'src/def/pagination-query';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with Id: ${id} not found!`);
    return user;
  }

  async create(createUser: CreateUser): Promise<User> {
    const user = this.usersRepository.create({
      ...createUser,
    });
    return this.usersRepository.save(user);
  }

  async findOne(id: string, relations: string[] = []): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found!`);
    }
    return user;
  }

  async getByEmailOrFail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user;
  }

  async update(id: string, updateUser: UpdateUser): Promise<User> {
    const user = await this.getUser(id);
    const updatedUser = this.usersRepository.merge(user, updateUser);
    return this.usersRepository.save(updatedUser);
  }

  async delete(id: string) {
    const existingUser = await this.usersRepository.findOne({ where: { id } });
    if (!existingUser)
      throw new NotFoundException(`User with Id: ${id} not found!`);
    await this.usersRepository.softDelete(id);
    return { message: `User ${id} has been soft-deleted` };
  }

  async findAll({ qs, pageSize, page }: PaginationQuery): Promise<User[]> {
    return this.usersRepository.find({
      where: [{ email: ILike(`%${qs}%`) }, { name: ILike(`%${qs}%`) }],
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { name: 'ASC' },
    });
  }
}
