import { ObjectId } from "mongodb"

import type { IRecruteursLbaRaw } from "../models/rawRecruteursLba.model.js"

export function generateRecruiterRawFixture(data: Partial<IRecruteursLbaRaw> = {}): IRecruteursLbaRaw {
  return {
    ...data,
    _id: new ObjectId(),
    createdAt: new Date(),
    siret: "13002526500013",
    enseigne: "ETABLISSEMENTS DINUM",
    activitePrincipaleEtablissement: "4673A",
    labelActivitePrincipaleEtablissement: "Commerce de gros (commerce interentreprises) de bois et de matériaux de construction ",
    raison_sociale: "ETABLISSEMENTS DINUM",
    street_number: "823",
    street_name: "CHEMIN DU BALAYOU",
    insee_city_code: "07293",
    zip_code: "07130",
    email: "roget@dinum.fr",
    phone: "0123456789",
    company_size: "6-9",
    coordonneeLambertAbscisseEtablissement: 563785.301401543,
    coordonneeLambertOrdonneeEtablissement: 6980103.0348188747,
    libelleCommuneEtablissement: "SAINT-ROMAIN-DE-LERPS",
    rome_codes: [
      {
        rome_code: "M1607",
        normalized_score: 0.0106687117,
      },
      {
        rome_code: "M1203",
        normalized_score: 0.0106687117,
      },
    ],
  }
}
