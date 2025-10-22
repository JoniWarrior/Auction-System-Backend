// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   UnauthorizedException,
//   ForbiddenException,
//   SetMetadata,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { JwtService } from '@nestjs/jwt';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { User } from "../../entity/user.entity";

// export const ROLES_KEY = "roles";
// export const Roles = (...roles : string[]) => SetMetadata(ROLES_KEY, roles);


// @Injectable()
// export class RolesGuard implements CanActivate {
//     constructor(
//         private reflector : Reflector,
//         private jwtService : JwtService,
//         @InjectRepository(User) private usersRepository : Repository<User>
//     ) {}

//     async canActivate(context: ExecutionContext): Promise<boolean>{
//         const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY,
//             [context.getHandler(), context.getClass()]);

//         if (!requiredRoles || requiredRoles.length === 0) return true;

//         const req = context.switchToHttp().getRequest();
//         const authHeader = req.headers.authorization;

//         if (!authHeader) throw new UnauthorizedException("Authorization header missing");

//         const token = authHeader.split(" ")[1];
//         if (!token) throw new UnauthorizedException("Invalid token")

//         try {
//             const payload = this.jwtService.verify(token);

//             const user = await this.usersRepository.findOne({
//                 where : {id : payload.id},
//                 select : ["id", "email", "role", "name"]
//             });

//             if (!user) throw new UnauthorizedException("User not found")

//             req.user = {
//                 id : user.id,
//                 email : user.email,
//                 name : user.name,
//                 role : user.role
//             }

//             if (!requiredRoles.includes(user.role)) throw new ForbiddenException("Access denied: insufficient role")

//             return true;

//         } catch (err) {
//             throw new UnauthorizedException("Invalid or expired token")
//         }

//     }
// }
