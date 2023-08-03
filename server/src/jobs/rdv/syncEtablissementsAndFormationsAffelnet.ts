import { oleoduc, writeData } from "oleoduc"
import { Readable } from "stream"
import { logger } from "../../common/logger.js"
import { referrers } from "../../common/model/constants/referrers.js"
import dayjs from "../../services/dayjs.service.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import { isEmailBlacklisted } from "../../services/application.service.js"
import { affelnetSelectedFields, getFormationsFromCatalogueMe } from "../../services/catalogue.service.js"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service.js"

/**
 * Gets email from catalogue field.
 * These email fields can contain "not valid email", "emails separated by ##" or be null.
 * @param {string|null} email
 * @return {string|null}
 */
const getEmailFromCatalogueField = (email) => {
  if (!email) {
    return null
  }

  const divider = "##"
  if (email?.includes(divider)) {
    const emailSplit = email.split(divider).at(-1).toLowerCase()

    return isValidEmail(emailSplit) ? emailSplit : null
  }

  return isValidEmail(email) ? email.toLowerCase() : null
}

/**
 * @description Gets Catalogue etablissments informations and insert in etablissement collection.
 * @returns {Promise<void>}
 */
export const syncAffelnetFormationsFromCatalogueME = async ({ etablissements }) => {
  logger.info("Cron #syncEtablissementsAndFormationsAffelnet started.")

  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 500,
    query: {
      affelnet_perimetre: true,
      cle_ministere_educatif: { $ne: null },
      affelnet_statut: { $in: ["publié", "en attente de publication"] },
    },
    select: affelnetSelectedFields,
  })

  await oleoduc(
    Readable.from(catalogueMinistereEducatif),
    writeData(
      async (formation) => {
        const [eligibleTrainingsForAppointment, etablissement] = await Promise.all([
          eligibleTrainingsForAppointmentService.findOne({
            cle_ministere_educatif: formation.cle_ministere_educatif,
          }),
          etablissements.findOne({ formateur_siret: formation.etablissement_formateur_siret }),
        ])

        const referrersToActivate = eligibleTrainingsForAppointment?.referrers || []

        // Activate "Premium Affelnet" referrers
        if (etablissement?.premium_affelnet_activation_date && !referrersToActivate.includes(referrers.AFFELNET.name)) {
          referrersToActivate.push(referrers.AFFELNET.name)
        }

        if (eligibleTrainingsForAppointment) {
          let emailRdv = eligibleTrainingsForAppointment.lieu_formation_email

          // Don't override "email" if this field is true
          if (!eligibleTrainingsForAppointment?.is_lieu_formation_email_customized) {
            emailRdv =
              getEmailFromCatalogueField(formation.email) ||
              getEmailFromCatalogueField(formation.etablissement_formateur_courriel) ||
              eligibleTrainingsForAppointment.lieu_formation_email
          }

          const emailBlacklisted = await isEmailBlacklisted(emailRdv)

          await eligibleTrainingsForAppointmentService.updateMany(
            { cle_ministere_educatif: formation.cle_ministere_educatif },
            {
              training_id_catalogue: formation._id,
              lieu_formation_email: emailRdv,
              parcoursup_id: formation.parcoursup_id,
              cle_ministere_educatif: formation.cle_ministere_educatif,
              training_code_formation_diplome: formation.cfd,
              etablissement_formateur_zip_code: formation.etablissement_formateur_code_postal,
              training_intitule_long: formation.intitule_long,
              referrers: emailRdv && !emailBlacklisted ? referrersToActivate : [],
              is_catalogue_published: formation.published,
              rco_formation_id: formation.id_rco_formation,
              last_catalogue_sync_date: dayjs().format(),
              lieu_formation_street: formation.lieu_formation_adresse,
              lieu_formation_city: formation.localite,
              lieu_formation_zip_code: formation.code_postal,
              etablissement_formateur_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
              etablissement_formateur_street: formation.etablissement_formateur_adresse,
              departement_etablissement_formateur: formation.etablissement_formateur_nom_departement,
              etablissement_formateur_city: formation.etablissement_formateur_localite,
              etablissement_formateur_siret: formation.etablissement_formateur_siret,
              etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
            }
          )
        } else {
          const emailRdv = getEmailFromCatalogueField(formation.etablissement_formateur_courriel)

          const emailBlacklisted = await isEmailBlacklisted(emailRdv)

          await eligibleTrainingsForAppointmentService.create({
            training_id_catalogue: formation._id,
            lieu_formation_email: emailRdv,
            parcoursup_id: formation.parcoursup_id,
            cle_ministere_educatif: formation.cle_ministere_educatif,
            training_code_formation_diplome: formation.cfd,
            training_intitule_long: formation.intitule_long,
            referrers: emailRdv && !emailBlacklisted ? referrersToActivate : [],
            is_catalogue_published: formation.published,
            rco_formation_id: formation.id_rco_formation,
            lieu_formation_street: formation.lieu_formation_adresse,
            lieu_formation_city: formation.localite,
            lieu_formation_zip_code: formation.code_postal,
            etablissement_formateur_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
            etablissement_formateur_street: formation.etablissement_formateur_adresse,
            etablissement_formateur_zip_code: formation.etablissement_formateur_code_postal,
            departement_etablissement_formateur: formation.etablissement_formateur_nom_departement,
            etablissement_formateur_city: formation.etablissement_formateur_localite,
            etablissement_formateur_siret: formation.etablissement_formateur_siret,
            etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
          })
        }

        let emailDecisionnaire = etablissement?.gestionnaire_email
        if (getEmailFromCatalogueField(formation.etablissement_gestionnaire_courriel)) {
          emailDecisionnaire = getEmailFromCatalogueField(formation.etablissement_gestionnaire_courriel).toLowerCase()
        }

        // Update etablissement model (upsert)
        return etablissements.updateMany(
          {
            formateur_siret: formation.etablissement_formateur_siret,
          },
          {
            affelnet_perimetre: true,
            gestionnaire_siret: formation.etablissement_gestionnaire_siret,
            gestionnaire_email: emailDecisionnaire,
            raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
            formateur_siret: formation.etablissement_formateur_siret,
            formateur_address: formation.etablissement_formateur_adresse,
            formateur_zip_code: formation.etablissement_formateur_code_postal,
            formateur_city: formation.etablissement_formateur_localite,
            last_catalogue_sync_date: dayjs().format(),
          }
        )
      },
      { parallel: 500 }
    )
  )

  logger.info("Cron #syncEtablissementsAndFormationsAffelnet done.")
}
