import { ObjectId } from "bson"

import { EDiffusibleStatus } from "../constants/diffusibleStatus"
import { ICacheInfosSiret } from "../models/cacheInfosSiret.model"

export function generateCacheInfoSiretFixture(data: Partial<ICacheInfosSiret> = {}, etat_administratif: "A" | "F" = "A"): ICacheInfosSiret {
  return {
    _id: new ObjectId(),
    siret: "78430824900019",
    createdAt: new Date("2021-01-28T15:00:00.000Z"),
    updatedAt: new Date("2021-01-28T15:00:00.000Z"),
    data: {
      data: {
        activite_principale: {
          code: "43.22A",
          libelle: "plombier",
        },
        adresse: {
          status_diffusion: EDiffusibleStatus.DIFFUSIBLE,
          code_postal: "75001",
          libelle_commune: "Paris",
          libelle_voie: "du loup",
          numero_voie: "2",
          type_voie: "rue",
          acheminement_postal: {
            l4: "2 rue du loup",
            l6: "75001",
            l7: "Paris",
          },
        },
        etat_administratif,
        siret: "78430824900019",
        status_diffusion: EDiffusibleStatus.DIFFUSIBLE,
        unite_legale: {
          personne_morale_attributs: {
            raison_sociale: "Plop company Inc",
          },
          personne_physique_attributs: {
            nom_naissance: "Dupond",
            nom_usage: "Lars",
            prenom_usuel: "Roger",
          },
          tranche_effectif_salarie: {
            code: "02",
          },
          date_creation: 1729157946,
        },
        enseigne: "Plop brand",
      },
    },
    ...data,
  }
}

export const generateCacheInfoSiretForSiret = (siret: string, etat_administratif: "A" | "F" = "A") =>
  generateCacheInfoSiretFixture(
    {
      siret,
      data: {
        data: {
          ...generateCacheInfoSiretFixture({}, etat_administratif)!.data!.data,
          siret,
        },
      },
    },
    etat_administratif
  )
