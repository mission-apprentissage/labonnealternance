import { ObjectId } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { referrers } from "shared/constants/referers"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { getEmailForRdv } from "../../services/eligibleTrainingsForAppointment.service"
import { findFirstNonBlacklistedEmail } from "../../services/formation.service"

const hasDateProperty = (etablissements, propertyName) => {
  return etablissements.some((etab) => etab[propertyName] !== null && etab[propertyName] !== undefined)
}

/**
 * @description Gets Catalogue etablissments informations and insert in etablissement collection.
 * @returns {Promise<void>}
 */
export const syncEtablissementsAndFormations = async () => {
  logger.info("Cron #syncEtablissementsAndFormations started.")

  await oleoduc(
    getDbCollection("formationcatalogues").find({}).stream(),
    writeData(
      async (formation) => {
        const [eligibleTrainingsForAppointment, etablissements, existInReferentielOnisep] = await Promise.all([
          getDbCollection("eligible_trainings_for_appointments").findOne(
            {
              cle_ministere_educatif: formation.cle_ministere_educatif,
            },
            { projection: { lieu_formation_email: 1, is_lieu_formation_email_customized: 1 } }
          ),
          getDbCollection("etablissements")
            .find(
              {
                gestionnaire_siret: formation.etablissement_gestionnaire_siret,
              },
              {
                projection: {
                  premium_affelnet_activation_date: 1,
                  optout_refusal_date: 1,
                  optout_activation_date: 1,
                  premium_refusal_date: 1,
                  premium_activation_date: 1,
                  premium_affelnet_refusal_date: 1,
                  gestionnaire_email: 1,
                },
              }
            )
            .toArray(),
          getDbCollection("referentieloniseps").findOne({ cle_ministere_educatif: formation.cle_ministere_educatif }),
        ])

        const hasPremiumAffelnetActivation = hasDateProperty(etablissements, "premium_affelnet_activation_date")
        const hasOptOutRefusal = hasDateProperty(etablissements, "optout_refusal_date")
        const hasOptOutActivation = hasDateProperty(etablissements, "optout_activation_date")
        const hasPremiumRefusal = hasDateProperty(etablissements, "premium_refusal_date")
        const hasPremiumActivation = hasDateProperty(etablissements, "premium_activation_date")
        const hasPremiumAffelnetRefusal = hasDateProperty(etablissements, "premium_affelnet_refusal_date")

        const emailArray = etablissements.map((etab) => {
          return { email: etab.gestionnaire_email }
        })
        let gestionnaireEmail = await findFirstNonBlacklistedEmail(emailArray)

        // Activate opt_out referrers
        const referrersToActivate: string[] = []
        if (hasOptOutActivation && !hasOptOutRefusal) {
          referrersToActivate.push(referrers.LBA.name)
          referrersToActivate.push(referrers.JEUNE_1_SOLUTION.name)
          if (existInReferentielOnisep) {
            referrersToActivate.push(referrers.ONISEP.name)
          }
        }

        // Activate parcoursup premium referrer
        if (hasPremiumActivation && !hasPremiumRefusal && formation.parcoursup_visible) {
          referrersToActivate.push(referrers.PARCOURSUP.name)
        }
        // Activate affelnet premium referrer
        if (hasPremiumAffelnetActivation && !hasPremiumAffelnetRefusal && formation.affelnet_visible) {
          referrersToActivate.push(referrers.AFFELNET.name)
        }

        if (eligibleTrainingsForAppointment) {
          let emailRdv = eligibleTrainingsForAppointment.lieu_formation_email

          // Don't override "email" if this field is true
          if (!eligibleTrainingsForAppointment?.is_lieu_formation_email_customized) {
            emailRdv = await getEmailForRdv({
              email: formation.email,
              etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel,
              etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
            })
          }

          await getDbCollection("eligible_trainings_for_appointments").updateOne(
            { _id: eligibleTrainingsForAppointment._id },
            {
              $set: {
                training_id_catalogue: formation._id.toString(),
                lieu_formation_email: emailRdv,
                parcoursup_id: formation.parcoursup_id,
                parcoursup_visible: formation.parcoursup_visible,
                affelnet_visible: formation.affelnet_visible,
                training_code_formation_diplome: formation.cfd,
                etablissement_formateur_zip_code: formation.etablissement_formateur_code_postal,
                training_intitule_long: formation.intitule_long,
                referrers: referrersToActivate,
                is_catalogue_published: formation.published,
                last_catalogue_sync_date: new Date(),
                lieu_formation_street: formation.lieu_formation_adresse,
                lieu_formation_city: formation.localite,
                lieu_formation_zip_code: formation.code_postal,
                etablissement_formateur_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
                etablissement_formateur_street: formation.etablissement_formateur_adresse,
                departement_etablissement_formateur: formation.etablissement_formateur_nom_departement,
                etablissement_formateur_city: formation.etablissement_formateur_localite,
              },
            }
          )
        } else {
          // insert formation even if email if empty
          const emailRdv = await getEmailForRdv({
            email: formation.email,
            etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel,
            etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
          })

          const now = new Date()

          await getDbCollection("eligible_trainings_for_appointments").insertOne({
            _id: new ObjectId(),
            created_at: now,
            last_catalogue_sync_date: now,
            rco_formation_id: formation.id_rco_formation,
            training_id_catalogue: formation._id.toString(),
            lieu_formation_email: emailRdv ?? null,
            parcoursup_id: formation.parcoursup_id,
            parcoursup_visible: formation.parcoursup_visible,
            affelnet_visible: formation.affelnet_visible,
            cle_ministere_educatif: formation.cle_ministere_educatif,
            training_code_formation_diplome: formation.cfd,
            training_intitule_long: formation.intitule_long,
            referrers: referrersToActivate,
            is_catalogue_published: formation.published,
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

        if (!gestionnaireEmail) {
          gestionnaireEmail = await getEmailForRdv(
            { etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel, etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret },
            "etablissement_gestionnaire_courriel"
          )
        }

        await getDbCollection("etablissements").updateMany(
          { $and: [{ formateur_siret: formation.etablissement_formateur_siret, gestionnaire_siret: formation.etablissement_gestionnaire_siret }] },
          {
            $set: {
              gestionnaire_siret: formation.etablissement_gestionnaire_siret,
              gestionnaire_email: gestionnaireEmail,
              raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
              formateur_siret: formation.etablissement_formateur_siret,
              formateur_address: formation.etablissement_formateur_adresse,
              formateur_zip_code: formation.etablissement_formateur_code_postal,
              formateur_city: formation.etablissement_formateur_localite,
              last_catalogue_sync_date: new Date(),
            },
          },
          {
            upsert: true,
          }
        )
      },
      { parallel: 5 }
    )
  )

  logger.info("Cron #syncEtablissementsAndFormations done.")
}
