import { PartialType } from '@nestjs/swagger';
import { CreateCleanupEventDto } from './create-cleanup-event.dto';

export class UpdateCleanupEventDto extends PartialType(CreateCleanupEventDto) {}
