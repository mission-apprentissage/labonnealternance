export function debounce<T, R>(callback: (param: T) => Promise<R>, delay: number): (param: T) => Promise<R> {
  let timer: NodeJS.Timeout

  return (args: T) => {
    return new Promise((resolve, reject) => {
      clearTimeout(timer)
      const localTimer = setTimeout(() => {
        try {
          callback(args)
            .then((output) => localTimer === timer && resolve(output))
            .catch((err) => localTimer === timer && reject(err))
        } catch (err) {
          localTimer === timer && reject(err)
        }
      }, delay)
      timer = localTimer
    })
  }
}
