import { omit } from "lodash-es"
import { EnforceDocument } from "mongoose"
import { Pagination } from "mongoose-paginate-ts"
import { Entity } from "./Entity.js"
import { EntityRepository } from "./EntityRepository.js"

export class MongoEntityRepository<T extends Entity> implements EntityRepository<T> {
  constructor(private readonly mongoTable: Pagination<T>) {}

  async getById(id: string): Promise<T> {
    const entity = await this.findById(id)
    if (!entity) {
      throw new Error(`could not find entity with id=${id}`)
    }
    return entity
  }
  async findById(id: string): Promise<T | null> {
    const docOpt = await this.mongoTable.findOne({ _id: id })
    return docOpt ? this.mapDocument(docOpt) : null
  }
  async findBy(query: Partial<T>): Promise<T[]> {
    const documents = await this.mongoTable.find(query)
    return documents.map((document) => this.mapDocument(document))
  }
  async findOneBy(query: Partial<T>): Promise<T | null> {
    const docOpt = await this.mongoTable.findOne(query)
    return docOpt ? this.mapDocument(docOpt) : null
  }
  async create(entity: Omit<T, "_id" | "createdAt" | "updatedAt">): Promise<T> {
    const document = await this.mongoTable.create(omit(entity, "_id"))
    return this.mapDocument(document)
  }
  async update(id: string, entity: Partial<T>): Promise<void> {
    // @ts-ignore
    await this.mongoTable.findOneAndUpdate({ _id: id }, { $set: { ...entity, updatedAt: new Date() } })
  }
  async delete(id: string): Promise<void> {
    await this.mongoTable.deleteOne({ _id: id })
  }
  private mapDocument(mongoDocument: EnforceDocument<T, {}>): T {
    return { ...mongoDocument }
  }
}
