import Joi from "joi"
import { referrers } from "../../../common/model/constants/referrers.js"

const contextCreateSchema = Joi.alternatives().try(
  // Find through "idParcoursup"
  Joi.object().keys({
    idParcoursup: Joi.string().required(),
    idRcoFormation: Joi.string().allow(""),
    idActionFormation: Joi.string().allow(""),
    idCleMinistereEducatif: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  }),
  // Find through "idRcoFormation"
  Joi.object().keys({
    idRcoFormation: Joi.string().required(),
    idActionFormation: Joi.string().allow(""),
    idParcoursup: Joi.string().allow(""),
    idCleMinistereEducatif: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  }),
  // Find through "idActionFormation"
  Joi.object().keys({
    idActionFormation: Joi.string().required(),
    idRcoFormation: Joi.string().allow(""),
    idParcoursup: Joi.string().allow(""),
    idCleMinistereEducatif: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  }),
  // Find through "idCleMinistereEducatif"
  Joi.object().keys({
    idCleMinistereEducatif: Joi.string().required(),
    idRcoFormation: Joi.string().allow(""),
    idActionFormation: Joi.string().allow(""),
    idParcoursup: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  })
)

export { contextCreateSchema }
