import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
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

function boolDefaultFalse({ value }: { value: unknown }): boolean {
  if (value === undefined || value === null || value === '') return false;
  return value === true || value === 'true' || value === '1';
}

/** Multipart (exceto ficheiro `photo`) para POST /events-schedule/upload. */
export class CreateScheduledEventFormDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  establishmentId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(2000)
  attractions?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(160)
  dj?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(500)
  priceInfo?: string;

  @IsDateString()
  @IsNotEmpty()
  eventStartsAt: string;

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
  @Transform(emptyToUndef)
  @IsUrl()
  @MaxLength(500)
  posterImageUrl?: string;

  @Transform(boolDefaultFalse)
  @IsBoolean()
  offersTableReservation: boolean;

  @Transform(boolDefaultFalse)
  @IsBoolean()
  offersBoothReservation: boolean;

  @ValidateIf((o) => o.offersTableReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  tablePeopleCapacity?: number;

  @ValidateIf((o) => o.offersTableReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  tablesAvailable?: number;

  @ValidateIf((o) => o.offersTableReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  tablePrice?: number;

  @ValidateIf((o) => o.offersBoothReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  boothPeopleCapacity?: number;

  @ValidateIf((o) => o.offersBoothReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  boothsAvailable?: number;

  @ValidateIf((o) => o.offersBoothReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  boothPrice?: number;
}
