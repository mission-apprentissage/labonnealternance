import Joi from "joi"

export const createJobEntitySchema = Joi.object({
  establishment_siret: Joi.string()
    .pattern(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
    .min(14)
    .max(14)
    .required(),
  establishment_raison_sociale: Joi.string().required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(10)
    .max(10)
    .required(),
  idcc: Joi.string().required(),
  origin: Joi.string(),
})

export const createJobSchema = Joi.object({
  appellation_code: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(5)
    .max(5)
    .required(),
  job_level_label: Joi.string()
    .valid(
      "Indifférent",
      "Cap, autres formations niveau (Infrabac)",
      "BP, Bac, autres formations niveau (Bac)",
      "BTS, DEUST, autres formations niveau (Bac+2)",
      "Licence, autres formations niveau (Bac+3)",
      "Master, titre ingénieur, autres formations niveau (Bac+5)"
    )
    .required(),
  job_start_date: Joi.date().greater("now").iso().required(),
  job_type: Joi.array().items(Joi.string().valid("Apprentissage", "Professionalisation").required()),
  is_disabled_elligible: Joi.boolean().default(false),
  job_count: Joi.number().default(1),
  job_rythm: Joi.string()
    .valid("Indifférent", "2 jours / 3 jours", "1 semaine / 1 semaine", "2 semaines / 3 semaines", "6 semaines / 6 semaines", "Non renseigné")
    .default("Non renseigné"),
  job_duration: Joi.number().min(6).max(36).required(),
  job_description: Joi.string(),
  job_employer_description: Joi.string(),
})

export const updateJobSchema = Joi.object({
  job_level_label: Joi.string().valid(
    "Indifférent",
    "Cap, autres formations niveau (Infrabac)",
    "BP, Bac, autres formations niveau (Bac)",
    "BTS, DEUST, autres formations niveau (Bac+2)",
    "Licence, autres formations niveau (Bac+3)",
    "Master, titre ingénieur, autres formations niveau (Bac+5)"
  ),
  job_start_date: Joi.date().greater("now").iso(),
  job_type: Joi.array().items(Joi.string().valid("Apprentissage", "Professionalisation").required()),
  job_expiration_date: Joi.string(),
  job_status: Joi.string().valid("Active", "Annulée", "Pourvue"),
  is_disabled_elligible: Joi.boolean(),
  job_count: Joi.number(),
  job_duration: Joi.number().min(6).max(36),
  job_rythm: Joi.string().valid("Indifférent", "2 jours / 3 jours", "1 semaine / 1 semaine", "2 semaines / 3 semaines", "6 semaines / 6 semaines"),
  job_description: Joi.string(),
  job_employer_description: Joi.string(),
})

export const createDelegationSchema = Joi.object({
  establishmentIds: Joi.array().items(Joi.string().required()).required(),
})
