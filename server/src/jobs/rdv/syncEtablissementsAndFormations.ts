import { oleoduc, writeData } from "oleoduc"
import { logger } from "../../common/logger.js"
import { referrers } from "../../common/model/constants/referrers.js"
import { FormationCatalogue } from "../../common/model/index.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import { isEmailBlacklisted } from "../../services/application.service.js"
import { getFormationsFromCatalogueMe } from "../../services/catalogue.service.js"
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
export const syncEtablissementsAndFormations = async ({ etablissements }) => {
  logger.info("Cron #syncEtablissementsAndFormations started.")

  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 1000,
    query: {
      parcoursup_id: { $ne: null },
      cle_ministere_educatif: { $ne: null },
      parcoursup_statut: "publié",
      published: true,
      catalogue_published: true,
    },
    select: { parcoursup_id: 1, cle_ministere_educatif: 1 },
  })

  await oleoduc(
    FormationCatalogue.find({
      cle_ministere_educatif: { $ne: null },
    }).cursor(),
    writeData(
      async (formation) => {
        const [eligibleTrainingsForAppointment, etablissement, formationMinistereEducatif] = await Promise.all([
          eligibleTrainingsForAppointmentService.findOne({
            cle_ministere_educatif: formation.cle_ministere_educatif,
          }),
          etablissements.findOne({ siret_formateur: formation.etablissement_formateur_siret }),
          catalogueMinistereEducatif.find((formationMe) => formationMe.cle_ministere_educatif === formation.cle_ministere_educatif),
        ])

        // Activate opt_out referrers
        const referrersToActivate = []
        if (etablissement?.opt_out_activated_at) {
          referrersToActivate.push(referrers.LBA.code)
          referrersToActivate.push(referrers.ONISEP.code)
          referrersToActivate.push(referrers.PFR_PAYS_DE_LA_LOIRE.code)
          referrersToActivate.push(referrers.JEUNE_1_SOLUTION.code)
        }

        // Activate premium referrers
        if (etablissement?.premium_activated_at) {
          referrersToActivate.push(referrers.PARCOURSUP.code)
        }

        if (widgetParameter) {
          let emailRdv = widgetParameter.email_rdv

          // Don't override "email" if this field is true
          if (!widgetParameter?.is_custom_email_rdv) {
            emailRdv = getEmailFromCatalogueField(formation.email) || getEmailFromCatalogueField(formation.etablissement_formateur_courriel) || widgetParameter.email_rdv
          }

          const emailBlacklisted = await isEmailBlacklisted(emailRdv)

          await eligibleTrainingsForAppointmentService.updateMany(
            { cle_ministere_educatif: formation.cle_ministere_educatif },
            {
              id_catalogue: formation._id,
              email_rdv: emailRdv,
              id_parcoursup: formationMinistereEducatif?.parcoursup_id,
              cle_ministere_educatif: formation.cle_ministere_educatif,
              formation_cfd: formation.cfd,
              code_postal: formation.code_postal,
              formation_intitule: formation.intitule_long,
              referrers: emailRdv && !emailBlacklisted ? referrersToActivate : [],
              catalogue_published: formation.published,
              id_rco_formation: formation.id_rco_formation,
              cfd: formation.cfd,
              localite: formation.localite,
              last_catalogue_sync: dayjs().format(),
              etablissement_siret: formation.etablissement_formateur_siret,
              etablissement_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
              etablissement_formateur_adresse: formation.etablissement_formateur_adresse,
              etablissement_formateur_code_postal: formation.etablissement_formateur_code_postal,
              etablissement_formateur_nom_departement: formation.etablissement_formateur_nom_departement,
              etablissement_formateur_localite: formation.etablissement_formateur_localite,
              lieu_formation_adresse: formation.lieu_formation_adresse,
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
            parcoursup_id: formationMinistereEducatif?.parcoursup_id,
            cle_ministere_educatif: formation.cle_ministere_educatif,
            formation_cfd: formation.cfd,
            code_postal: formation.code_postal,
            formation_intitule: formation.intitule_long,
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
            siret_formateur: formation.etablissement_formateur_siret,
          },
          {
            siret_formateur: formation.etablissement_formateur_siret,
            siret_gestionnaire: formation.etablissement_gestionnaire_siret,
            email_decisionnaire: emailDecisionnaire,
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

  logger.info("Cron #syncEtablissementsAndFormations done.")
}
