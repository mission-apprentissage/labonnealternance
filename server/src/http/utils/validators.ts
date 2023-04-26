import Joi from "joi"

const customJoi = Joi.extend((joi) => ({
  type: "arrayOf",
  base: joi.array(),
  // eslint-disable-next-line no-unused-vars
  coerce(value, helpers) {
    return { value: value.split ? value.split(",") : value }
  },
}))

function arrayOf(itemSchema = Joi.string()) {
  return customJoi.arrayOf().items(itemSchema).single()
}

function validate(obj, validators) {
  return Joi.object(validators).validateAsync(obj, { abortEarly: false })
}

export async function validateFullObjectSchema<T = any>(object, schema): Promise<T> {
  return await Joi.object(schema).validateAsync(object, { abortEarly: false })
}

export function siretSchema() {
  return Joi.string()
    .regex(/^[0-9]{14}$/)
    .creditCard()
    .error((errors: any) => {
      const error = errors[0].local
      return new Error(
        error.code === "string.base"
          ? `Error: schema not valid : ValidationError: ${error.key} must be a string`
          : error.value
          ? `Error: schema not valid : ValidationError: ${error.key} must follow Luhn algorithm`
          : `Error: schema not valid : ValidationError: empty ${error.key}`
      )
    })
}

const password = () => Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)

export { arrayOf, validate, password }
