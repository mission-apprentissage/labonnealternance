/**
 * The following code as been copied from https://github.com/IGLU-Agency/mongoose-paginate-ts/blob/3c574c2d61b596f86fbbe0efd54acf72df451c02
 *
 * We cannot use it because our mongoose version doesn't match
 *
 * MIT License
 *
 * Copyright (c) 2020 - 2022 IGLU. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type { Schema, Aggregate, Model } from "mongoose"

export class PaginationModel<T> {
  totalDocs: number | undefined
  limit: number | undefined = 0
  totalPages: number | undefined
  page: number | undefined
  pagingCounter: number | undefined
  hasPrevPage: boolean | undefined = false
  hasNextPage: boolean | undefined = false
  prevPage: number | undefined
  nextPage: number | undefined
  /**
   * @deprecated
   */
  hasMore: boolean | undefined = false // EQUAL TO HAS NEXT PAGE
  docs: T[] = []
}

export interface PaginationOptions {
  key?: string | undefined
  query?: any | undefined
  aggregate?: any | undefined
  populate?: any | undefined
  select?: any | undefined
  sort?: any | undefined
  projection?: any | undefined
  forceCountFunction?: boolean | undefined
  lean?: boolean | undefined
  leanOptions?: any | undefined
  startingAfter?: any | undefined
  endingBefore?: any | undefined
  limit?: any | undefined
  page?: any | undefined
}

export interface Pagination<T> extends Model<T> {
  paginate(options?: PaginationOptions | undefined, onError?: ((e: Error) => unknown) | undefined): Promise<PaginationModel<T> | undefined>
}

export function mongoosePagination<T>(schema: Schema<T>) {
  schema.statics.paginate = async function paginate(options: PaginationOptions | undefined, onError: (e: Error) => unknown | undefined): Promise<PaginationModel<T> | undefined> {
    //MARK: INIT
    const key = options?.key ?? "_id"
    const query = options?.query ?? {}
    const aggregate = options?.aggregate ?? undefined
    const populate = options?.populate ?? undefined
    const select = options?.select ?? undefined
    const sort = options?.sort ?? undefined
    const projection = options?.projection ?? {}
    const forceCountFunction = options?.forceCountFunction ?? false
    const lean = options?.lean ?? true
    const leanOptions = options?.leanOptions ?? { autopopulate: true }
    const startingAfter = options?.startingAfter ?? undefined
    const endingBefore = options?.endingBefore ?? undefined
    //MARK: PAGING
    const limit = parseInt(options?.limit, 10) > 0 ? parseInt(options?.limit, 10) : 0
    let page = 1
    let skip = 0
    if (options?.page != undefined) {
      page = parseInt(options?.page, 10)
      skip = (page - 1) * limit
    }
    let useCursor = false
    if (query != undefined && (startingAfter != undefined || endingBefore != undefined)) {
      useCursor = true
      query[key] = {}
      if (endingBefore != undefined) {
        query[key] = { $lt: endingBefore }
      } else {
        query[key] = { $gt: startingAfter }
      }
    }
    //MARK: COUNTING
    let countPromise
    if (aggregate != undefined) {
      countPromise = this.aggregate(aggregate).count("count")
    } else {
      if (forceCountFunction == true) {
        countPromise = this.count(query).exec()
      } else {
        countPromise = this.countDocuments(query).exec()
      }
    }
    //MARK: QUERY
    let docsPromise = []

    let mQuery: Aggregate<T> | any

    if (aggregate != undefined) {
      mQuery = this.aggregate(aggregate)
      if (select != undefined) {
        mQuery = mQuery.project(select)
      }
    } else {
      mQuery = this.find(query, projection)
      if (select != undefined) {
        mQuery = mQuery.select(select)
      }
      if (lean) {
        mQuery = mQuery.lean(leanOptions)
      }
      if (populate != undefined) {
        mQuery = mQuery.populate(populate)
      }
    }

    if (sort != undefined) {
      mQuery = mQuery.sort(sort)
    }

    if (limit > 0) {
      if (useCursor) {
        mQuery = mQuery.limit(limit + 1)
      } else {
        mQuery = mQuery.skip(skip)
        mQuery = mQuery.limit(limit)
      }
    }
    docsPromise = mQuery.exec()
    //MARK: PERFORM
    try {
      const values = await Promise.all([countPromise, docsPromise])
      const [counts, docs] = values
      let count = 0
      if (aggregate != undefined) {
        if (counts != undefined && counts[0] != undefined && counts[0]["count"] != undefined) {
          count = counts[0]["count"]
        }
      } else {
        count = counts
      }
      const meta = new PaginationModel<T>()
      meta.totalDocs = count
      if (!useCursor) {
        const pages = limit > 0 ? Math.ceil(count / limit) ?? 1 : 0
        meta.limit = count
        meta.totalPages = 1
        meta.page = page
        meta.pagingCounter = (page - 1) * limit + 1
        meta.hasPrevPage = false
        meta.hasNextPage = false
        meta.prevPage = undefined
        meta.nextPage = undefined
        if (limit > 0) {
          meta.limit = limit
          meta.totalPages = pages
          // Set prev page
          if (page > 1) {
            meta.hasPrevPage = true
            meta.prevPage = page - 1
          } else if (page == 1) {
            meta.prevPage = undefined
          } else {
            meta.prevPage = undefined
          }
          // Set next page
          if (page < pages) {
            meta.hasNextPage = true
            meta.nextPage = page + 1
          } else {
            meta.nextPage = undefined
          }
        }
        if (limit == 0) {
          meta.limit = 0
          meta.totalPages = undefined
          meta.page = undefined
          meta.pagingCounter = undefined
          meta.prevPage = undefined
          meta.nextPage = undefined
          meta.hasPrevPage = false
          meta.hasNextPage = false
        }
        meta.hasMore = meta.hasNextPage
      } else {
        meta.limit = undefined
        meta.totalPages = undefined
        meta.page = undefined
        meta.pagingCounter = undefined
        meta.hasPrevPage = undefined
        const hasMore = docs.length === limit + 1
        if (hasMore) {
          docs.pop()
        }
        meta.hasMore = hasMore
        meta.hasNextPage = hasMore
        meta.prevPage = undefined
        meta.nextPage = undefined
      }
      meta.docs = docs
      return meta
    } catch (error) {
      if (onError != undefined) {
        onError(error as Error)
      }
      return undefined
    }
  }
}
