import { oleoduc, writeData } from "oleoduc"
import { IEligibleTrainingsForAppointment } from "shared"
import { referrers } from "shared/constants/referers"

import { logger } from "../../common/logger"
import { Etablissement, FormationCatalogue, ReferentielOnisep } from "../../common/model/index"
import { db } from "../../common/mongodb"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"

/**
 * @description Gets Catalogue etablissments informations and insert in etablissement collection.
 * @returns {Promise<void>}
 */
export const syncEtablissementsAndFormationsInverted = async () => {
  logger.info("Cron #syncEtablissementsAndFormationsInverted started.")

  await oleoduc(
    db.collection("testETFA").find({ referrers: { $size: 0 } }),
    // EligibleTrainingsForAppointment.find({
    //   referrers: { $size: 0 },
    // }).cursor(),
    writeData(
      async (formation: IEligibleTrainingsForAppointment) => {
        if (!formation.cle_ministere_educatif) return
        const [formationCatalogue, etablissements, existInReferentielOnisep] = await Promise.all([
          FormationCatalogue.findOne({
            cle_ministere_educatif: formation.cle_ministere_educatif,
          }).lean(),
          Etablissement.find({ gestionnaire_siret: formation.etablissement_gestionnaire_siret }).lean(),
          ReferentielOnisep.findOne({ cle_ministere_educatif: formation.cle_ministere_educatif }).lean(),
        ])

        const hasOptOutActivation = etablissements.some((etab) => etab.optout_activation_date !== null && etab.optout_activation_date !== undefined)
        const hasPremiumActivation = etablissements.some((etab) => etab.premium_activation_date !== null && etab.premium_activation_date !== undefined)

        // Activate opt_out referrers
        const referrersToActivate: any[] = []
        if (hasOptOutActivation) {
          referrersToActivate.push(referrers.LBA.name)
          referrersToActivate.push(referrers.JEUNE_1_SOLUTION.name)
          if (existInReferentielOnisep) {
            referrersToActivate.push(referrers.ONISEP.name)
          }
        }

        // Activate premium referrers
        if (hasPremiumActivation && formationCatalogue?.parcoursup_id && formationCatalogue?.parcoursup_statut === "publié") {
          referrersToActivate.push(referrers.PARCOURSUP.name)
        }

        if (!formation.lieu_formation_email) {
          let emailRdv = formationCatalogue?.email

          // Don't override "email" if this field is true
          if (!formation.is_lieu_formation_email_customized) {
            emailRdv = await eligibleTrainingsForAppointmentService.getEmailForRdv({
              email: formationCatalogue?.email,
              etablissement_gestionnaire_courriel: formationCatalogue?.etablissement_gestionnaire_courriel,
              etablissement_gestionnaire_siret: formationCatalogue?.etablissement_gestionnaire_siret,
            })
          }

          await eligibleTrainingsForAppointmentService.updateParameter(formation._id, {
            lieu_formation_email: emailRdv,
            referrers: emailRdv ? referrersToActivate : [],
            last_catalogue_sync_date: new Date(),
          })
        } else {
          await eligibleTrainingsForAppointmentService.updateParameter(formation._id, {
            referrers: referrersToActivate,
            last_catalogue_sync_date: new Date(),
          })
        }
      },
      { parallel: 10 }
    )
  )

  logger.info("Cron #syncEtablissementsAndFormationsInverted done.")
}
