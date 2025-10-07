import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';
import type { UUID } from 'crypto';

export class BaseEntityDTO {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the entity',
  })
  @IsString()
  id: UUID;

  @ApiProperty({
    type: String,
    example: '2023-10-01T12:00:00Z',
    description: 'Date when the entity was created',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    type: String,
    example: '2023-10-01T12:00:00Z',
    description: 'Date when the entity was last updated',
  })
  @IsDate()
  updatedAt: Date;
}
