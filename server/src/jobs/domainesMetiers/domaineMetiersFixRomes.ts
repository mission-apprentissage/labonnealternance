// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { diff } from "util"
import type { IDomainesMetiers } from "shared"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { domaineMetierToDomaineMetierSimple, domaineMetierSimpleToDomaineMetier } from "@/services/domainesmetiers.service"
import { asyncForEach } from "@/common/utils/asyncUtils"

export async function ajoutRomesADomaineMetiers(romeAjoutsParSousDomaine: Record<string, string[]>, dryRun = true) {
  await asyncForEach(Object.entries(romeAjoutsParSousDomaine), async ([sousDomaine, newRomes]) => {
    const domaineMetier = await getDbCollection("domainesmetiers").findOne({ sous_domaine: sousDomaine })
    if (!domaineMetier) {
      throw new Error(`sous domaine=${sousDomaine} non trouvé`)
    }
    const fixedDomaineMetier = await applyFix(domaineMetier, newRomes)
    await analyzeSousDomaine(domaineMetier, fixedDomaineMetier)
    if (!dryRun) {
      await updateDomaineMetierRomes(fixedDomaineMetier)
    }
  })
}

async function applyFix(domaineMetier: IDomainesMetiers, codeRomes: string[]) {
  const { domaineMetierSimple, errors } = domaineMetierToDomaineMetierSimple(domaineMetier)
  if (errors.length) {
    console.warn(errors)
  }
  const refRomes = await asyncForEach(codeRomes, async (codeRome) => {
    const refRome = await getDbCollection("referentielromes").findOne({ "rome.code_rome": codeRome })
    if (!refRome) {
      throw new Error(`rome code=${codeRome} non trouvé`)
    }
    return refRome
  })

  domaineMetierSimple.romes = domaineMetierSimple.romes.filter((x) => !codeRomes.includes(x.codeRome))

  domaineMetierSimple.romes.push(
    ...refRomes.flatMap((refRome) =>
      refRome.appellations.flatMap((appellation) => ({
        codeRome: refRome.rome.code_rome,
        intituleRome: refRome.rome.intitule,
        intituleAppellation: appellation.libelle,
      }))
    )
  )
  const domaineMetierReconstruit = domaineMetierSimpleToDomaineMetier(domaineMetierSimple)
  return domaineMetierReconstruit
}

async function analyzeSousDomaine(domaineMetier: IDomainesMetiers, fixedDomaineMetier: IDomainesMetiers) {
  console.info("analyzing", domaineMetier.sous_domaine)

  const dataGetters: [string, (domaineMetier: IDomainesMetiers) => string[]][] = [
    ["codes_romes", (x) => x.codes_romes],
    ["intitules_romes", (x) => x.intitules_romes],
  ]

  dataGetters.forEach((getter) => {
    const [name, fct] = getter
    const result = diff(fct(fixedDomaineMetier), fct(domaineMetier))
    const filteredResult = result.filter(([diffResult]) => diffResult !== 0)
    console.info("diff", name, filteredResult)
  })
}

export async function updateDomaineMetierRomes(domaineMetier: IDomainesMetiers) {
  const {
    codes_romes,
    intitules_romes,
    intitules_romes_sans_accent_computed,
    couples_romes_metiers,
    couples_appellations_rome_metier,
    appellations_romes,
    appellations_romes_sans_accent_computed,
  } = domaineMetier
  await getDbCollection("domainesmetiers").updateOne(
    {
      _id: domaineMetier._id,
    },
    {
      $set: {
        codes_romes,
        intitules_romes,
        intitules_romes_sans_accent_computed,
        couples_romes_metiers,
        couples_appellations_rome_metier,
        appellations_romes,
        appellations_romes_sans_accent_computed,
      },
    }
  )
}

export async function deleteRomeFromDomaineMetier(codeRome: string, sousDomaine: string) {
  console.info("suppression du rome code=", codeRome, "du sous domaine=", sousDomaine)
  const domaineMetier = await getDbCollection("domainesmetiers").findOne({ sous_domaine: sousDomaine })
  if (!domaineMetier) {
    throw new Error(`sous domaine=${sousDomaine} non trouvé`)
  }
  const { domaineMetierSimple, errors } = domaineMetierToDomaineMetierSimple(domaineMetier)
  if (errors.length) {
    console.warn(errors)
  }
  domaineMetierSimple.romes = domaineMetierSimple.romes.filter((rome) => rome.codeRome !== codeRome)
  const domaineMetierReconstruit = domaineMetierSimpleToDomaineMetier(domaineMetierSimple)
  await updateDomaineMetierRomes(domaineMetierReconstruit)
}
