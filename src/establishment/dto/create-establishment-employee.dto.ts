import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEstablishmentEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  @IsPhoneNumber('BR')
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
