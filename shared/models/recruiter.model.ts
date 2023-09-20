import { Jsonify } from "type-fest"
import { z } from "zod"

import { RECRUITER_STATUS } from "../constants/RecruiterStatus"

import { zObjectId } from "./common"
import { ZJob } from "./job.model"

const recruiterStatus: readonly string[] = Object.values(RECRUITER_STATUS)

export const ZRecruiter = z
  .object({
    _id: zObjectId,
    establishment_id: z.string().nullable().describe("Identifiant de formulaire unique"),
    establishment_raison_sociale: z.string().nullable().describe("Raison social de l'entreprise"),
    establishment_enseigne: z.string().nullable().describe("Enseigne de l'entreprise"),
    establishment_siret: z.string().describe("Numéro SIRET de l'entreprise"),
    address_detail: z.object(), // TODO "Détail de l'adresse de l'entreprise"
    address: z.string().nullable().describe("Adresse de l'entreprise"),
    geo_coordinates: z.string().nullable().describe("Latitude/Longitude (inversion lié à LBA) de l'adresse de l'entreprise"),
    is_delegated: z.boolean().describe("le formulaire est-il géré par un mandataire ?"),
    cfa_delegated_siret: z.string().describe("Siret de l'organisme de formation gestionnaire des offres de l'entreprise"),
    last_name: z.string().nullable().describe("Nom du contact"),
    first_name: z.string().nullable().describe("Prénom du contact"),
    phone: z.string().nullable().describe("Téléphone du contact"),
    email: z.string().email().nullable().describe("Email du contact"),
    origin: z.string().nullable().describe("Origine/organisme lié au formulaire"),
    opco: z.string().nullable().describe("Information sur l'opco de l'entreprise"),
    idcc: z.string().nullable().describe("Identifiant convention collective de l'entreprise"),
    status: z.enum([recruiterStatus[0], ...recruiterStatus.slice(1)]).describe("Statut du formulaire"),
    naf_code: z.string().nullable().describe("code NAF de l'entreprise"),
    naf_label: z.string().nullable().describe("Libelle du code NAF de l'entreprise"),
    establishment_size: z.string().nullable().describe("Tranche d'effectif salariale de l'entreprise"),
    establishment_creation_date: z.date().nullable().describe("Date de creation de l'entreprise"),
    jobs: z.array(ZJob).describe("Liste des offres d'apprentissage"),
  })
  .strict()

export type IEtablissement = z.output<typeof ZRecruiter>
export type IEtablissementJson = Jsonify<z.input<typeof ZRecruiter>>
