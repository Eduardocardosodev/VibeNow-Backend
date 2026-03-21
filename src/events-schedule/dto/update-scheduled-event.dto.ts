import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduledEventDto } from './create-scheduled-event.dto';

export class UpdateScheduledEventDto extends PartialType(
  CreateScheduledEventDto,
) {}
