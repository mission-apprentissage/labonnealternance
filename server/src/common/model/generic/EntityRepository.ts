import { Entity } from "./Entity.js"

export type RepositoryValueType = string | number | boolean | Date

export type EntityRepository<T extends Entity> = {
  getById(id: string): Promise<T>
  findById(id: string): Promise<T | null>
  findBy(query: Partial<T>): Promise<T[]>
  findOneBy(query: Partial<T>): Promise<T | null>
  create(entity: Omit<T, "id">): Promise<T>
  update(id: string, entity: Partial<T>): Promise<void>
  delete(id: string): Promise<void>
}
