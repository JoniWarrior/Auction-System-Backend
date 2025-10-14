import { IsOptional, IsEmail, IsString, IsEnum, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role } from '../entities/user.entity';

export type FindUsersQuery = {
  // @Transform(({ value }) => value.toLowerCase().trim())
  email?: string;
  // @Transform(({ value }) => value.trim())
  name?: string;
  role?: Role;
  limit?: number;
  page?: number;
}
