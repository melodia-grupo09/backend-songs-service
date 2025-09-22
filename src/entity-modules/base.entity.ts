import { Entity, OptionalProps, PrimaryKey } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { ClassCtor, toDTO } from 'src/utils/dto.utils';
import { BaseEntity as BE } from '@mikro-orm/core';

@Entity({ abstract: true })
export abstract class BaseEntity<
  Entity extends object,
  Optional extends keyof Entity = never,
> extends BE {
  [OptionalProps]?: Optional;

  @PrimaryKey({ type: 'uuid' })
  id = randomUUID();

  toDTO<Dto extends object>(dtoClass: ClassCtor<Dto>): Dto {
    return toDTO(this, dtoClass);
  }
}
