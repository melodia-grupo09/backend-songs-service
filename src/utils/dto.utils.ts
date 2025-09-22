import 'reflect-metadata';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  validateSync,
  ValidationError,
  ValidatorOptions,
} from 'class-validator';
import { BaseEntity } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';

export type ClassCtor<T extends object> = new (...args: never[]) => T;

// Make an instance of the DTO with data from the entity
// stripping fields not declared in the DTO
export function toDTO<Entity extends BaseEntity, Dto extends object>(
  entity: Entity,
  DtoClass: ClassCtor<Dto>,
): Dto {
  const plain = entity.toObject();

  const dtoInstance = plainToInstance(DtoClass, plain, {
    enableImplicitConversion: false,
    enableCircularCheck: true,
    exposeDefaultValues: true,
  });

  const errors: ValidationError[] = validateSync(dtoInstance, {
    whitelist: true,
  });

  if (errors.length) {
    throw new Error(
      `DTO validation failed: ${JSON.stringify(errors, null, 2)}`,
    );
  }

  return instanceToPlain(dtoInstance) as Dto;
}

export function validateDTO<T extends object>(
  cls: new () => T,
  payload: unknown,
  validatorOptions: ValidatorOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
  },
): asserts payload is T {
  const instance = plainToInstance(cls, payload, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(instance, validatorOptions);
  if (errors.length) {
    throw new BadRequestException(errors);
  }
}
