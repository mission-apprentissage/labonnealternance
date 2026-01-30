import { ajoutRomesADomaineMetiers } from "@/jobs/domainesMetiers/domaineMetiersFixRomes"

export const up = async () => {
  const sousDomaineAjoutRomes: Record<string, string[]> = {
    "Transport, conduite, livraison": [],
    "Nettoyage, propreté": [],
    "Mécanique, carrosserie auto, moto": ["I1604"],
    Edition: ["E1105"],
    "Management, support en banque, assurance": ["C1106"],
  }
  await ajoutRomesADomaineMetiers(sousDomaineAjoutRomes, false)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
