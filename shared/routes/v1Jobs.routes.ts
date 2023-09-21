import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { zObjectId } from "../models/common"
import { ZRecruiter } from "../models/recruiter.model"
import { ZUserRecruteur } from "../models/usersRecruteur.model"

const ZLBAItemPlace = z.object({
  distance: z.number().nullable(), // distance au centre de recherche en km. pe --> lieutTravail.distance recalculé par turf.js | formation --> sort[0] | lbb/lba -> distance | matcha -> sort[0]
  fullAddress: z.string().nullable(), // adresse postale reconstruite à partir des éléments d'adresse fournis | matcha -> adresse | formation -> lieu_formation_adresse + code_postal + localite OU etablissement_formateur_adresse + ...complement_adresse + ...code_postal + ...localite + ...cedex OU etablissement_gestionnaire_adresse + ...complement_adresse + ...localite + ...cedex
  latitude: z.string().nullable(), // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.latitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
  longitude: z.string().nullable(), // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.longitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
  city: z.string().nullable(), // pe -> lieuTravail.libelle | formation -> localite | pe -> city | lba -> city
  address: z.string().nullable().optional(), // formation -> etablissement_formateur_adresse, etablissement_formateur_complement_adresse | lbb / lba -> address -> street_number + street_name | matcha -> adresse
  cedex: z.string().nullable().optional(), // formation -> etablissement_formateur_cedex
  zipCode: z.string().nullable().optional(), // formation -> etablissement_formateur_code_postal | pe -> lieuTravail.codePostal | lba -> zip_code
  insee: z.string().nullable().optional(), // pe -> lieuTravail.commune, training -> code_commune_insee, lba -> insee_city_code
  departementNumber: z.string().nullable().optional(), // formation -> num_departement
  region: z.string().nullable().optional(), // formation -> region
  remoteOnly: z.boolean().nullable().optional(), // formation
})

const ZLbaItemRome = z.object({
  code: z.string().nullable(), // pe -> romeCode | lbb/lba -> rome_codes | matcha -> offres.romes
  label: z.string().nullable().optional(), // pe -> appellationLibelle | lbb/lba -> matched_rome_label
})
const ZLbaItemNaf = z.object({
  code: z.string().nullable().optional(), // lbb/lba -> naf_code | pe -> secteurActivite
  label: z.string().nullable().optional(), // lbb/lba -> naf_label | matcha -> libelle_naf | pe -> secteurActiviteLibelle
})

const ZLbaItem = z.object({
  ideaType: z.string().nullable(), // type de l'item :  formation | lbb | lba | peJob | matcha
  title: z.string().nullable(), // pe -> intitule | lbb/lba -> enseigne | formation -> intitule_long OU intitule_court | matcha -> offres.libelle || offres.rome_appellation_label
  longTitle: z.string().nullable(), // formation -> intitule_long,
  id: z.string().nullable(), // formation -> id | matcha -> id_form
  idRco: z.string().nullable(), // formation -> id_formation
  idRcoFormation: z.string().nullable(), // formation -> id_rco_formation

  contact: z
    .object({
      // informations de contact. optionnel
      email: z.string().nullable().optional(), // pe -> contact.courriel | lbb/lba -> email | formation -> email | matcha -> email
      name: z.string().nullable().optional(), // pe -> contact.nom | matcha -> prenom nom
      phone: z.string().nullable().optional(), // lbb/lba --> phone | matcha -> telephone
      info: z.string().nullable().optional(), // pe -> contact.coordonnees1+contact.coordonnees2+contact.coordonnees3
    })
    .nullable(), // informations de contact. optionnel

  place: ZLBAItemPlace.nullable(), // lieu principal pour l'item, lieu de formation ou lieu de l'offre ou adresse de l'entreprise

  company: z
    .object({
      name: z.string().nullable().optional(), // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> enseigne / raison_sociale | matcha -> enseigne > raison_sociale
      siret: z.string().nullable().optional(), // lbb/lba -> siret | formation -> etablissement_formateur_siret | matcha -> siret | pe -> entreprise.siret réservé à notre front
      size: z.string().nullable().optional(), // lbb/lba -> company_size | matcha -> tranche_effectif
      logo: z.string().nullable().optional(), // pe -> entreprise.logo
      description: z.string().nullable().optional(), // pe -> entreprise.description
      socialNetwork: z.string().nullable().optional(), // lbb / lba -> social_network
      url: z.string().nullable().optional(), // lbb / lba -> website
      id: z.string().nullable().optional(), // formation -> etablissement_formateur_id
      uai: z.string().nullable().optional(), // formation -> etablissement_formateur_uai
      place: ZLBAItemPlace.partial().nullable().optional(),
      mandataire: z.boolean().nullable().optional(), // matcha -> mandataire
      creationDate: z.date().nullable().optional(), // matcha -> date_creation_etablissement
      headquarter: z
        .object({
          siret: z.string().nullable(), // formation -> etablissement_gestionaire_siret
          id: z.string().nullable(), // formation -> etablissement_gestionnaire_id
          uai: z.string().nullable(), // formation -> etablissement_gestionnaire_uai
          type: z.string().nullable(), // formation -> etablissement_gestionnaire_type
          hasConvention: z.string().nullable(), // formation -> etablissement_gestionnaire_conventionne
          place: ZLBAItemPlace.partial().nullable(),
          name: z.string().nullable(), // formation -> etablissement_gestionnaire_entreprise_raison_sociale
        })
        .nullable()
        .optional(), // uniquement pour formation
      opco: z
        .object({
          label: z.string().nullable(), // lba -> opco
          url: z.string().nullable(), // lba -> opco_url
        })
        .nullable()
        .optional(),
    })
    .nullable(),

  createdAt: z.string().nullable(), // formation -> created_at | matcha -> createdAt
  lastUpdateAt: z.string().nullable(), // formation -> last_update_at | matcha -> updatedAt
  url: z.string().nullable(), // pe -> reconstruction depuis id | lbb/lba url

  /** TODO API V2: move inside training<ILbaItemTraining> */
  cleMinistereEducatif: z.string().nullable(), // formation
  diplomaLevel: z.string().nullable(), // formation -> niveau  | matcha -> offres.niveau
  diploma: z.string().nullable(), // formation -> diplome
  cfd: z.string().nullable(), // formation -> cfd
  rncpCode: z.string().nullable(), // formation -> rncp_code
  rncpLabel: z.string().nullable(), // formation -> rncp_intitule
  rncpEligibleApprentissage: z.string().nullable(), // formation -> rncp_eligible_apprentissage
  period: z.string().nullable(), // formation -> periode
  capacity: z.string().nullable(), // formation -> capacite
  onisepUrl: z.string().nullable(), // formation -> onisep_url

  job: z
    .object({
      description: z.string().nullable(), // pe -> description | matcha -> description
      creationDate: z.union([z.string(), z.date()]), // pe -> dateCreation | matcha -> createdAt
      id: z.string().nullable(), // pe -> id | matcha -> id mongo offre
      contractType: z.string().nullable(), // pe -> typeContrat | matcha -> offres.type
      contractDescription: z.string().nullable().optional(), // pe -> typeContratLibelle
      duration: z.string().nullable().optional(), // pe -> dureeTravailLibelle
      jobStartDate: z.union([z.string(), z.date()]).optional(), // matcha -> offres.date_debut_apprentissage
      romeDetails: z.object().optional(), // matcha -> offres.rome_detail -> détail du code ROME
      rythmeAlternance: z.string().nullable().optional(), // matcha -> offres.rythme_alternance
      elligibleHandicap: z.boolean().optional(), // matcha -> offres.is_disabled_elligible
      dureeContrat: z.string().nullable().optional(), // matcha -> offres.duree_contrat
      quantiteContrat: z.number().nullable().optional(), // matcha -> offres.quantite
      status: z.enum(["Active", "Pourvue", "Annulée", "En attente"]).nullable().optional(),
    })
    .nullable(), // uniquement pour pe et matcha

  romes: z.array(ZLbaItemRome).nullable(),
  nafs: z.array(ZLbaItemNaf).nullable(),

  training: z
    .object({
      description: z.string().nullable(),
      objectif: z.string().nullable(),
      sessions: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
          isPermanentEntry: z.string(),
        })
      ),
    })
    .nullable(),

  applicationCount: z.number().nullable(), // lba / matcha -> calcul en fonction du nombre de candidatures enregistrées
})

export const zV1JobsRoutes = {
  get: {
    "/api/v1/jobs/establishment": {
      queryParams: z.object({
        establishment_siret: extensions.siret(),
        email: z.string().email(),
      }),
      response: {
        "2xx": z.object({
          token: z.string(),
        }),
      },
    },
    "/api/v1/jobs/bulk": {
      queryParams: z.object({
        query: z.string().optional(), // mongo query
        select: z.string().optional(), // mongo projection
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: {
        "2xx": z.object({
          data: z.array(ZUserRecruteur).optional(),
          pagination: z.object({
            page: z.number().optional(),
            result_per_page: z.number(),
            number_of_page: z.number().optional(),
            total: z.number().optional(),
          }),
        }),
      },
    },
    "/api/v1/jobs/delegations/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": null, // typé any
      },
    },
    "/api/v1/jobs": {
      queryParams: z.object({
        romes: z.string().optional(),
        rncp: z.string().optional(),
        caller: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        radius: z.string().optional(),
        insee: z.string().optional(),
        sources: z.string().optional(),
        diploma: z.string().optional(),
        opco: z.string().optional(),
        opcoUrl: z.string().optional(),
        referer: z.string().optional(), // hidden
        useMock: z.string().optional(), // hidden
      }),
      response: {
        "2xx": null, // TODO
      },
    },
    "/api/v1/jobs/company/:siret": {
      params: z.object({
        siret: extensions.siret(),
      }),
      queryParams: z.object({
        caller: z.string().optional(),
        referer: z.string().optional(), // hidden
      }),
      response: {
        "2xx": z.object({
          lbaCompanies: z.array(ZLbaItem),
        }),
      },
    },
    "/api/v1/jobs/matcha/:id": {
      params: z.object({
        id: z.string(),
      }),
      queryParams: z.object({
        caller: z.string().optional(),
      }),
      response: {
        "2xx": z.object({
          matchas: z.array(ZLbaItem),
        }),
      },
    },
    "/api/v1/jobs/job/:id": {
      params: z.object({
        id: z.string(),
      }),
      queryParams: z.object({
        caller: z.string().optional(),
      }),
      response: {
        "2xx": z.object({
          peJobs: z.array(ZLbaItem),
        }),
      },
    },
  },
  post: {
    "/api/v1/jobs/establishment": {
      queryParams: z.object({
        establishment_siret: extensions.siret(),
        first_name: z.string(),
        last_name: z.string(),
        phone: z.string().optional(),
        email: z.string().email(),
        idcc: z.string().optional(),
        origin: z.string().optional(),
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/v1/jobs/:establishmentId": {
      params: z.object({
        establishmentId: z.string(),
      }),
      queryParams: z.object({
        job_level_label: z.string(),
        job_duration: z.number(),
        job_type: z.array(z.string()),
        is_disabled_elligible: z.boolean(),
        job_count: z.number().optional(),
        job_rythm: z.string().optional(),
        job_start_date: z.string(),
        job_employer_description: z.string().optional(),
        job_description: z.string().optional(),
        custom_address: z.string().optional(),
        custom_geo_coordinates: z.string().optional(),
        appellation_code: z.string(),
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/v1/jobs/delegations/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      queryParams: z.object({
        establishmentIds: z.array(z.string()),
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/v1/jobs/provided/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/v1/jobs/canceled/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/v1/jobs/extend/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/v1/jobs/matcha/:id/stats/view-details": {
      params: z.object({
        id: z.string(),
      }),
      response: {
        "2xx": null,
      },
    },
  },
  patch: {
    "/api/v1/jobs/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
  },
  put: {},
  delete: {},
}
