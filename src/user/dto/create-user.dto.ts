import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  name: string;

  @IsString()
  @IsNotEmpty()
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
  @MaxLength(20)
  password: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsBoolean()
  @IsNotEmpty()
  acceptedTermsOfUse: boolean;

  @IsBoolean()
  @IsNotEmpty()
  acceptedPrivacyPolicy: boolean;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  name?: string | null;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(20)
  email?: string | null;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(15)
  @IsPhoneNumber('BR')
  phone?: string | null;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(20)
  password?: string | null;
}
