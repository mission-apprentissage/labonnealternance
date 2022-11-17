export const downloadCSV = (fileName, csv) => {
  let blob = new Blob([csv])

  if (window.navigator.msSaveOrOpenBlob) {
    // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
    window.navigator.msSaveBlob(blob, fileName)
  } else {
    let a = window.document.createElement("a")
    a.href = window.URL.createObjectURL(blob, {
      type: "text/plain;charset=UTF-8",
    })
    a.download = fileName
    document.body.appendChild(a)
    a.click() // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
    document.body.removeChild(a)
  }
}

export const CSV_SEPARATOR = ";"

export const escapeDiacritics = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replaceAll(";", ",")

const regex = /^(.*) (\d{4,5}) (.*)$/

const splitter = (str) => str.split(regex).filter(String)

export const getStreet = (str) => splitter(str)[0]
export const getPostcode = (str) => splitter(str)[1]
export const getLocation = (str) => splitter(str)[2]
