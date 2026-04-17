import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateEstablishmentDto } from './create-establishment.dto';

/**
 * Autoatendimento: cria estabelecimento + utilizador dono num único passo.
 * Login do portal: mesmo `email` e `password` (e-mail = e-mail de contacto do estabelecimento).
 */
export class RegisterEstablishmentAndOwnerDto extends CreateEstablishmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  /** Nome do responsável no portal; se omitido, usa o nome fantasia do estabelecimento (`name`). */
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(80)
  ownerName?: string;
}
