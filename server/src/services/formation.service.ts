import crypto from "crypto"

import axios from "axios"
import Boom from "boom"
import { groupBy, maxBy } from "lodash-es"
import type { IFormationCatalogue } from "shared"

import { logger } from "@/common/logger"

import { getElasticInstance } from "../common/esClient/index"
import { FormationCatalogue } from "../common/model/index"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { regionCodeToDepartmentList } from "../common/utils/regionInseeCodes"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import { notifyToSlack } from "../common/utils/slackUtils"
import config from "../config"

import type { IFormationEsResult } from "./formation.service.types"
import type { ILbaItemFormation, ILbaItemTrainingSession } from "./lbaitem.shared.service.types"
import { formationsQueryValidator, formationsRegionQueryValidator } from "./queryValidator.service"

const formationResultLimit = 500

const lbfDescriptionUrl = `${config.laBonneFormationApiUrl}/api/v1/detail`

const esClient = getElasticInstance()

const diplomaMap = {
  3: "3 (CAP...)",
  4: "4 (BAC...)",
  5: "5 (BTS, DEUST...)",
  6: "6 (Licence, BUT...)",
  7: "7 (Master, titre ingénieur...)",
}

const getDiplomaIndexName = (value) => {
  return value ? diplomaMap[value[0]] : ""
}

/**
 * Récupère les formations matchant les critères en paramètre depuis Elasticsearch
 */
export const getFormations = async ({
  romes,
  romeDomain,
  coords,
  radius,
  diploma,
  limit = 10,
  options,
}: {
  romes?: string[]
  romeDomain?: string
  coords?: [number, number]
  radius?: number
  diploma?: string
  limit?: number
  caller?: string
  api?: string
  options: "with_description"[]
}): Promise<IFormationEsResult[]> => {
  try {
    const distance = radius || 30

    const latitude = coords?.at(1)
    const longitude = coords?.at(0)

    const now = new Date()
    const tags = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + (now.getMonth() < 8 ? -1 : 2)]

    const mustTerm: object[] = [
      romes
        ? {
            match: {
              rome_codes: romes.join(" "),
            },
          }
        : {
            multi_match: {
              query: romeDomain,
              fields: ["rome_codes"],
              type: "phrase_prefix",
              operator: "or",
            },
          },
    ]

    mustTerm.push({
      match: {
        tags: tags.join(" "),
      },
    })

    if (diploma) {
      mustTerm.push({
        match_phrase: {
          niveau: getDiplomaIndexName(diploma),
        },
      })
    }

    const esQuerySort = {
      sort: [
        coords
          ? {
              _geo_distance: {
                lieu_formation_geo_coordonnees: coords,
                order: "asc",
                unit: "km",
                mode: "min",
                distance_type: "arc",
                ignore_unmapped: true,
              },
            }
          : "_score",
      ],
    }

    const esQuery: any = {
      query: {
        bool: {
          must: mustTerm,
        },
      },
    }

    if (coords) {
      esQuery.query.bool.filter = {
        geo_distance: {
          distance: `${distance}km`,
          lieu_formation_geo_coordonnees: {
            lat: latitude,
            lon: longitude,
          },
        },
      }
    }

    const esQueryIndexFragment = getFormationEsQueryIndexFragment(limit, options)

    const responseFormations = await esClient.search({
      ...esQueryIndexFragment,
      body: {
        ...esQuery,
        ...esQuerySort,
      },
    })

    const formations: any[] = []

    responseFormations.body.hits.hits.forEach((formation) => {
      formations.push({ source: formation._source, sort: formation.sort, id: formation._id })
    })

    return formations
  } catch (error) {
    const newError = Boom.internal("getting trainings from Catalogue")
    newError.cause = error
    throw newError
  }
}

/**
 * Retourne une formation provenant de la collection des formationsCatalogues
 * @param {string} id l'identifiant de la formation
 * @returns {Promise<IApiError | IFormationEsResult[]>}
 */
const getFormation = async ({ id }: { id: string; caller?: string }): Promise<IFormationEsResult[]> => {
  const formation = await FormationCatalogue.findOne({ cle_ministere_educatif: id })

  if (formation) {
    return [{ source: formation }]
  } else {
    return []
  }
}

/**
 * Retourne une formation du catalogue transformée en LbaItem
 */
const getOneFormationFromId = async ({ id }: { id: string }): Promise<ILbaItemFormation[]> => {
  const rawEsFormations = await getFormation({ id })
  const formations = transformFormationsForIdea(rawEsFormations)

  return formations
}

/**
 * Récupère les formations matchant les critères en paramètre depuis Elasticsearch sur une région ou un département donné
 * @param {string[]} romes un tableau de codes ROME
 * @param {string} romeDomain un domaine de ROME
 * @param {string} region le code région sur lequel filtrer la recherche
 * @param {string} departement le code département sur lequel filtrer la recherche
 * @param {string} diploma le niveau de diplôme visé
 * @param {number} limit le nombre de résultats max à produire
 * @param {string} caller l'identifiant fourni par l'exploitant de l'api
 * @param {string[]} options un tableau d'options modulant la recherche
 * @returns {Promise<IFormationEsResult[]>}
 */
const getRegionFormations = async ({
  romes,
  romeDomain,
  region,
  departement,
  diploma,
  limit = formationResultLimit,
  options,
  caller,
}: {
  romes: string[]
  romeDomain?: string
  region?: string
  departement?: string
  diploma?: string
  limit?: number
  options: "with_description"[]
  caller?: string
}): Promise<IFormationEsResult[]> => {
  const mustTerm: any[] = []

  if (departement)
    mustTerm.push({
      multi_match: {
        query: departement,
        fields: ["code_postal"],
        type: "phrase_prefix",
        operator: "or",
      },
    })

  if (region) mustTerm.push(getEsRegionTermFragment(region))

  if (romes.length)
    mustTerm.push({
      match: {
        rome_codes: romes.join(" "),
      },
    })

  if (romeDomain)
    mustTerm.push({
      multi_match: {
        query: romeDomain,
        fields: ["rome_codes"],
        type: "phrase_prefix",
        operator: "or",
      },
    })

  if (diploma)
    mustTerm.push({
      match: {
        niveau: getDiplomaIndexName(diploma),
      },
    })

  const esQueryIndexFragment = getFormationEsQueryIndexFragment(limit, options)

  const responseFormations = await esClient.search({
    ...esQueryIndexFragment,
    body: {
      query: {
        bool: {
          must: mustTerm,
        },
      },
    },
  })

  const formations: IFormationEsResult[] = responseFormations.body.hits.hits.map((formation) => ({ source: formation._source, sort: formation.sort, id: formation._id }))
  if (formations.length === 0 && !caller) {
    await notifyToSlack({ subject: "FORMATION", message: `Aucune formation par région trouvée pour les romes ${romes} ou le domaine ${romeDomain}.` })
  }
  return formations
}

/**
 * Tente de récupérer des formations dans le rayon de recherche, si sans succès cherche les maxOutLimitFormation les plus proches du centre de recherche
 */
const getAtLeastSomeFormations = async ({
  romes,
  romeDomain,
  coords,
  radius,
  diploma,
  maxOutLimitFormation,
  caller,
  options,
}: {
  romes?: string[]
  romeDomain?: string
  coords?: [number, number]
  radius?: number
  diploma?: string
  maxOutLimitFormation: number
  caller?: string
  options: "with_description"[]
}): Promise<ILbaItemFormation[]> => {
  let rawEsFormations: IFormationEsResult[]
  let currentRadius = radius
  let formationLimit = formationResultLimit

  rawEsFormations = await getFormations({
    romes,
    romeDomain,
    coords,
    radius: currentRadius,
    diploma,
    limit: formationLimit,
    caller,
    options,
  })

  // si pas de résultat on étend le rayon de recherche et on réduit le nombre de résultats autorisés
  if (rawEsFormations instanceof Array && rawEsFormations.length === 0) {
    formationLimit = maxOutLimitFormation // limite réduite car extension au delà du rayon de recherche
    currentRadius = 20000
    rawEsFormations = await getFormations({
      romes,
      romeDomain,
      coords,
      radius: currentRadius,
      diploma,
      limit: formationLimit,
      caller,
      options,
    })
  }

  rawEsFormations = deduplicateFormations(rawEsFormations)
  const formations = transformFormationsForIdea(rawEsFormations)
  sortFormations(formations)
  return formations
}

/**
 * Retire les formations en doublon selon les critères arbitraires métiers visibles ci-dessous
 * @param {IFormationEsResult[]} formations les formations issues de la recherche elasticsearch
 * @return {IFormationEsResult[]}
 */
export const deduplicateFormations = (formations: IFormationEsResult[]): IFormationEsResult[] => {
  if (formations instanceof Array && formations.length > 0) {
    return formations.reduce((acc: any[], formation) => {
      const found = acc.find((f) => {
        return (
          f.source.intitule_long === formation.source.intitule_long &&
          f.source.intitule_court === formation.source.intitule_court &&
          f.source.etablissement_formateur_siret === formation.source.etablissement_formateur_siret &&
          f.source.diplome === formation.source.diplome &&
          f.source.code_postal === formation.source.code_postal
        )
      })

      if (!found) {
        acc = [...acc, formation]
      }

      return acc
    }, [])
  } else {
    return formations
  }
}

/**
 * Retourne un ensemble de formations LbaItem à partir de formations issues d'elasticsearch ou de la mongo
 */
const transformFormationsForIdea = (rawEsFormations: IFormationEsResult[]): ILbaItemFormation[] => {
  const formations: ILbaItemFormation[] = []

  if (rawEsFormations.length) {
    for (let i = 0; i < rawEsFormations.length; ++i) {
      formations.push(transformFormationForIdea(rawEsFormations[i]))
    }
  }

  return formations
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées des formations
 */
const transformFormationForIdea = (rawFormation: IFormationEsResult): ILbaItemFormation => {
  const geoSource = rawFormation.source.lieu_formation_geo_coordonnees
  const [latOpt, longOpt] = (geoSource?.split(",") ?? []).map((str) => parseFloat(str))

  const resultFormation: ILbaItemFormation = {
    ideaType: "formation",
    title: (rawFormation.source?.intitule_long || rawFormation.source.intitule_court) ?? null,
    longTitle: rawFormation.source.intitule_long ?? null,
    id: rawFormation.source.cle_ministere_educatif ?? null,
    idRco: rawFormation.source.id_formation ?? null,
    idRcoFormation: rawFormation.source.id_rco_formation ?? null,

    contact: null,

    place: {
      distance: rawFormation.sort ? roundDistance(rawFormation.sort[0]) : null,
      fullAddress: getTrainingAddress(rawFormation.source), // adresse postale reconstruite à partir des éléments d'adresse fournis
      latitude: latOpt ?? null,
      longitude: longOpt ?? null,
      //city: formation.source.etablissement_formateur_localite,
      city: rawFormation.source.localite ?? null,
      address: `${rawFormation.source.lieu_formation_adresse}`,
      cedex: rawFormation.source.etablissement_formateur_cedex,
      zipCode: rawFormation.source.code_postal,
      //trainingZipCode: formation.source.code_postal,
      departementNumber: rawFormation.source.num_departement,
      region: rawFormation.source.region,
      insee: rawFormation.source.code_commune_insee,
      remoteOnly: rawFormation.source.entierement_a_distance,
    },

    company: {
      name: getSchoolName(rawFormation.source), // pe -> entreprise.nom | formation -> etablissement_formateur_enseigne | lbb/lba -> name
      siret: rawFormation.source.etablissement_formateur_siret,
      id: rawFormation.source.etablissement_formateur_id,
      uai: rawFormation.source.etablissement_formateur_uai,
      headquarter: {
        // uniquement pour formation
        id: rawFormation.source.etablissement_gestionnaire_id ?? null,
        uai: rawFormation.source.etablissement_gestionnaire_uai ?? null,
        siret: rawFormation.source.etablissement_gestionnaire_siret ?? null,
        type: rawFormation.source.etablissement_gestionnaire_type ?? null,
        hasConvention: rawFormation.source.etablissement_gestionnaire_conventionne ?? null,
        place: {
          address: `${rawFormation.source.etablissement_gestionnaire_adresse}${
            rawFormation.source.etablissement_gestionnaire_complement_adresse ? ", " + rawFormation.source.etablissement_gestionnaire_complement_adresse : ""
          }`,
          cedex: rawFormation.source.etablissement_gestionnaire_cedex,
          zipCode: rawFormation.source.etablissement_gestionnaire_code_postal,
          city: rawFormation.source.etablissement_gestionnaire_localite,
        },
        name: rawFormation.source.etablissement_gestionnaire_entreprise_raison_sociale ?? null,
      },
      place: {
        city: rawFormation.source.etablissement_formateur_localite,
      },
    },

    diplomaLevel: rawFormation.source.niveau ?? null,
    diploma: rawFormation.source.diplome ?? null,
    cleMinistereEducatif: rawFormation.source.cle_ministere_educatif ?? null,
    cfd: rawFormation.source.cfd ?? null,
    rncpCode: rawFormation.source.rncp_code ?? null,
    rncpLabel: rawFormation.source.rncp_intitule ?? null,
    rncpEligibleApprentissage: rawFormation.source.rncp_eligible_apprentissage,
    period: null,
    capacity: rawFormation.source.capacite ?? null,
    onisepUrl: rawFormation.source.onisep_url ?? null,

    romes: rawFormation.source.rome_codes && rawFormation.source.rome_codes.length ? rawFormation.source.rome_codes.map((rome) => ({ code: rome })) : null,
    training: {
      objectif: rawFormation.source?.objectif?.trim() ?? null,
      description: rawFormation.source?.contenu?.trim() ?? null,
      sessions: setSessions(rawFormation.source),
    },
  }

  return resultFormation
}

/**
 * Construit le bloc de sessions d'une formation
 * @param {Partial<IFormationCatalogue>} formation
 * @return {ILbaItemTrainingSession[]}
 */
const setSessions = (formation: Partial<IFormationCatalogue>): ILbaItemTrainingSession[] => {
  const { date_debut, date_fin, modalites_entrees_sorties } = formation ?? {}
  if (date_debut?.length && date_fin?.length && modalites_entrees_sorties?.length) {
    return (date_debut ?? []).map((startDate, idx) => ({
      startDate: new Date(startDate),
      endDate: new Date(date_fin[idx]),
      isPermanentEntry: modalites_entrees_sorties[idx],
    }))
  } else {
    return []
  }
}

/**
 * Retourne l'adresse de la formation à partir des meilleurs informations disponibles
 * @param {Partial<IFormationCatalogue>} formation
 * @returns {string}
 */
const getTrainingAddress = (formation: Partial<IFormationCatalogue>): string => {
  let schoolAddress = ""

  if (formation.lieu_formation_adresse) {
    schoolAddress = `${formation.lieu_formation_adresse} ${formation.code_postal} ${formation.localite}`
  } else {
    schoolAddress = formation.etablissement_formateur_adresse
      ? `${formation.etablissement_formateur_adresse}${formation.etablissement_formateur_complement_adresse ? `, ${formation.etablissement_formateur_complement_adresse}` : ""} ${
          formation.etablissement_formateur_localite ? formation.etablissement_formateur_localite : ""
        } ${formation.etablissement_formateur_code_postal ? formation.etablissement_formateur_code_postal : ""}${
          formation.etablissement_formateur_cedex ? ` CEDEX ${formation.etablissement_formateur_cedex}` : ""
        }
        `
      : `${formation.etablissement_gestionnaire_adresse}${
          formation.etablissement_gestionnaire_complement_adresse ? `, ${formation.etablissement_gestionnaire_complement_adresse}` : ""
        } ${formation.etablissement_gestionnaire_localite ? formation.etablissement_gestionnaire_localite : ""} ${
          formation.etablissement_gestionnaire_code_postal ? formation.etablissement_gestionnaire_code_postal : ""
        }${formation.etablissement_gestionnaire_cedex ? ` CEDEX ${formation.etablissement_gestionnaire_cedex}` : ""}
        `
  }
  return schoolAddress
}

/**
 * Retourne le nom du centre de formation à partir des meilleurs informations disponibles d'une formation
 * @param {Partial<IFormationCatalogue>} formation
 * @returns {string}
 */
const getSchoolName = (formation: Partial<IFormationCatalogue>): string | undefined => {
  return (
    (formation.etablissement_formateur_enseigne || formation.etablissement_formateur_entreprise_raison_sociale || formation.etablissement_gestionnaire_entreprise_raison_sociale) ??
    undefined
  )
}

/**
 * Retourne des formations correspondantes aux critères de métier et lieu.
 * Si aucune ne correspond au lieu, retourne les plus proches quelle que soit la distance.
 * TODO: déplacement du contrôle des paramètres au niveau controller, appel direct de getAtLeastSomeFromations depuis le controller
 * @param {any} query requête
 */
export const getFormationsQuery = async ({
  romes,
  longitude,
  latitude,
  radius,
  diploma,
  romeDomain,
  caller,
  options,
  referer,
  api = "formationV1",
}: {
  romes?: string
  longitude?: number
  latitude?: number
  radius?: number
  diploma?: string
  romeDomain?: string
  caller?: string
  options?: "with_description"
  referer?: string
  api?: string
}): Promise<IApiError | { results: ILbaItemFormation[] }> => {
  const parameterControl = await formationsQueryValidator({ romes, longitude, latitude, radius, diploma, romeDomain, caller, referer })

  if ("error" in parameterControl) {
    return parameterControl
  }

  try {
    const formations = await getAtLeastSomeFormations({
      romes: parameterControl.romes?.split(","),
      coords: longitude !== undefined && latitude !== undefined ? [longitude, latitude] : undefined,
      radius,
      diploma: diploma,
      maxOutLimitFormation: 5,
      romeDomain,
      caller,
      options: options === "with_description" ? ["with_description"] : [],
    })

    return { results: formations }
  } catch (err) {
    sentryCaptureException(err)
    if (caller) {
      trackApiCall({ caller, api_path: api, response: "Error" })
    }
    return { error: "internal_error" }
  }
}

/**
 * Retourne une formation identifiée par son id
 * TODO: passer directement du controller à getOneFormationFromId
 */
export const getFormationQuery = async ({ id, caller }: { id: string; caller?: string }): Promise<IApiError | { results: ILbaItemFormation[] }> => {
  try {
    const formation = await getOneFormationFromId({ id })
    return {
      results: formation,
    }
  } catch (err) {
    sentryCaptureException(err)

    if (caller) {
      trackApiCall({ caller, api_path: "formationV1/formation", response: "Error" })
    }

    return { error: "internal_error" }
  }
}

/**
 * Construit et retourne les paramètres de la requête vers LBF
 * @param {string} id L'id RCO de la formation dont on veut récupérer les données sur LBF
 * @returns {string}
 */
const getLbfQueryParams = (id: string): string => {
  // le timestamp doit être uriencodé avec le format ISO sans les millis
  let date = new Date().toISOString()
  date = encodeURIComponent(date.substring(0, date.lastIndexOf(".")))

  let queryParams = `user=LBA&uid=${id}&timestamp=${date}`

  const hmac = crypto.createHmac("md5", config.laBonneFormationPassword)
  const data = hmac.update(queryParams)
  const signature = data.digest("hex")

  // le param signature doit contenir un hash des autres params chiffré avec le mdp attribué à LBA
  queryParams += "&signature=" + signature

  return queryParams
}

/**
 * Supprime les adresses emails de la payload provenant de l'api La Bonne Formation
 * @param {any} data la payload issue de LBF
 * @return {any}
 */
const removeEmailFromLBFData = (data: any): any => {
  if (data?.organisme?.contact?.email) {
    data.organisme.contact.email = ""
  }

  if (data?.sessions?.length) {
    data.sessions.forEach((_, idx) => {
      if (data.sessions[idx]?.contact?.email) {
        data.sessions[idx].contact.email = ""
      }
    })
  }

  return data
}

/**
 * Récupère depuis l'api LBF des éléments de description indisponibles depuis le catalogue
 * @returns {Promise<IApiError | any>}
 */
export const getFormationDescriptionQuery = async ({ id }: { id: string }): Promise<IApiError | any> => {
  try {
    const formationDescription = await axios.get(`${lbfDescriptionUrl}?${getLbfQueryParams(id)}`)
    logger.info(`Call formationDescription. params=${id}`)
    return removeEmailFromLBFData(formationDescription.data)
  } catch (error) {
    return manageApiError({
      error,
      errorTitle: `getting training description from Labonneformation`,
    })
  }
}

/**
 * Retourne les formations matchant les critères dans la requête
 * TODO: déporter les ctrls dans le controller, appeler directement getRegionFormations depuis le controller
 */
export const getFormationsParRegionQuery = async ({
  romes,
  departement,
  region,
  diploma,
  romeDomain,
  caller,
  options,
  referer,
}: {
  romes?: string
  departement?: string
  region?: string
  diploma?: string
  romeDomain?: string
  caller?: string
  options?: "with_description"
  referer?: string
}): Promise<IApiError | { results: ILbaItemFormation[] }> => {
  const queryValidationResult = formationsRegionQueryValidator({ romes, departement, region, diploma, romeDomain, caller, referer })

  if ("error" in queryValidationResult) {
    return queryValidationResult
  }

  try {
    const rawEsFormations = await getRegionFormations({
      romes: romes ? romes.split(",") : [],
      region: region,
      departement: departement,
      diploma: diploma,
      romeDomain: romeDomain,
      caller: caller,
      options: options === "with_description" ? ["with_description"] : [],
    })

    const formations = transformFormationsForIdea(rawEsFormations)
    sortFormations(formations)

    return { results: formations }
  } catch (err) {
    sentryCaptureException(err)
    if (caller) {
      trackApiCall({ caller, api_path: "formationRegionV1", response: "Error" })
    }

    return { error: "internal_error" }
  }
}

/**
 * Construit le bloc de requête elasticsearch de base pour la recherche de formations :
 * index visé, nb de résultats à retourner, champs souhaités
 * @param {number} limit le nombre de résultats max retournés par la requête
 * @param {string[]} options une liste d'options permettant de moduler le fragment de requête
 * @returns {{ index: string; size: number; _source_includes: string[] }}
 */
const getFormationEsQueryIndexFragment = (limit: number, options: "with_description"[]): { index: string; size: number; _source_includes: string[] } => {
  return {
    index: "formationcatalogues",
    size: limit,
    _source_includes: [
      "etablissement_formateur_siret",
      "onisep_url",
      "_id",
      "email",
      "niveau",
      "lieu_formation_geo_coordonnees",
      "intitule_long",
      "intitule_court",
      "lieu_formation_adresse",
      "localite",
      "code_postal",
      "num_departement",
      "region",
      "diplome",
      "created_at",
      "last_update_at",
      "etablissement_formateur_id",
      "etablissement_formateur_uai",
      "etablissement_formateur_adresse",
      "etablissement_formateur_code_postal",
      "etablissement_formateur_localite",
      "etablissement_formateur_entreprise_raison_sociale",
      "etablissement_formateur_cedex",
      "etablissement_formateur_complement_adresse",
      "etablissement_gestionnaire_id",
      "etablissement_gestionnaire_uai",
      "etablissement_gestionnaire_conventionne",
      "etablissement_gestionnaire_type",
      "etablissement_gestionnaire_siret",
      "etablissement_gestionnaire_adresse",
      "etablissement_gestionnaire_code_postal",
      "etablissement_gestionnaire_localite",
      "etablissement_gestionnaire_entreprise_raison_sociale",
      "etablissement_gestionnaire_cedex",
      "etablissement_gestionnaire_complement_adresse",
      "code_commune_insee",
      "rome_codes",
      "cfd",
      "rncp_code",
      "rncp_intitule",
      "rncp_eligible_apprentissage",
      "modalites_entrees_sorties",
      "date_debut",
      "date_fin",
      "capacite",
      "id_rco_formation",
      "id_formation",
      "cle_ministere_educatif",
    ].concat(options.indexOf("with_description") >= 0 ? ["objectif", "contenu"] : []),
  }
}

/**
 * retourne le morceau de requête elasticsearch correspondant à un filtrage sur une région donné
 * @param {string} region le code de la région
 * @returns {object}
 */
const getEsRegionTermFragment = (region: string): object => {
  const departements: object[] = []

  regionCodeToDepartmentList[region].forEach((departement) => {
    departements.push({
      multi_match: {
        query: departement,
        fields: ["code_postal"],
        type: "phrase_prefix",
        operator: "or",
      },
    })
  })

  return {
    bool: {
      should: departements,
    },
  }
}

/**
 * tri alphabétique de formations sur le title (primaire) ou le company.name (secondaire )
 * lorsque les formations ne sont pas déjà triées sur la distance par rapport à un point de recherche
 */
const sortFormations = (formations: ILbaItemFormation[]) => {
  formations.sort((a, b) => {
    if (a?.place?.distance !== null) {
      return 0
    }
    const aTitle = a?.title?.toLowerCase()
    const bTitle = b?.title?.toLowerCase()
    if (aTitle && bTitle) {
      return aTitle < bTitle ? -1 : 1
    }
    const aCompanyName = a.company?.name?.toLowerCase()
    const bCompanyName = b.company?.name?.toLowerCase()
    if (aCompanyName && bCompanyName) {
      return aCompanyName < bCompanyName ? -1 : 1
    }
    return 0
  })
}

/**
 * Retourne l'email le plus présent parmi toutes les formations du catalogue ayant un même "etablissement_formateur_siret".
 */
export const getMostFrequentEmailByLieuFormationSiret = async (etablissement_formateur_siret: string | undefined): Promise<string | null> => {
  const formations = await FormationCatalogue.find(
    {
      email: { $ne: null },
      etablissement_formateur_siret,
    },
    { email: 1 }
  ).lean()

  const emailGroups = groupBy(formations, "email")
  const mostFrequentGroup = maxBy(Object.values(emailGroups), "length")
  return mostFrequentGroup?.length ? mostFrequentGroup[0].email ?? null : null
}
