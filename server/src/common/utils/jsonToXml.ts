export const jsonToXml = (json: any): string => {
  if (typeof json === "string") {
    return json
  } else if (json === undefined || json === null) {
    return ""
  } else if (typeof json === "object") {
    if (Array.isArray(json)) {
      return json.map(jsonToXml).join("")
    }
    return Object.entries(json)
      .map(([key, value]) => {
        if (key === "_") {
          return jsonToXml(value)
        }
        if (key === "br") {
          return `<br />${jsonToXml(value)}`
        }
        return `<${key}>${jsonToXml(value)}</${key}>`
      })
      .join("")
  } else {
    throw new Error(`unsupported type: ${typeof json}`)
  }
}
