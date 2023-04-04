// @ts-nocheck
import { logger } from "../../common/logger.js"
import { mongooseInstance } from "../../common/mongodb.js"
import { getReferrerById } from "../../common/model/constants/referrers.js"
import { mailType } from "../../common/model/constants/appointments.js"

export const cleanAndRenameFields = async ({ appointments, eligibleTrainingsForAppointments }) => {
  logger.info(`#cleanAndRenameFields start.`)
  const db = mongooseInstance.connection

  // Appointments: deletions
  let res = await db.collections.appointments.updateMany(
    {},
    {
      $unset: {
        candidat_contacted_at: "",
        champs_libre_status: "",
        cfa_pris_contact_candidat_date: "",
        date_de_reponse_cfa: "",
        referrer_link: "",
        cfa_pris_contact_candidat: "",
        statut_general: "",
        numero_de_la_demande: "",
        last_updated_at: "",
        last_update_at: "",
        champs_libre_commentaire: "",
        id_rco_formation: "",
        cfa_gestionnaire_siret: "",
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
        cfa_read_appointment_details_at: "cfa_read_appointment_details_date",
        cfa_mailing: "to_cfa_mails",
        candidat_mailing: "to_applicant_mails",
        referrer: "appointment_origin",
        motivations: "applicant_message_to_cfa",
        email_cfa: "cfa_recipient_email",
        formation_id: "cfa_formateur_siret",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection appointments (${res.result.nModified} items mis à jour)`)

  // Rename "referrer" id (number) and migrate to mailing collections
  const allAppointments = await appointments.find({})

  for (const appointment of allAppointments) {
    await appointment.update({
      appointment_origin: getReferrerById(appointment.appointment_origin).name,
      $push: {
        to_cfa_mails: {
          campaign: mailType.CANDIDAT_APPOINTMENT,
          status: appointment.email_premiere_demande_cfa_statut,
          message_id: appointment.email_premiere_demande_cfa_message_id,
          email_sent_at: appointment.email_premiere_demande_cfa_date,
        },
        to_applicant_mails: {
          campaign: mailType.CANDIDAT_APPOINTMENT,
          status: appointment.email_premiere_demande_candidat_statut,
          message_id: appointment.email_premiere_demande_candidat_message_id,
          email_sent_at: appointment.email_premiere_demande_candidat_date,
        },
      },
    })
  }

  logger.info(`Fin de la migration des emails et des referrers.`)

  // Appointments: deletions
  res = await db.collections.appointments.updateMany(
    {},
    {
      $unset: {
        email_premiere_demande_cfa_ouvert: "",
        email_premiere_demande_candidat_envoye: "",
        email_premiere_demande_cfa_date: "",
        email_premiere_demande_cfa_statut: "",
        email_premiere_demande_cfa_message_id: "",
        email_premiere_demande_cfa_envoye: "",
        email_premiere_demande_cfa_statut_date: "",
        email_premiere_demande_candidat_message_id: "",
        email_premiere_demande_candidat_statut_date: "",
        email_premiere_demande_candidat_ouvert: "",
        email_premiere_demande_candidat_date: "",
        email_premiere_demande_candidat_statut: "",
      },
    }
  )
  logger.info(`Fin suppression champs de la collection appointments (${res.result.nModified} items mis à jour)`)

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
        adresse: "formateur_address",
        code_postal: "formateur_zip_code",
        premium_invited_at: "premium_invitation_date",
        opt_out_will_be_activated_at: "optout_activation_scheduled_date",
        opt_out_invited_at: "optout_invitation_date",
        siret_gestionnaire: "gestionnaire_siret",
        premium_refused_at: "premium_refusal_date",
        last_catalogue_sync: "last_catalogue_sync_date",
        localite: "formateur_city",
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
  await db.collection("widgetparameters").rename("eligible_trainings_for_appointments")

  // EligibleTrainingsForAppointments: deletions
  res = await db.collection("eligible_trainings_for_appointments").updateMany(
    {},
    {
      $unset: {
        code_postal: "",
        etablissement_siret: "",
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
        localite: "lieu_formation_city",
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

  for (const item of allEligibleTrainingsForAppointments) {
    await item.update({ referrers: item.referrers.map((referrer) => getReferrerById(referrer).name) })
  }
  logger.info(`Fin de migration des referrers pour les "eligibleTrainingsForAppointments"`)
}
