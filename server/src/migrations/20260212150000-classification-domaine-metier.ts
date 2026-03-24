import { ajoutRomesADomaineMetiers } from "@/jobs/domainesMetiers/domaineMetiersFixRomes"

export const up = async () => {
  await ajoutRomesADomaineMetiers(
    {
      "Entretien et maintenance de bâtiments": ["M1218"],
      "Conseil, vente de produits bancaires ou d'assurance, gestion de clientèle": ["C1204"],
    },
    false
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
