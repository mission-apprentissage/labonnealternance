/* eslint-disable @typescript-eslint/no-unused-vars */
import { removeAccents } from "shared"
import type { IDomainesMetiers } from "shared"
import z from "zod"
import { zObjectId } from "zod-mongodb-schema"
import { ObjectId } from "mongodb"
import { deduplicateBy, deduplicate } from "@/common/utils/array"
import { ensureInitialization, getDbCollection } from "@/common/utils/mongodbUtils"

export const ZDomaineMetierSimple = z.object({
  _id: zObjectId,
  sous_domaine: z.string(),
  domaine: z.string(),
  rncps: z.array(
    z.object({
      code: z.string(),
      intitule: z.string(),
    })
  ),
  mots_clefs: z.array(z.string()),
  mots_clefs_specifiques: z.array(z.string()),
  romes: z.array(
    z.object({
      codeRome: z.string(),
      intituleRome: z.string(),
      intituleAppellation: z.string(),
    })
  ),
  fap: z.array(
    z.object({
      code: z.string(),
      intitule: z.string(),
    })
  ),
  sous_domaine_onisep: z.array(z.string()),
  created_at: z.date(),
  last_update_at: z.date(),
})

export type IDomaineMetierSimple = z.output<typeof ZDomaineMetierSimple>

function computeStringForSearch(str: string): string {
  return removeAccents(str)
}

export function domaineMetierSimpleToDomaineMetier(domainesMetiersSimple: IDomaineMetierSimple): IDomainesMetiers {
  const {
    _id,
    sous_domaine,
    domaine,
    rncps,
    mots_clefs: mots_clefs_array,
    mots_clefs_specifiques: mots_clefs_specifiques_array,
    romes,
    fap,
    sous_domaine_onisep,
    created_at,
    last_update_at,
  } = domainesMetiersSimple
  const codes_romes = deduplicate(romes.map((rome) => rome.codeRome)).filter((x) => x)
  const intitules_romes = deduplicate(romes.map((rome) => rome.intituleRome)).filter((x) => x)

  const intitules_fap = fap.map(({ intitule }) => intitule).filter((x) => x)
  const codes_fap = fap.map(({ code }) => code).filter((x) => x)

  const mots_clefs = mots_clefs_array.join(", ")
  const mots_clefs_specifiques = mots_clefs_specifiques_array.join(", ")

  const codes_rncps = rncps.map((rncp) => rncp.code).filter((x) => x)
  const intitules_rncps = rncps.map((rncp) => rncp.intitule).filter((x) => x)

  const appellations_romes = romes.map((rome) => rome.intituleAppellation).join(", ")
  const couples_romes_metiers = codes_romes.map((code) => {
    const rome = romes.find((rome) => rome.codeRome === code)
    if (!rome) {
      throw new Error(`inattendu: rome code=${code} non trouvé`)
    }
    return {
      codeRome: code,
      intitule: rome.intituleRome,
    }
  })
  const couples_appellations_rome_metier = romes.map((rome) => ({
    intitule: rome.intituleRome,
    codeRome: rome.codeRome,
    appellation: rome.intituleAppellation,
  }))

  const result: IDomainesMetiers = {
    _id,
    sous_domaine,
    sous_domaine_sans_accent_computed: computeStringForSearch(sous_domaine),
    domaine,
    domaine_sans_accent_computed: computeStringForSearch(domaine),
    codes_romes,
    intitules_romes,
    intitules_romes_sans_accent_computed: intitules_romes.map(computeStringForSearch),
    codes_rncps,
    intitules_rncps,
    intitules_rncps_sans_accent_computed: intitules_rncps.map(computeStringForSearch),
    mots_clefs,
    mots_clefs_sans_accent_computed: computeStringForSearch(mots_clefs),
    mots_clefs_specifiques,
    mots_clefs_specifiques_sans_accent_computed: computeStringForSearch(mots_clefs_specifiques),
    appellations_romes,
    appellations_romes_sans_accent_computed: computeStringForSearch(appellations_romes),
    codes_fap,
    intitules_fap,
    intitules_fap_sans_accent_computed: intitules_fap.map(computeStringForSearch),
    sous_domaine_onisep,
    sous_domaine_onisep_sans_accent_computed: sous_domaine_onisep.map(computeStringForSearch),
    couples_appellations_rome_metier,
    couples_romes_metiers,
    created_at,
    last_update_at,
  }
  return result
}

export async function fillRncp(domaineMetierSimple: IDomaineMetierSimple) {
  const codeRomes = deduplicate(domaineMetierSimple.romes.map((rome) => rome.codeRome))
  const rncpResults = await ensureInitialization()
    .db()
    .collection("rome_to_rncp")
    .find({ rome: { $in: codeRomes } })
    .toArray()
  const allRncps = deduplicateBy(
    rncpResults.flatMap((x) => x.rncps),
    (x) => x.code
  )
  domaineMetierSimple.rncps = allRncps
}

export async function upsertDomainesMetiersSimple(domaineMetierSimple: IDomaineMetierSimple) {
  const domaineMetiers = domaineMetierSimpleToDomaineMetier(domaineMetierSimple)
  domaineMetiers.last_update_at = new Date()
  await getDbCollection("domainesmetiers").updateOne(
    { _id: domaineMetiers._id },
    {
      $set: domaineMetiers,
    },
    {
      upsert: true,
    }
  )
}

export function domaineMetierToDomaineMetierSimple(domaineMetier: IDomainesMetiers): { errors: string[]; domaineMetierSimple: IDomaineMetierSimple } {
  const {
    _id,
    sous_domaine,
    domaine,
    codes_romes,
    intitules_romes,
    intitules_romes_sans_accent_computed,
    codes_rncps,
    intitules_rncps,
    intitules_rncps_sans_accent_computed,
    mots_clefs,
    mots_clefs_sans_accent_computed,
    mots_clefs_specifiques,
    mots_clefs_specifiques_sans_accent_computed,
    appellations_romes,
    appellations_romes_sans_accent_computed,
    codes_fap,
    intitules_fap,
    intitules_fap_sans_accent_computed,
    sous_domaine_onisep,
    sous_domaine_onisep_sans_accent_computed,
    couples_appellations_rome_metier,
    couples_romes_metiers,
    created_at,
    last_update_at,
  } = domaineMetier

  const errors: string[] = []
  if (!_id) {
    errors.push("_id vide")
  }
  // if (codes_rncps.length !== intitules_rncps.length) {
  //   errors.push("codes_rncps.length !== intitules_rncps.length")
  // }
  if (codes_romes.length !== intitules_romes.length) {
    errors.push("codes_romes.length !== intitules_romes.length")
  }
  if (codes_romes.length !== intitules_romes_sans_accent_computed.length) {
    errors.push("codes_romes.length !== intitules_romes_sans_accent_computed.length")
  }
  if (codes_romes.length !== couples_romes_metiers.length) {
    errors.push("codes_romes.length !== couples_romes_metiers.length")
  }
  // if (codes_fap.length !== intitules_fap.length) {
  //   errors.push("codes_fap.length !== intitules_fap.length")
  // }

  const rncps = codes_rncps.map((code, index) => ({ code, intitule: intitules_rncps[index] ?? "" }))
  const romes = deduplicateBy(
    couples_appellations_rome_metier.map(({ appellation, codeRome, intitule }) => ({ codeRome, intituleRome: intitule, intituleAppellation: appellation })),
    (x) => `${x.codeRome}|${x.intituleAppellation}`
  )
  const fap = intitules_fap.map((intitule, index) => ({ code: codes_fap[index] ?? "", intitule }))

  const domaineMetierSimple: IDomaineMetierSimple = {
    _id: _id ?? new ObjectId(),
    sous_domaine,
    domaine,
    rncps,
    mots_clefs: mots_clefs.split(", "),
    mots_clefs_specifiques: mots_clefs_specifiques.split(", "),
    romes,
    fap,
    sous_domaine_onisep,
    created_at,
    last_update_at,
  }
  return { errors, domaineMetierSimple }
}
