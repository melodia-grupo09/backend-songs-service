import { EntityRepository } from '@mikro-orm/postgresql';

export class BaseRepository<
  Entity extends object,
> extends EntityRepository<Entity> {
  persist(entity: Entity): void {
    this.getEntityManager().persist(entity);
  }

  async flush(): Promise<void> {
    await this.getEntityManager().flush();
  }

  async persistAndFlush(entity: Entity): Promise<void> {
    this.getEntityManager().persist(entity);
    await this.getEntityManager().flush();
  }

  delete(entity: Entity): void {
    this.getEntityManager().remove(entity);
  }
}
