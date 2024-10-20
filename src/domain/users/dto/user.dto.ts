import { IsNumber,IsString,IsNotEmpty } from "class-validator";
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
    @IsString()
    name: string;
    @IsString()
    email: string;
    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    socialId: string;
    @IsString()
    socialType: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserDataDto{
    @IsNumber()
    id: number;
    @IsString()
    name: string;
    @IsString()
    email: string;
    @IsString()
    socialId: string;
    @IsString()
    socialType: string;
}

export class FindBySocialIdDto{
    @IsString()
    socialId: string;
    @IsString()
    socialType: string;
}

export class FindByIdDto{
    @IsNumber()
    id: number;
}