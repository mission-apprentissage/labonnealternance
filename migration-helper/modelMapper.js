const { schema } = require("./inputSchema")

const isSimpleType = (type) => {
  return ["boolean", "string", "number", "date"].includes(type?.name?.toLowerCase())
}

const generateFromType = (type) => {
  if (isSimpleType(type)) {
    return `.${type.name.toLowerCase()}()`
  } else if (Array.isArray(type) || type === Array) {
    if (isSimpleType(type[0])) {
      return `.array(z${generateFromType(type[0])})`
    } else {
      return `.array(/* TODO */)`
    }
  } else if (type === Object) {
    return `.object()`
  } else {
    throw new Error(`unsupported type: ${type}`)
  }
}

const generateFromEnum = (enumValues) => {
  return `.enum([${enumValues.map((value) => `"${value}"`).join(",")}])`
}

const modelMapper = (rawSchema) => {
  const fields = Object.entries(rawSchema).map(([fieldName, definition]) => {
    try {
      const { type, description } = definition
      const defaultField = definition.default
      const enumValue = definition.enum
      const nullablePart = defaultField === null ? ".nullable()" : ""
      const typeGeneration = enumValue ? generateFromEnum(enumValue) : generateFromType(type)
      return `${fieldName}: z${typeGeneration}${nullablePart}.describe("${description}"),`
    } catch (err) {
      throw new Error(`error reading definition of field=${fieldName}: ${err.message}`)
    }
  })
  return `z.object({
    ${fields.join("\n")}
  }).strict()`
}

console.log(modelMapper(schema))
