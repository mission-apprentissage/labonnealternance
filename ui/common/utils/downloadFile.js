import { getAuth } from "../auth"

/**
 * @description Downloads CSV file.
 * @param {string} url
 * @param {string} filename
 * @returns {Promise<void>}
 */
const download = (url, filename) => {
  const auth = getAuth()

  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    })
}

export default download
