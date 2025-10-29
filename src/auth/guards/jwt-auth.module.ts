import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth.guards';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity';
import { JWT } from 'src/dynamic-module/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JWT
  ],
  providers: [JwtAuthGuard],
    exports: [JwtAuthGuard, JwtModule, TypeOrmModule],
})
export class JwtAuthModule {}
