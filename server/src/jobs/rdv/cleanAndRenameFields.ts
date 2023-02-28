// @ts-nocheck
import { logger } from "../../common/logger.js"
import { BonnesBoites } from "../../common/model/index.js"
import { mongooseInstance } from "../../common/mongodb.js"
import { rebuildIndex } from "../../common/utils/esUtils.js"
import { getReferrerById } from "../../common/model/constants/referrers.js"

export default async function cleanAndRenameFields() {
  logger.info(`#cleanAndRenameFields start.`)
  const db = mongooseInstance.connection

  // Appointments: deletions
  let res = await db.collections.appointments.updateMany(
    {},
    {
      $unset: {
        email_premiere_demande_cfa_ouvert: "",
        email_premiere_demande_candidat_envoye: "",
        email_premiere_demande_cfa_date: "",
        email_premiere_demande_cfa_statut: "",
        candidat_contacted_at: "",
        email_premiere_demande_cfa_statut_date: "",
        email_premiere_demande_candidat_message_id: "",
        email_premiere_demande_candidat_statut_date: "",
        champs_libre_status: "",
        email_premiere_demande_cfa_envoye: "",
        date_de_reponse_cfa: "",
        referrer_link: "",
        cfa_pris_contact_candidat: "",
        email_premiere_demande_candidat_ouvert: "",
        statut_general: "",
        email_premiere_demande_candidat_date: "",
        numero_de_la_demande: "",
        email_premiere_demande_candidat_statut: "",
        last_updated_at: "",
      },
    }
  )
  logger.info(`Fin suppression champs de la collection appointments (${res.result.nModified} items mis à jour)`)

  // Appointments: renames
  res = await db.collections.appointments.updateMany(
    {},
    {
      $rename: {
        etablissement_id: "cfa_gestionnaire_siret",
        candidat_id: "applicant_id",
        cfa_pris_contact_candidat_date: "cfa_callback_intention_date",
        cfa_read_appointment_details_at: "cfa_read_appointment_details_date",
        cfa_mailing: "to_cfa_mails",
        candidat_mailing: "to_applicant_mails",
        referrer: "appointment_origin",
        motivations: "applicant_message_to_cfa",
        champs_libre_commentaire: "admin_comment",
        email_cfa: "cfa_recipient_email",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection geolocation (${res.result.nModified} items mis à jour)`)

  // Rename "referrer" id (number) to string name
  const appointments = await db.collections.appointments.find({})
  await Promise.all(appointments.map((appointment) => appointment.update({ referrer: getReferrerById(appointment.referrer).name })))






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
