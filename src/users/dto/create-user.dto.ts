import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from "class-validator";
import { Role } from "../entities/user.entity";
export class CreateUserDto {

    @IsNotEmpty({message : "Name is required"})
    name : string

    @IsEmail({}, {message : "Email must be valid"})
    email : string

    @MinLength(8, {message : "Passowrd must be at least 8 characters long"})
    password : string

    @MinLength(8, {message : "Passowrd must be at least 8 characters long"})
    confirmPassword : string
    
    @IsOptional()
    @IsEnum(Role, { message : "Role must be either bidder or seller"})
    role : Role;
    

}
