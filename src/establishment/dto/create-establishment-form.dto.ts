import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  EstablishmentType,
  OpeningHoursMap,
} from '../domain/entities/establishment.entity';
import { IsOpeningHours } from './create-establishment.dto';

function emptyToUndefined({ value }: { value: unknown }): unknown {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}

/** multipart: `openingHours` pode vir como JSON string. */
function openingHoursFromForm({ value }: { value: unknown }): unknown {
  if (value === '' || value === undefined || value === null) return undefined;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

/** Campos de multipart (exceto ficheiro `photo`) para criar estabelecimento. */
export class CreateEstablishmentFormDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(14)
  @MaxLength(14)
  cnpj: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  addressNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(9)
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  instagram: string;

  @IsEnum(['LOUNGE', 'PARTY'] as const)
  establishmentType: EstablishmentType;

  /** URL alternativa se não enviar ficheiro `photo`. */
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUrl()
  @MaxLength(500)
  profilePhoto?: string | null;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @Transform(openingHoursFromForm)
  @IsObject()
  @IsOpeningHours()
  openingHours?: OpeningHoursMap | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(64)
  operatingTimeZone?: string;
}
