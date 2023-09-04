import { Pagination } from "mongoose-paginate-ts"
import { EntityRepository } from "./EntityRepository.js"
import { Entity } from "./Entity.js"

export class MongoEntityRepository<T extends Entity> implements EntityRepository<T> {
  constructor(private readonly mongoTable: Pagination<T>) {}

  async getById(id: string): Promise<T> {
    const entity = await this.mongoTable.findOne({ _id: id })
    if (!entity) {
      throw new Error(`could not find entity with id=${id}`)
    }
    return entity
  }
  async findById(id: string): Promise<T | null> {
    return this.mongoTable.findOne({ _id: id })
  }
  async findBy(query: Partial<T>): Promise<T[]> {
    return this.mongoTable.find(query).lean()
  }
  async findOneBy(query: Partial<T>): Promise<T | null> {
    return this.mongoTable.findOne(query).lean()
  }
  async create(entity: T): Promise<void> {
    await this.mongoTable.create(entity)
  }
  async update(id: string, entity: Partial<T>): Promise<void> {
    // @ts-ignore
    await this.mongoTable.findOneAndUpdate({ _id: id }, { $set: entity, updatedAt: new Date() })
  }
  async delete(id: string): Promise<void> {
    await this.mongoTable.deleteOne({ _id: id })
  }
}
