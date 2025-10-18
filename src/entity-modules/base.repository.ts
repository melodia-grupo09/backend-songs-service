import { MongoEntityRepository } from '@mikro-orm/mongodb';

export class BaseRepository<
  Entity extends object,
> extends MongoEntityRepository<Entity> {
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
