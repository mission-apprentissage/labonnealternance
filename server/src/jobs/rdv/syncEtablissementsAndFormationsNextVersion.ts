// @ts-ignore
import { oleoduc, writeData } from "oleoduc"
import { IEligibleTrainingsForAppointment, IEtablissement } from "shared"
import { referrers } from "shared/constants/referers"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { isValidEmail } from "../../common/utils/isValidEmail"
import { isEmailBlacklisted } from "../../services/application.service"
import { getMostFrequentEmailByGestionnaireSiret } from "../../services/formation.service"

import { removeDuplicateEtablissements } from "./removeDuplicateEtablissements"

const prepareETFA = async () => {
  await getDbCollection("formationcatalogues").aggregate([
    {
      $project: {
        training_id_catalogue: "$_id",
        lieu_formation_email: {
          $cond: {
            if: { $regexMatch: { input: "$email", regex: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/ } },
            then: "$email",
            else: {
              $cond: {
                if: { $regexMatch: { input: "$etablissement_gestionnaire_courriel", regex: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/ } },
                then: "$etablissement_gestionnaire_courriel",
                else: null,
              },
            },
          },
        },
        parcoursup_id: "$parcoursup_id",
        cle_ministere_educatif: "$cle_ministere_educatif",
        training_code_formation_diplome: "$cfd",
        etablissement_formateur_zip_code: "$etablissement_formateur_code_postal",
        training_intitule_long: "$intitule_long",
        referrers: { $literal: [] },
        is_catalogue_published: "$published",
        last_catalogue_sync_date: { $literal: new Date() },
        lieu_formation_street: "$lieu_formation_adresse",
        lieu_formation_city: "$localite",
        lieu_formation_zip_code: "$code_postal",
        etablissement_formateur_raison_sociale: "$etablissement_formateur_entreprise_raison_sociale",
        etablissement_formateur_street: "$etablissement_formateur_adresse",
        departement_etablissement_formateur: "$etablissement_formateur_nom_departement",
        etablissement_formateur_city: "$etablissement_formateur_localite",
        etablissement_formateur_siret: "$etablissement_formateur_siret",
        etablissement_gestionnaire_siret: "$etablissement_gestionnaire_siret",
        affelnet_visible: "$affelnet_visible",
        parcoursup_visible: "$parcoursup_visible",
        email_catalogue: "$email",
        etablissement_gestionnaire_courriel_catalogue: "$etablissement_gestionnaire_courriel",
      },
    },
    {
      $match: {
        cle_ministere_educatif: { $ne: null },
      },
    },
    {
      $out: "eligible_trainings_for_appointments",
    },
  ])
}

const updateLieuFormationEmail = async () => {
  const etfa = (await getDbCollection("eligible_trainings_for_appointments")
    .find({})
    .project({ etablissement_gestionnaire_siret: 1, lieu_formation_email: 1 })
    .toArray()) as IEligibleTrainingsForAppointment[]
  await Promise.all(
    etfa.map(async (formation) => {
      if (!formation.etablissement_gestionnaire_siret) return
      if (!formation.lieu_formation_email) {
        const email = await getMostFrequentEmailByGestionnaireSiret(formation.etablissement_gestionnaire_siret, "email")
        if (!email) return
        await getDbCollection("eligible_trainings_for_appointments").findOneAndUpdate({ _id: formation._id }, { $set: { lieu_formation_email: email } })
        return
      }
      if (isValidEmail(formation.lieu_formation_email) && !(await isEmailBlacklisted(formation.lieu_formation_email))) {
        return
      } else {
        const email = await getMostFrequentEmailByGestionnaireSiret(formation.etablissement_gestionnaire_siret, "email")
        if (!email) return
        await getDbCollection("eligible_trainings_for_appointments").findOneAndUpdate({ _id: formation._id }, { $set: { lieu_formation_email: email } })
        return
      }
    })
  )
}

const addReferrersToETFA = async () => {
  // const etfa = await db
  //   .collection("eligible_trainings_for_appointments")
  //   .find({ lieu_formation_email: { $ne: null } })
  // .project({ cle_ministere_educatif: 1, etablissement_gestionnaire_siret: 1, parcoursup_visible: 1 }),
  //   .toArray()

  oleoduc(
    getDbCollection("eligible_trainings_for_appointments")
      .find({ lieu_formation_email: { $ne: null } })
      .project({ cle_ministere_educatif: 1, etablissement_gestionnaire_siret: 1, parcoursup_visible: 1 }),
    writeData(
      async (formation) => {
        const [etablissements, existInReferentielOnisep] = await Promise.all([
          getDbCollection("etablissements")
            .find(
              {
                gestionnaire_siret: formation.etablissement_gestionnaire_siret,
                $and: [{ optout_activation_date: { $exists: true, $ne: null } }, { premium_activation_date: { $exists: true, $ne: null } }],
              },
              { projection: { optout_activation_date: 1, premium_activation_date: 1 } }
            )
            .toArray(),
          getDbCollection("referentieloniseps").findOne({ cle_ministere_educatif: formation.cle_ministere_educatif }),
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
        if (hasPremiumActivation && formation.parcoursup_visible) {
          referrersToActivate.push(referrers.PARCOURSUP.name)
        }
        try {
          await getDbCollection("eligible_trainings_for_appointments").findOneAndUpdate({ _id: formation._id }, { $set: { referrers: referrersToActivate } })
        } catch (err) {
          console.error(err)
        }
      },
      {
        parallel: 20,
      }
    )
  )
}

const createMissingEtablissement = async () => {
  try {
    await getDbCollection("eligible_trainings_for_appointments")
      .aggregate([
        {
          $lookup: {
            from: "etablissements",
            localField: "etablissement_formateur_siret",
            foreignField: "formateur_siret",
            as: "matching_etablissements",
          },
        },
        {
          $match: {
            matching_etablissements: { $eq: [] },
          },
        },
        {
          $project: {
            gestionnaire_email: null,
            gestionnaire_siret: "$etablissement_gestionnaire_siret",
            formateur_siret: "$etablissement_formateur_siret",
            raison_sociale: "$etablissement_formateur_raison_sociale",
            formateur_address: "$etablissement_formateur_street",
            formateur_zip_code: "$lieu_formation_zip_code",
            formateur_city: "$etablissement_formateur_city",
            last_catalogue_sync_date: {
              $literal: new Date(),
            },
            created_at: {
              $literal: new Date(),
            },
          },
        },
        {
          $merge: {
            into: "etablissements",
            whenMatched: "merge",
            whenNotMatched: "insert",
          },
        },
      ])
      .toArray()
  } catch (err) {
    console.error({ err })
  }
}

const updateGestionnaireEmailEtablissement = async () => {
  const etablissements: IEtablissement[] = await getDbCollection("etablissements").find({ gestionnaire_email: null }).toArray()
  await asyncForEach(etablissements, async (etab) => {
    if (!etab.gestionnaire_siret) return
    const email = await getMostFrequentEmailByGestionnaireSiret(etab.gestionnaire_siret, "etablissement_gestionnaire_courriel")
    await getDbCollection("etablissements").updateOne({ _id: etab._id }, { $set: { gestionnaire_email: email, last_catalogue_sync_date: new Date() } })
  })
}

/**
 * @description Gets Catalogue etablissments informations and insert in etablissement collection.
 * @returns {Promise<void>}
 */
export const syncEtablissementsAndFormationsNextVersion = async () => {
  logger.info("Cron #syncEtablissementsAndFormations started.")

  logger.info("prepareETFA")
  await prepareETFA()
  logger.info("updateLieuFormationEmail")
  await updateLieuFormationEmail()
  logger.info("addReferrersToETFA")
  await addReferrersToETFA()
  logger.info("createMissingEtablissement")
  await createMissingEtablissement()
  logger.info("removeDuplicatedEtablissement")
  await removeDuplicateEtablissements()
  logger.info("updateGestionnaireEmailEtablissement")
  await updateGestionnaireEmailEtablissement()

  logger.info("Cron #syncEtablissementsAndFormations done.")
}
