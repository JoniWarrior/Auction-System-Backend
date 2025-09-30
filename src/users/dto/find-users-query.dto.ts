import { IsOptional, IsEmail, IsString, IsEnum, IsInt, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role } from '../entities/user.entity';

export class FindUsersQueryDto {
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;
}