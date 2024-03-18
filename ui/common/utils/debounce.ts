export function debounce(callback, delay) {
  let timer

  return (...args) => {
    return new Promise((resolve, reject) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          const output = callback(...args)
          resolve(output)
        } catch (err) {
          reject(err)
        }
      }, delay)
    })
  }
}
