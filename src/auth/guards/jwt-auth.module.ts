import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth.guards';
import { RolesGuard, Roles } from './roles.guards';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: configService.get<string>("JWT_EXPIRES_IN") },
      })
    })
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, JwtModule, RolesGuard, TypeOrmModule],
})
export class JwtAuthModule {}