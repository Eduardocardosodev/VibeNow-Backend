import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  establishmentId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80, {
    message: 'A frase deve ter no máximo 80 caracteres.',
  })
  text: string;
}
