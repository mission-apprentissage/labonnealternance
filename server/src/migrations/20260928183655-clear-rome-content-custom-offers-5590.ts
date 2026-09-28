import type { AnyBulkWriteOperation } from "mongodb"
import { OFFER_DESCRIPTION_MODE } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { isRecruiterWrittenDescription } from "shared/utils/job-description.utils"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Issue #5590 : une offre LBA à description rédigée ne reprend plus le contenu de la fiche ROME. Pose
 * offer_description_mode sur les offres existantes, en comparant la description à la définition ROME
 * (cf. isRecruiterWrittenDescription), et vide les 4 champs ROME des offres rédigées, code ROME conservé.
 *
 * Seules les offres créées depuis le MVP (#5078) sont classées : lui seul masquait les compétences au
 * recruteur. Avant, une description différente de la définition ROME actuelle est surtout une définition
 * périmée par un réimport du référentiel : mesuré en production, 96 % des 13 458 offres ainsi classées
 * partageaient leur texte avec au moins 5 offres du même ROME. Les offres antérieures restent sans mode.
 *
 * Une offre dont le code ROME n'a pas de définition dans le référentiel reste sans mode : faute de
 * référence, une fiche métier recopiée passerait pour rédigée et perdrait ses compétences.
 *
 * `bypassDocumentValidation` : hors production le validateur est en `error`, et des offres anciennes
 * ne respectent pas le schéma actuel. `updated_at` n'est pas touché : le recruteur d'une offre rédigée
 * ne voyait pas ces champs.
 */
const EMPTY_ROME_CONTENT = {
  offer_desired_skills: [],
  offer_to_be_acquired_skills: [],
  offer_to_be_acquired_knowledge: [],
  offer_access_conditions: [],
}

const BATCH_SIZE = 500

// merge de #5078 dans main, premier déploiement possible du MVP (recette comprise)
const MVP_RELEASE_DATE = new Date("2026-09-25T13:44:44Z")

export const up = async () => {
  const referentiel = await getDbCollection("referentielromes")
    .find({}, { projection: { "rome.code_rome": 1, definition: 1 } })
    .toArray()
  const definitions = new Map(referentiel.map(({ rome, definition }) => [rome.code_rome, definition]))

  // null matche aussi le champ absent : seules les offres pas encore classées sont relues au rejeu.
  const cursor = getDbCollection("jobs_partners").find(
    { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_description_mode: null, created_at: { $gte: MVP_RELEASE_DATE } },
    { projection: { _id: 1, offer_description: 1, offer_rome_codes: 1 } }
  )

  const counts = { custom: 0, structured: 0, undetermined: 0 }
  let batch: AnyBulkWriteOperation<IJobsPartnersOfferPrivate>[] = []

  const flush = async () => {
    if (batch.length === 0) return
    await getDbCollection("jobs_partners").bulkWrite(batch, { ordered: false, bypassDocumentValidation: true })
    batch = []
  }

  for await (const { _id, offer_description, offer_rome_codes } of cursor) {
    const romeCode = offer_rome_codes?.at(0)
    const definition = romeCode ? definitions.get(romeCode) : undefined
    if (!definition) {
      counts.undetermined++
      continue
    }

    const isCustom = isRecruiterWrittenDescription(offer_description, definition)
    counts[isCustom ? "custom" : "structured"]++
    batch.push({
      updateOne: {
        filter: { _id, offer_description_mode: null },
        update: {
          $set: isCustom ? { offer_description_mode: OFFER_DESCRIPTION_MODE.CUSTOM, ...EMPTY_ROME_CONTENT } : { offer_description_mode: OFFER_DESCRIPTION_MODE.STRUCTURED },
        },
      },
    })
    if (batch.length >= BATCH_SIZE) {
      await flush()
    }
  }
  await flush()

  // au rejeu : une offre rédigée re-remplie par l'ancien code, encore servi pendant le déploiement
  const { modifiedCount: refilled } = await getDbCollection("jobs_partners").updateMany(
    {
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_description_mode: OFFER_DESCRIPTION_MODE.CUSTOM,
      $or: [
        { offer_desired_skills: { $ne: [] } },
        { offer_to_be_acquired_skills: { $ne: [] } },
        { offer_to_be_acquired_knowledge: { $nin: [[], null] } },
        { offer_access_conditions: { $ne: [] } },
      ],
    },
    { $set: EMPTY_ROME_CONTENT },
    { bypassDocumentValidation: true }
  )

  const beforeMvp = await getDbCollection("jobs_partners").countDocuments({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_description_mode: null,
    created_at: { $lt: MVP_RELEASE_DATE },
  })

  logger.info(
    `clear rome content 5590 : ${counts.custom} offres rédigées vidées, ${counts.structured} sur fiche métier, ${counts.undetermined} sans définition ROME laissées sans mode, ${refilled} re-vidées, ${beforeMvp} antérieures au MVP non classées`
  )
}

export const requireShutdown: boolean = false
