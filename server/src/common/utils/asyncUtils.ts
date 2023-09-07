export const asyncForEach = async <T>(array: T[], callback: (item: T, index: number) => Promise<void>) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index)
  }
}

export const asyncForEachGrouped = async <T>(array: T[], groupSize: number, callback: (item: T, index: number) => Promise<void>) => {
  for (let index = 0; index < array.length; index += groupSize) {
    const group = array.slice(index, index + groupSize)
    await Promise.all(group.map((item, itemIndex) => callback(item, index + itemIndex)))
  }
}

export const asyncForEachWithCursor = async <T>(cursor: { next: () => Promise<T | null> }, callback: (item: T, index: number) => Promise<void>) => {
  let index = 0
  for (let item = await cursor.next(); item !== null; item = await cursor.next()) {
    await callback(item, index++)
  }
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function timeout(promise, millis) {
  let timeout: NodeJS.Timeout | null = null
  const timeoutPromise = new Promise((resolve, reject) => (timeout = setTimeout(() => reject(`Timed out after ${millis} ms.`), millis)))
  return Promise.race([promise, timeoutPromise]).finally(() => timeout !== null && clearTimeout(timeout))
}
