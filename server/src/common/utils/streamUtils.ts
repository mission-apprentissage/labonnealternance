import { Transform, TransformCallback, TransformOptions } from "node:stream"

type AccumulateDataOptions<TAcc> = TransformOptions & { accumulator?: TAcc }

type AccumulateDataCallback<TInput, TOutput, TAcc> = (acc: TAcc, data: TInput, flush: (data: TOutput) => void) => TAcc | Promise<TAcc>

function accumulateData<TInput, TOutput, TAcc = TInput>(accumulate: AccumulateDataCallback<TInput, TOutput, TAcc>, options: AccumulateDataOptions<TAcc> = {}): Transform {
  const { accumulator, ...rest } = options
  let acc = (accumulator === undefined ? null : accumulator) as TAcc
  let flushed = false

  return new Transform({
    objectMode: true,
    ...rest,
    async transform(this: Transform, chunk: TInput, _encoding: BufferEncoding, callback: TransformCallback) {
      try {
        flushed = false
        acc = await accumulate(acc, chunk, (data: TOutput) => {
          flushed = true
          this.push(data)
        })

        callback()
      } catch (e) {
        callback(e as Error)
      }
    },
    flush(this: Transform, callback: TransformCallback) {
      if (!flushed && acc !== undefined && acc !== null) {
        this.push(acc)
      }
      callback()
    },
  })
}

type GroupDataOptions<TInput> = {
  size?: number
} & AccumulateDataOptions<TInput[]>

/**
 * Groups incoming stream data into batches of a given size.
 *
 * @param options Configuration with group size and optional initial accumulator
 * @returns A Transform stream emitting arrays of grouped items
 */
export function groupStreamData<TInput>(options: GroupDataOptions<TInput> = {}): Transform {
  return accumulateData<TInput, TInput[], TInput[]>(
    (acc, data, flush) => {
      const group = [...acc, data]
      const groupSize = options.size || 1

      if (group.length === groupSize) {
        flush(group)
        return []
      }

      return group
    },
    {
      ...options,
      accumulator: [],
    }
  )
}
