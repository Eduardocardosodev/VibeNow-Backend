import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Portal do dono: ligar/desligar recompensa pós-feedback e texto exibido no app. */
export class UpdateFeedbackRewardDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string | null;
}
