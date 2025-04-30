import fs from "node:fs/promises"

import { IDomainesMetiers, removeAccents } from "shared"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const updateRomesForDomainesMetiers = async () => {
  console.info("Début de updateRomesForDomainesMetiers")

  const filepath = "./20250424-classifyRomesForDomainesMetiers.inverted.valid.json"
  console.info("Lecture de", filepath)
  const fileContent = await fs.readFile(filepath)
  const fileJson = JSON.parse(fileContent.toString()) as Record<string, { intitule: string; code: string }[]>
  const fileDomains = Object.keys(fileJson)
  console.info(fileDomains.length, "domaines métiers dans le fichier")

  const dbDomains = (
    await getDbCollection("domainesmetiers")
      .find({}, { projection: { sous_domaine: 1 } })
      .toArray()
  ).map((domaine) => domaine.sous_domaine)
  const newDomains = fileDomains.filter((domain) => !dbDomains.includes(domain))
  console.warn("nouveaux domaines non ajoutés", newDomains)
  const notUpdatedDomains = dbDomains.filter((domain) => !fileDomains.includes(domain))
  console.warn("domaines non mis à jour", notUpdatedDomains)

  console.info("Récupération des referentielromes")
  const romeReferentiels = await getDbCollection("referentielromes")
    .find(
      {},
      {
        projection: {
          rome: 1,
          "appellations.libelle": 1,
        },
      }
    )
    .toArray()

  console.info("Début des mises à jour")
  const now = new Date()
  await asyncForEach(Object.entries(fileJson), async ([domaineMetier, mappedRomes]) => {
    console.info("mise à jour de", domaineMetier)
    const mappedReferentielsRomes = mappedRomes.map(({ code }) => {
      const romeReferentiel = romeReferentiels.find((ref) => ref.rome.code_rome === code)
      if (!romeReferentiel) {
        throw new Error(`unexpected: could not find referentiel rome with code=${code}`)
      }
      return romeReferentiel
    })

    const appellations = mappedReferentielsRomes.flatMap((referentiel) => referentiel.appellations)
    const appellationLabels = appellations.map((appellation) => appellation.libelle)
    const couples_appellations_rome_metier = mappedReferentielsRomes.flatMap((ref) => {
      const codeRome = ref.rome.code_rome
      const intitule = ref.rome.intitule
      return ref.appellations.map(({ libelle }) => ({
        codeRome,
        intitule,
        appellation: libelle,
      }))
    })
    const intitulesROMEs = mappedReferentielsRomes.map((ref) => ref.rome.intitule)

    const updateDomaineMetier: Partial<IDomainesMetiers> = {
      appellations_romes: [...new Set(appellationLabels)].join(", "),
      appellations_romes_sans_accent_computed: [...new Set(appellationLabels.map(removeAccents))].join(", "),
      couples_appellations_rome_metier,
      codes_romes: mappedReferentielsRomes.map((ref) => ref.rome.code_rome),
      intitules_romes: intitulesROMEs,
      intitules_romes_sans_accent_computed: intitulesROMEs.map(removeAccents),
      couples_romes_metiers: mappedReferentielsRomes.map((ref) => ({
        codeRome: ref.rome.code_rome,
        intitule: ref.rome.intitule,
      })),
      last_update_at: now,
    }
    const updateResult = await getDbCollection("domainesmetiers").updateOne({ sous_domaine: domaineMetier }, { $set: updateDomaineMetier })
    if (updateResult.matchedCount !== 1) {
      console.warn("plusieurs sous domaines trouvés pour:", domaineMetier)
    }
  })
  console.info("Fin de updateRomesForDomainesMetiers")
}
