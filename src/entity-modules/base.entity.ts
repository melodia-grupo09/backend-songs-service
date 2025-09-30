import {
  Entity,
  OptionalProps,
  PrimaryKey,
  SerializedPrimaryKey,
} from '@mikro-orm/core';
import { ClassCtor, toDTO } from 'src/utils/dto.utils';
import { BaseEntity as BE } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity({ abstract: true })
export abstract class BaseEntity<
  Entity extends object,
  Optional extends keyof Entity = never,
> extends BE {
  [OptionalProps]?: Optional;

  @PrimaryKey()
  _id: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  toDTO<Dto extends object>(dtoClass: ClassCtor<Dto>): Dto {
    return toDTO(this, dtoClass);
  }
}
