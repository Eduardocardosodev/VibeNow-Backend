import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateEmployeeActiveDto {
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
