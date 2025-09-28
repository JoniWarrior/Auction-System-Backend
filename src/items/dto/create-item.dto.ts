import { IsString, IsNotEmpty, MinLength, IsOptional, IsUUID } from "class-validator";

export class CreateItemDto {

    @IsNotEmpty({message : "Title is required"})
    title : string

    @IsNotEmpty({message : "A short description is required"})
    @MinLength(15, {message : "Description should be at least 15 chars"})
    description : string
    
    @IsUUID("4", {message : "User Id must be a valid UUID"})
    sellerId : string

    @IsOptional()
    imageURL : string

}
