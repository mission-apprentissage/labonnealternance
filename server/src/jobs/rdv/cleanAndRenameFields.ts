// @ts-nocheck
import { logger } from "../../common/logger.js"
import { mongooseInstance } from "../../common/mongodb.js"
import { getReferrerById } from "../../common/model/constants/referrers.js"

export const cleanAndRenameFields = async ({ appointments, eligibleTrainingsForAppointments }) => {
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
  logger.info(`Fin renommage champs de la collection appointments (${res.result.nModified} items mis à jour)`)

  // Rename "referrer" id (number) to string name
  const allAppointments = await appointments.find()
  await Promise.all(allAppointments.map((appointment) => appointment.update({ appointment_origin: getReferrerById(appointment.appointment_origin).name })))

  // Etablissements: deletions
  res = await db.collections.etablissements.updateMany(
    {},
    {
      $unset: {
        opt_out_question: "",
        opt_in_activated_at: "",
        opt_mode: "",
        etablissement_formateur_courriel: "",
      },
    }
  )
  logger.info(`Fin suppression champs de la collection etablissements (${res.result.nModified} items mis à jour)`)

  // Etablissements: renames
  res = await db.collections.etablissements.updateMany(
    {},
    {
      $rename: {
        adresse: "address",
        code_postal: "zip_code",
        premium_invited_at: "premium_invitation_date",
        opt_out_will_be_activated_at: "optout_activation_scheduled_date",
        opt_out_invited_at: "optout_invitation_date",
        siret_gestionnaire: "gestionnaire_siret",
        premium_refused_at: "premium_refusal_date",
        last_catalogue_sync: "last_catalogue_sync_date",
        localite: "city",
        opt_out_activated_at: "optout_activation_date",
        premium_activated_at: "premium_activation_date",
        opt_out_refused_at: "optout_refusal_date",
        siret_formateur: "formateur_siret",
        email_decisionnaire: "gestionnaire_email",
        mailing: "to_etablissement_emails",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection etablissements (${res.result.nModified} items mis à jour)`)

  // Rename collection
  await db
    .collection("widgetparameters")
    .rename("eligible_trainings_for_appointments")

  // EligibleTrainingsForAppointments: deletions
  res = await db.collection("eligible_trainings_for_appointments").updateMany(
    {},
    {
      $unset: {
        code_postal: "",
      },
    }
  )
  logger.info(`Fin suppression champs de la collection eligibleTrainingsForAppointments (${res.result.nModified} items mis à jour)`)

  // EligibleTrainingsForAppointments: renames
  res = await db.collection("eligible_trainings_for_appointments").updateMany(
    {},
    {
      $rename: {
        etablissement_formateur_code_postal: "etablissement_formateur_zip_code",
        etablissement_raison_sociale: "etablissement_formateur_raison_sociale",
        etablissement_formateur_localite: "etablissement_formateur_city",
        formation_intitule: "training_intitule_long",
        last_catalogue_sync: "last_catalogue_sync_date",
        etablissement_formateur_adresse: "etablissement_formateur_street",
        formation_cfd: "training_code_formation_diplome",
        catalogue_published: "is_catalogue_published",
        id_rco_formation: "training_id_rco_catalogue",
        id_parcoursup: "parcoursup_id",
        email_rdv: "lieu_formation_email",
        localite: "city",
        is_custom_email_rdv: "is_lieu_formation_email_customized",
        etablissement_formateur_nom_departement: "departement_etablissement_formateur",
        lieu_formation_adresse: "lieu_formation_street",
        id_catalogue: "training_id_catalogue",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection eligibleTrainingsForAppointments (${res.result.nModified} items mis à jour)`)

  // Rename "referrers" ids (number) to string name
  const allEligibleTrainingsForAppointments = await eligibleTrainingsForAppointments.find({})
  await Promise.all(allEligibleTrainingsForAppointments.map((item) => item.update({ referrers: item.referrers.map((referrer) => getReferrerById(referrer).name) })))
}
