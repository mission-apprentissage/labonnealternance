import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { ObjectId } from "mongodb"
import { referrers } from "shared/constants/referers"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { getEmailForRdv } from "../../services/eligibleTrainingsForAppointment.service"
import { findFirstNonBlacklistedEmail } from "../../services/formation.service"

const anyHasFieldWithValue = (etabs: any[], field: string) => etabs.some((e) => e[field] != null)

const processFormation = async (formation: any, bulkTrainings: any[], bulkEtablissements: any[]) => {
  const eligible = formation.eligible
  const etablissements = formation.etablissements
  const existInReferentielOnisep = formation.onisep

  const hasPremiumAffelnetActivation = anyHasFieldWithValue(etablissements, "premium_affelnet_activation_date")
  const hasOptOutRefusal = anyHasFieldWithValue(etablissements, "optout_refusal_date")
  const hasOptOutActivation = anyHasFieldWithValue(etablissements, "optout_activation_date")
  const hasPremiumRefusal = anyHasFieldWithValue(etablissements, "premium_refusal_date")
  const hasPremiumActivation = anyHasFieldWithValue(etablissements, "premium_activation_date")
  const hasPremiumAffelnetRefusal = anyHasFieldWithValue(etablissements, "premium_affelnet_refusal_date")

  const emailArray = etablissements.map((e) => ({ email: e.gestionnaire_email }))
  let gestionnaireEmail = await findFirstNonBlacklistedEmail(emailArray)

  const referrersToActivate: string[] = []
  if (hasOptOutActivation && !hasOptOutRefusal) {
    referrersToActivate.push(referrers.LBA.name, referrers.JEUNE_1_SOLUTION.name)
    if (existInReferentielOnisep) referrersToActivate.push(referrers.ONISEP.name)
  }
  if (hasPremiumActivation && !hasPremiumRefusal && formation.parcoursup_visible) {
    referrersToActivate.push(referrers.PARCOURSUP.name)
  }
  if (hasPremiumAffelnetActivation && !hasPremiumAffelnetRefusal && formation.affelnet_visible) {
    referrersToActivate.push(referrers.AFFELNET.name)
  }

  const now = new Date()

  if (eligible) {
    let emailRdv = eligible.lieu_formation_email
    if (!eligible?.is_lieu_formation_email_customized) {
      emailRdv = await getEmailForRdv({
        email: formation.email,
        etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel,
        etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
      })
    }

    bulkTrainings.push({
      updateOne: {
        filter: { _id: eligible._id },
        update: {
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
            last_catalogue_sync_date: now,
            lieu_formation_street: formation.lieu_formation_adresse,
            lieu_formation_city: formation.localite,
            lieu_formation_zip_code: formation.code_postal,
            etablissement_formateur_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
            etablissement_formateur_street: formation.etablissement_formateur_adresse,
            departement_etablissement_formateur: formation.etablissement_formateur_nom_departement,
            etablissement_formateur_city: formation.etablissement_formateur_localite,
          },
        },
      },
    })
  } else {
    const emailRdv = await getEmailForRdv({
      email: formation.email,
      etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel,
      etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
    })

    bulkTrainings.push({
      insertOne: {
        document: {
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
        },
      },
    })
  }

  if (!gestionnaireEmail) {
    gestionnaireEmail = await getEmailForRdv(
      {
        etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel,
        etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
      },
      "etablissement_gestionnaire_courriel"
    )
  }

  bulkEtablissements.push({
    updateMany: {
      filter: {
        formateur_siret: formation.etablissement_formateur_siret,
        gestionnaire_siret: formation.etablissement_gestionnaire_siret,
      },
      update: {
        $set: {
          gestionnaire_siret: formation.etablissement_gestionnaire_siret,
          gestionnaire_email: gestionnaireEmail,
          raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
          formateur_siret: formation.etablissement_formateur_siret,
          formateur_address: formation.etablissement_formateur_adresse,
          formateur_zip_code: formation.etablissement_formateur_code_postal,
          formateur_city: formation.etablissement_formateur_localite,
          last_catalogue_sync_date: now,
        },
      },
      upsert: true,
    },
  })
}

export const syncEtablissementsAndFormations = async () => {
  logger.info("Cron #syncEtablissementsAndFormations started.")

  const bulkTrainings: any[] = []
  const bulkEtablissements: any[] = []

  const formationsStream = getDbCollection("formationcatalogues")
    .aggregate([
      {
        $lookup: {
          from: "eligible_trainings_for_appointments",
          localField: "cle_ministere_educatif",
          foreignField: "cle_ministere_educatif",
          as: "eligible",
        },
      },
      { $unwind: { path: "$eligible", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "etablissements",
          localField: "etablissement_gestionnaire_siret",
          foreignField: "gestionnaire_siret",
          as: "etablissements",
        },
      },
      {
        $lookup: {
          from: "referentieloniseps",
          localField: "cle_ministere_educatif",
          foreignField: "cle_ministere_educatif",
          as: "onisep",
        },
      },
      { $unwind: { path: "$onisep", preserveNullAndEmptyArrays: true } },
    ])
    .stream()

  const writable = new Writable({
    objectMode: true,
    async write(formation, _, callback) {
      try {
        await processFormation(formation, bulkTrainings, bulkEtablissements)
        callback()
      } catch (err: any) {
        logger.error(err, "Erreur dans processFormation")
        callback(err)
      }
    },
  })

  await pipeline(formationsStream, writable)

  if (bulkTrainings.length) {
    await getDbCollection("eligible_trainings_for_appointments").bulkWrite(bulkTrainings)
  }
  if (bulkEtablissements.length) {
    await getDbCollection("etablissements").bulkWrite(bulkEtablissements)
  }

  logger.info("Cron #syncEtablissementsAndFormations done.")
}
