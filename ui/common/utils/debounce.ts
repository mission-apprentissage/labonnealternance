export function debounce(callback, delay) {
  let timer

  return (...args) => {
    return new Promise((resolve, reject) => {
      clearTimeout(timer)
      const localTimer = setTimeout(() => {
        try {
          callback(...args)
            .then((output) => localTimer === timer && resolve(output))
            .catch((err) => localTimer === timer && reject(err))
        } catch (err) {
          reject(err)
        }
      }, delay)
      timer = localTimer
    })
  }
}
