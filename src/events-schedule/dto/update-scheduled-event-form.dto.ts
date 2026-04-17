import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  EventListType,
  EVENT_LIST_TYPES,
} from '../domain/entities/scheduled-event.entity';

function emptyToUndef({ value }: { value: unknown }) {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}

function emptyToNull({ value }: { value: unknown }) {
  if (value === '') return null;
  return value;
}

function boolFromForm({ value }: { value: unknown }): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

/** Multipart (exceto `photo`) para PATCH /events-schedule/:id/upload. */
export class UpdateScheduledEventFormDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  establishmentId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(2000)
  attractions?: string | null;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(160)
  dj?: string | null;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(500)
  priceInfo?: string | null;

  @IsOptional()
  @IsDateString()
  eventStartsAt?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null ? undefined : value,
  )
  @IsDateString()
  eventEndsAt?: string;

  @IsOptional()
  @IsIn(EVENT_LIST_TYPES)
  listType?: EventListType;

  @IsOptional()
  @Transform(emptyToNull)
  @IsUrl()
  @MaxLength(500)
  posterImageUrl?: string | null;

  @IsOptional()
  @Transform(boolFromForm)
  @IsBoolean()
  offersTableReservation?: boolean;

  @IsOptional()
  @Transform(boolFromForm)
  @IsBoolean()
  offersBoothReservation?: boolean;

  @ValidateIf((o) => o.offersTableReservation === true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  tablePeopleCapacity?: number;

  @ValidateIf((o) => o.offersTableReservation === true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  tablesAvailable?: number;

  @ValidateIf((o) => o.offersTableReservation === true)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  tablePrice?: number;

  @ValidateIf((o) => o.offersBoothReservation === true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  boothPeopleCapacity?: number;

  @ValidateIf((o) => o.offersBoothReservation === true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  boothsAvailable?: number;

  @ValidateIf((o) => o.offersBoothReservation === true)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  boothPrice?: number;
}
