import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateEstablishmentFormDto } from './create-establishment-form.dto';

/**
 * Form multipart: mesmos campos que {@link CreateEstablishmentFormDto} + senha do dono.
 */
export class RegisterEstablishmentAndOwnerFormDto extends CreateEstablishmentFormDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(80)
  ownerName?: string;
}
