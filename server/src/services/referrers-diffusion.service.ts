import type { AnyBulkWriteOperation, Filter } from "mongodb"
import type { IEligibleTrainingsForAppointment, IEtablissement } from "shared"
import { referrers } from "shared/constants/referers"
import type { IReferrerName } from "shared/models/elligible-training.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const ALL_REFERRERS = Object.keys(referrers) as IReferrerName[]

export type IDiffusionDates = Pick<
  IEtablissement,
  "optout_activation_date" | "optout_refusal_date" | "premium_activation_date" | "premium_refusal_date" | "premium_affelnet_activation_date" | "premium_affelnet_refusal_date"
>

export const DIFFUSION_DATES_PROJECTION = {
  optout_activation_date: 1,
  optout_refusal_date: 1,
  premium_activation_date: 1,
  premium_refusal_date: 1,
  premium_affelnet_activation_date: 1,
  premium_affelnet_refusal_date: 1,
} as const

type IDiffusionFlags = { optOut: boolean; premiumParcoursup: boolean; premiumAffelnet: boolean }

export type IDiffusionEligibility = {
  parcoursup_visible?: boolean | null
  affelnet_visible?: boolean | null
  inReferentielOnisep: boolean
}

const isSet = (value: unknown) => value !== null && value !== undefined

// Plusieurs établissements peuvent partager un SIRET gestionnaire : une date posée sur l'un vaut pour tous.
export const getDiffusionFlags = (etablissements: IDiffusionDates[]): IDiffusionFlags => {
  const has = (field: keyof IDiffusionDates) => etablissements.some((etablissement) => isSet(etablissement[field]))
  return {
    optOut: has("optout_activation_date") && !has("optout_refusal_date"),
    premiumParcoursup: has("premium_activation_date") && !has("premium_refusal_date"),
    premiumAffelnet: has("premium_affelnet_activation_date") && !has("premium_affelnet_refusal_date"),
  }
}

export const isReferrerEligible = (referrer: IReferrerName, eligibility: IDiffusionEligibility): boolean => {
  if (referrer === "PARCOURSUP") return Boolean(eligibility.parcoursup_visible)
  if (referrer === "AFFELNET") return Boolean(eligibility.affelnet_visible)
  if (referrer === "ONISEP") return eligibility.inReferentielOnisep
  return true
}

export const getEligibleReferrers = (eligibility: IDiffusionEligibility): IReferrerName[] => ALL_REFERRERS.filter((referrer) => isReferrerEligible(referrer, eligibility))

export const computeAutoReferrers = (flags: IDiffusionFlags, eligibility: IDiffusionEligibility): IReferrerName[] => {
  const auto: IReferrerName[] = []
  if (flags.optOut) {
    auto.push("LBA", "JEUNE_1_SOLUTION")
    if (eligibility.inReferentielOnisep) auto.push("ONISEP")
  }
  if (flags.premiumParcoursup && eligibility.parcoursup_visible) auto.push("PARCOURSUP")
  if (flags.premiumAffelnet && eligibility.affelnet_visible) auto.push("AFFELNET")
  return auto
}

// Un forçage « activée » sur une plateforme devenue non éligible reste stocké mais n'a pas d'effet.
export const applyReferrerOverrides = ({
  auto,
  eligible,
  forcedOn,
  forcedOff,
}: {
  auto: IReferrerName[]
  eligible: IReferrerName[]
  forcedOn: IReferrerName[]
  forcedOff: IReferrerName[]
}): IReferrerName[] => {
  const result = auto.filter((referrer) => !forcedOff.includes(referrer))
  for (const referrer of forcedOn) {
    if (eligible.includes(referrer) && !forcedOff.includes(referrer) && !result.includes(referrer)) result.push(referrer)
  }
  return result
}

type IDiffusionSubject = Pick<IEligibleTrainingsForAppointment, "_id" | "cle_ministere_educatif" | "etablissement_gestionnaire_siret" | "parcoursup_visible" | "affelnet_visible">

export const DIFFUSION_SUBJECT_PROJECTION = {
  _id: 1,
  cle_ministere_educatif: 1,
  etablissement_gestionnaire_siret: 1,
  parcoursup_visible: 1,
  affelnet_visible: 1,
  referrers: 1,
  referrers_forced_on: 1,
  referrers_forced_off: 1,
} as const

/**
 * Charge en deux requêtes les établissements et le référentiel ONISEP nécessaires au calcul de la
 * diffusion automatique d'un lot de formations, avec la même règle que la synchronisation de nuit.
 */
export const loadDiffusionContexts = async (subjects: IDiffusionSubject[]) => {
  const gestionnaireSirets = [...new Set(subjects.flatMap((subject) => (subject.etablissement_gestionnaire_siret ? [subject.etablissement_gestionnaire_siret] : [])))]
  const cles = [...new Set(subjects.map((subject) => subject.cle_ministere_educatif))]

  const [etablissements, onisep] = await Promise.all([
    getDbCollection("etablissements")
      .find({ gestionnaire_siret: { $in: gestionnaireSirets } }, { projection: { ...DIFFUSION_DATES_PROJECTION, gestionnaire_siret: 1 } })
      .toArray(),
    getDbCollection("referentieloniseps")
      .find({ cle_ministere_educatif: { $in: cles } }, { projection: { cle_ministere_educatif: 1 } })
      .toArray(),
  ])

  const etablissementsBySiret = new Map<string, IDiffusionDates[]>()
  for (const etablissement of etablissements) {
    if (!etablissement.gestionnaire_siret) continue
    etablissementsBySiret.set(etablissement.gestionnaire_siret, [...(etablissementsBySiret.get(etablissement.gestionnaire_siret) ?? []), etablissement])
  }
  const onisepCles = new Set(onisep.map((item) => item.cle_ministere_educatif))

  return (subject: IDiffusionSubject) => {
    const eligibility: IDiffusionEligibility = {
      parcoursup_visible: subject.parcoursup_visible,
      affelnet_visible: subject.affelnet_visible,
      inReferentielOnisep: onisepCles.has(subject.cle_ministere_educatif),
    }
    const flags = getDiffusionFlags(subject.etablissement_gestionnaire_siret ? (etablissementsBySiret.get(subject.etablissement_gestionnaire_siret) ?? []) : [])
    return {
      auto: computeAutoReferrers(flags, eligibility),
      eligible: getEligibleReferrers(eligibility),
    }
  }
}

const sameReferrers = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((referrer) => b.includes(referrer))

/**
 * Réécrit `referrers` à partir des dates de l'établissement et des forçages, après un changement
 * d'opt-out ou de premium. Renvoie le nombre de formations modifiées.
 */
export const recomputeReferrers = async (filter: Filter<IEligibleTrainingsForAppointment>): Promise<number> => {
  const subjects = await getDbCollection("eligible_trainings_for_appointments").find(filter, { projection: DIFFUSION_SUBJECT_PROJECTION }).toArray()
  if (!subjects.length) return 0

  const contextOf = await loadDiffusionContexts(subjects)
  const operations: AnyBulkWriteOperation<IEligibleTrainingsForAppointment>[] = subjects.flatMap((subject) => {
    const { auto, eligible } = contextOf(subject)
    const next = applyReferrerOverrides({ auto, eligible, forcedOn: subject.referrers_forced_on ?? [], forcedOff: subject.referrers_forced_off ?? [] })
    return sameReferrers(next, subject.referrers ?? []) ? [] : [{ updateOne: { filter: { _id: subject._id }, update: { $set: { referrers: next } } } }]
  })
  if (operations.length) await getDbCollection("eligible_trainings_for_appointments").bulkWrite(operations, { ordered: false })
  return operations.length
}

/**
 * Le refus de l'établissement prime sur l'admin : ses forçages « activée » sur les plateformes
 * refusées sont effacés, puis la diffusion est recalculée.
 */
export const clearForcedActivationsAndRecompute = async (filter: Filter<IEligibleTrainingsForAppointment>, refused: IReferrerName[]) => {
  // Le filtre sur le tableau écarte les forçages absents ou à null, sur lesquels $setDifference renverrait null.
  await getDbCollection("eligible_trainings_for_appointments").updateMany({ ...filter, referrers_forced_on: { $in: refused } }, [
    { $set: { referrers_forced_on: { $setDifference: ["$referrers_forced_on", refused] } } },
  ])
  return recomputeReferrers(filter)
}
