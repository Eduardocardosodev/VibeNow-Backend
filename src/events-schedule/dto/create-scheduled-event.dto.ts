import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
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
import { Type } from 'class-transformer';
import {
  EventListType,
  EVENT_LIST_TYPES,
} from '../domain/entities/scheduled-event.entity';

export class CreateScheduledEventDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  establishmentId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  attractions?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  dj?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  priceInfo?: string | null;

  @IsDateString()
  @IsNotEmpty()
  eventStartsAt: string;

  @IsDateString()
  @IsOptional()
  eventEndsAt?: string | null;

  @IsOptional()
  @IsEnum(EVENT_LIST_TYPES)
  listType?: EventListType;

  @IsString()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  posterImageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  offersTableReservation?: boolean;

  /** Obrigatório quando offersTableReservation for true. */
  @ValidateIf((o) => o.offersTableReservation === true)
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(500)
  tablePeopleCapacity?: number;

  /** Quantidade de mesas (obrigatório quando offersTableReservation for true). */
  @ValidateIf((o) => o.offersTableReservation === true)
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(500)
  tablesAvailable?: number;

  /** Valor por mesa (obrigatório quando offersTableReservation for true). */
  @ValidateIf((o) => o.offersTableReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  tablePrice?: number;

  @IsOptional()
  @IsBoolean()
  offersBoothReservation?: boolean;

  /** Obrigatório quando offersBoothReservation for true. */
  @ValidateIf((o) => o.offersBoothReservation === true)
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(500)
  boothPeopleCapacity?: number;

  /** Quantidade de camarotes (obrigatório quando offersBoothReservation for true). */
  @ValidateIf((o) => o.offersBoothReservation === true)
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(500)
  boothsAvailable?: number;

  /** Valor por camarote (obrigatório quando offersBoothReservation for true). */
  @ValidateIf((o) => o.offersBoothReservation === true)
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  boothPrice?: number;
}
