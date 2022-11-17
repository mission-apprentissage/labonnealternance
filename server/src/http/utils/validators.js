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

const password = () => Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)

export { arrayOf, validate, password }
