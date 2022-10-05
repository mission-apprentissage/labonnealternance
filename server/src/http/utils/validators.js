import Joi from "joi";

const customJoi = Joi.extend((joi) => ({
  type: "arrayOf",
  base: joi.array(),
  // eslint-disable-next-line no-unused-vars
  coerce(value, helpers) {
    return { value: value.split ? value.split(",") : value };
  },
}));

export function arrayOf(itemSchema = Joi.string()) {
  return customJoi.arrayOf().items(itemSchema).single();
}

export function validate(obj, validators) {
  return Joi.object(validators).validateAsync(obj, { abortEarly: false });
}
