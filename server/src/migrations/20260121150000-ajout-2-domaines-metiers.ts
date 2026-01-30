import { ObjectId } from "bson"
import { asyncForEach } from "@/common/utils/asyncUtils"
import type { IDomaineMetierSimple } from "@/services/domainesmetiers.service"
import { upsertDomainesMetiersSimple } from "@/services/domainesmetiers.service"

export const up = async () => {
  const now = new Date()
  const domaineMetierSimples: IDomaineMetierSimple[] = [
    {
      _id: new ObjectId(),
      created_at: now,
      last_update_at: now,
      domaine: "Art",
      sous_domaine: "Arts plastiques, galeries, marché de l'art",
      fap: ["Artistes plasticiens", "Assistants de communication", "Cadres de la communication"].map((intitule) => ({ intitule, code: "" })),
      mots_clefs: ["art", "graphisme", "peinture", "beaux-arts", "communication", "journalisme"],
      mots_clefs_specifiques: ["exposition", "commissariat d’exposition", "médiation culturelle", "critique d’art", "collection"],
      sous_domaine_onisep: ["commerce de l'art", "arts plastiques", "restauration d'art", "communication"],
      rncps: [],
      romes: [],
    },
    {
      _id: new ObjectId(),
      created_at: now,
      last_update_at: now,
      domaine: "Industrie",
      sous_domaine: "Industrie des matériaux de construction",
      fap: [
        "Ouvriers non qualifiés en métallurgie",
        "verre",
        "céramique et matériaux de construction",
        "Autres ouvriers qualifiés en verre",
        "céramique",
        "métallurgie",
        "matériaux de construction et énergie",
        "Ouvriers non qualifiés des travaux publics",
        "du béton et de l’extraction",
        "Ouvriers qualifiés des travaux publics",
        "du béton et de l’extraction",
        "Ouvriers non qualifiés travaillant par enlèvement ou formage de métal",
        "Ouvriers qualifiés travaillant par enlèvement de métal",
        "Dessinateurs en mécanique et travail des métaux",
      ].map((intitule) => ({ intitule, code: "" })),
      mots_clefs: ["industrie", "conception", "construction", "matériau", "production", "fabrication", "process industriel", "chaîne de production"],
      mots_clefs_specifiques: [
        "béton",
        "ciment",
        "granulats",
        "préfabrication",
        "carrières",
        "formulation",
        "matériaux composites",
        "normes de construction",
        "performance thermique",
        "matériaux bas carbone",
      ],
      sous_domaine_onisep: ["matériaux", "construction"],
      rncps: [],
      romes: [],
    },
  ]

  await asyncForEach(domaineMetierSimples, async (domaineMetier) => {
    await upsertDomainesMetiersSimple(domaineMetier)
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
