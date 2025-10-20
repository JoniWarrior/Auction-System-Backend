import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CreateUser } from './types/create-user.type';
import { UpdateUser } from './types/update-user.type';
import { NotFoundException } from '@nestjs/common';
import { FindUsersQuery } from './types/find-users-query.type';
import { UserRole } from '../../def/enums/user_role.enum';

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
      role: createUser.role || UserRole.BIDDER,
    });
    return this.usersRepository.save(user);
  }

  async findOne(id: string, relations: string[] = []): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });
    if (!user) {
      throw new NotFoundException(`User with Id: ${id} not found in the DB! `);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found!`);
    return user;
  }

  async update(id: string, updateUser: UpdateUser): Promise<User> {
    const user = await this.getUser(id);
    const updatedUser = this.usersRepository.merge(user, updateUser);
    return this.usersRepository.save(updatedUser);
  }

  async remove(id: string): Promise<User> {
    const user = await this.getUser(id);
    await this.usersRepository.remove(user);
    return user;
  }

  async findAll(filters: FindUsersQuery): Promise<User[]> {
    const where: FindOptionsWhere<User> = {};

    if (filters.email) where.email = filters.email;
    if (filters.name) where.name = ILike(`%${filters.name}%`);
    if (filters.role) where.role = filters.role;

    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    const skip = (page - 1) * limit;

    return this.usersRepository.find({
      where,
      take: limit,
      skip,
      order: { name: 'ASC' },
    });
  }
}
