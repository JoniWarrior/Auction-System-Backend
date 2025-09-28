import { IsOptional, IsEmail, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @IsString()
  @IsIn(['bidder', 'seller', 'admin'])
  role?: string;
}