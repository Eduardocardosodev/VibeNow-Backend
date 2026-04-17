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
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EstablishmentType,
  OpeningHoursMap,
} from '../domain/entities/establishment.entity';

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

function IsOpeningHours(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isOpeningHours',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value == null) return true;
          if (typeof value !== 'object' || Array.isArray(value)) return false;
          const obj = value as Record<string, unknown>;
          for (const key of Object.keys(obj)) {
            if (!DAY_KEYS.includes(key)) return false;
            const v = obj[key];
            if (
              v !== null &&
              (typeof v !== 'object' ||
                !('open' in (v as object)) ||
                !('close' in (v as object)))
            )
              return false;
            if (v && typeof v === 'object' && v !== null) {
              const h = v as { open?: string; close?: string };
              if (
                typeof h.open !== 'string' ||
                typeof h.close !== 'string' ||
                !TIME_REGEX.test(h.open) ||
                !TIME_REGEX.test(h.close)
              )
                return false;
            }
          }
          return true;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'openingHours: use chaves monday..sunday e valores null ou { open: "HH:mm", close: "HH:mm" }';
        },
      },
    });
  };
}

export class CreateEstablishmentDto {
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

  /** Número do endereço (ex.: 1200, 42A, S/N). */
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

  @IsString()
  @IsOptional()
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

  /** Horário por dia (monday..sunday). Ex: { "friday": { "open": "18:00", "close": "02:00" }, "sunday": null }. Opcional no cadastro. */
  @IsOptional()
  @IsObject()
  @IsOpeningHours()
  openingHours?: OpeningHoursMap | null;
}
