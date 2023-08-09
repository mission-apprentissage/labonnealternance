// @ts-nocheck
import { logger } from "../../common/logger.js"
import { BonnesBoites } from "../../db/index.js"
import { mongooseInstance } from "../../db/mongodb.js"
import { rebuildIndex } from "../../common/utils/esUtils.js"

export default async function refactorLBACFields() {
  logger.info(`Refactorisation des champs LBAC`)
  const db = mongooseInstance.connection

  let res = await db.collections.geolocations.updateMany({}, { $rename: { postcode: "zip_code", geoLocation: "geo_coordinates" } })
  logger.info(`Fin renommage champs de la collection geolocation (${res.result.nModified} items mis à jour)`)

  res = await db.collections.emailblacklists.updateMany({}, { $rename: { source: "blacklisting_origin" } })
  logger.info(`Fin renommage champs de la collection emailblacklists (${res.result.nModified} items mis à jour)`)

  res = await db.collections.applications.updateMany(
    {},
    {
      $rename: {
        company_type: "job_origin",
        applicant_file_name: "applicant_attachment_name",
        message: "applicant_message_to_company",
        company_intention: "company_recruitment_intention",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection applications (${res.result.nModified} items mis à jour)`)

  res = await db.collections.applications.updateMany(
    {},
    {
      $unset: {
        to_applicant_message_status: "",
        applicant_opinion: "",
        applicant_feedback_date: "",
        applicant_feedback: "",
        to_company_message_status: "",
        to_company_update_message_status: "",
        interet_offres_mandataire: "",
        to_applicant_update_message_id: "",
      },
    }
  )
  logger.info(`Fin suppression champs de la collection applications (${res.result.nModified} items mis à jour)`)

  res = await db.collections.apicalls.updateMany(
    {},
    {
      $rename: {
        api: "api_path",
        nb_emplois: "job_count",
        nb_formations: "training_count",
        result: "response",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection apicalls (${res.result.nModified} items mis à jour)`)

  res = await db.collections.bonnesboites.updateMany(
    {},
    {
      $rename: {
        type: "algorithm_origin",
        geo_coordonnees: "geo_coordinates",
        telephone: "phone",
        code_postal: "zip_code",
        ville: "city",
        romes: "rome_codes",
        code_commune: "insee_city_code",
        score: "recruitment_potential",
        intitule_naf: "naf_label",
        libelle_rue: "street_name",
        numero_rue: "street_number",
        raisonsociale: "raison_sociale",
        code_naf: "naf_code",
        tranche_effectif: "company_size",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection bonnesboites (${res.result.nModified} items mis à jour)`)

  logger.info("Début réindexation des bonnes boites")
  await rebuildIndex(BonnesBoites, { skipNotFound: true })
  logger.info("Fin réindexation des bonnes boites")

  logger.info("Refactorisation des champs LBAC terminée")
}
