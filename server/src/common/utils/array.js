/**
 * @description Removes duplicated objects.
 * @param {T[]} arr
 * @param {string[]} properties
 * @returns {T[]}
 */
const getUniqueArray = (arr, properties) => {
  const modifiedArray = []

  if (properties.length === 0 && arr.length > 0) {
    properties.push(...Object.keys(arr[0]))
  }

  arr.map((item) => {
    if (modifiedArray.length === 0) {
      return modifiedArray.push(item)
    }

    if (!modifiedArray.some((item2) => properties.every((property) => item2[property] === item[property]))) {
      return modifiedArray.push(item)
    }
  })

  return modifiedArray
}

export { getUniqueArray }
