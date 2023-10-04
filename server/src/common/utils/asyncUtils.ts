export const asyncForEach = async <T>(array: T[], callback: (item: T, index: number) => Promise<void>) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index)
  }
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function timeout(promise, millis) {
  let timeout: NodeJS.Timeout | null = null
  const timeoutPromise = new Promise((resolve, reject) => (timeout = setTimeout(() => reject(`Timed out after ${millis} ms.`), millis)))
  return Promise.race([promise, timeoutPromise]).finally(() => timeout !== null && clearTimeout(timeout))
}

export async function sleep(durationMs: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => {
    let timeout: NodeJS.Timeout | null = null

    const listener = () => {
      if (timeout) clearTimeout(timeout)
      resolve()
    }

    timeout = setTimeout(() => {
      signal?.removeEventListener("abort", listener)
      resolve()
    }, durationMs)

    signal?.addEventListener("abort", listener)
  })
}
