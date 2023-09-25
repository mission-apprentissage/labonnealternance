import crypto from "crypto"

import axios from "axios"
import { groupBy, maxBy } from "lodash-es"
import type { IFormationCatalogue } from "shared"

import { getElasticInstance } from "../common/esClient/index"
import { FormationCatalogue } from "../common/model/index"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { regionCodeToDepartmentList } from "../common/utils/regionInseeCodes"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import { notifyToSlack } from "../common/utils/slackUtils"
import config from "../config"
import { formationDetailMock, formationMock, formationsMock } from "../mocks/formations-mock"

import type { IFormationEsResult } from "./formation.service.types"
import type { ILbaItem, ILbaItemTrainingSession } from "./lbaitem.shared.service.types"
import { LbaItem } from "./lbaitem.shared.service.types"
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
 * @param {string[]} romes un tableau de codes ROME
 * @param {string} romeDomain un domaine de ROME
 * @param {[number, number]} coords des coordonnées au format [longitude,latitude] pour centrer la recherche
 * @param {number} radius le rayon de recherche
 * @param {string} diploma le niveau de diplôme visé
 * @param {number} limit le nombre de résultats max à produire
 * @param {string} caller l'identifiant fourni par l'exploitant de l'api
 * @param {string} api le nom de l'api liée à cette fonction
 * @param {string[]} options un tableau d'options modulant la recherche
 * @param {string} useMock un flag indiquant s'il faut retourner des données mockées ou non
 * @returns {Promise<IFormationEsResult[]>}
 */
export const getFormations = async ({
  romes,
  romeDomain,
  coords,
  radius,
  diploma,
  limit,
  caller,
  api = "formationV1",
  options,
  useMock,
}: {
  romes?: string[]
  romeDomain?: string
  coords?: [number | string, number | string]
  radius?: number
  diploma?: string
  limit?: number
  caller?: string
  api?: string
  options: string[]
  useMock: string
}): Promise<IFormationEsResult[]> => {
  try {
    if (useMock && useMock !== "false") {
      return formationsMock
    }

    const distance = radius || 30

    const useGeoLocation = coords ? true : false
    const latitude = coords ? coords[1] : ""
    const longitude = coords ? coords[0] : ""

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
        useGeoLocation
          ? {
              _geo_distance: {
                lieu_formation_geo_coordonnees: [parseFloat(longitude), parseFloat(latitude)],
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

    if (useGeoLocation) {
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
    manageApiError({
      error,
      api_path: api,
      caller,
      errorTitle: `getting trainings from Catalogue (${api})`,
    })
    throw new Error(error)
  }
}

/**
 * Retourne une formation provenant de la collection des formationsCatalogues
 * @param {string} id l'identifiant de la formation
 * @returns {Promise<IApiError | IFormationEsResult[]>}
 */
const getFormation = async ({ id }: { id: string; caller?: string }): Promise<IFormationEsResult[]> => {
  let formation

  if (id === "id-formation-test") {
    formation = formationMock
  } else {
    formation = await FormationCatalogue.findOne({ cle_ministere_educatif: id })
  }

  if (formation) {
    return [{ source: formation }]
  } else {
    return []
  }
}

/**
 * Retourne une formation du catalogue transformée en LbaItem
 * @param {string} id l'identifiant de la formation
 * @returns {Promise<ILbaItem[]>}
 */
const getOneFormationFromId = async ({ id }: { id: string }): Promise<ILbaItem[]> => {
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
  romes?: string[]
  romeDomain?: string
  region?: string
  departement?: string
  diploma?: string
  limit?: number
  options: string[]
  caller: string
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

  if (romes)
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

  const formations: object[] = []

  responseFormations.body.hits.hits.forEach((formation) => {
    formations.push({ source: formation._source, sort: formation.sort, id: formation._id })
  })

  if (formations.length === 0 && !caller) {
    await notifyToSlack({ subject: "FORMATION", message: `Aucune formation par région trouvée pour les romes ${romes} ou le domaine ${romeDomain}.` })
  }

  return formations
}

/**
 * Tente de récupérer des formations dans le rayon de recherche, si sans succès cherche les maxOutLimitFormation les plus proches du centre de recherche
 * @param {string[]} romes un tableau de codes ROME
 * @param {string} romeDomain un domaine de ROME
 * @param {[number, number]} coords des coordonnées au format [longitude,latitude] pour centrer la recherche
 * @param {number} radius le rayon de recherche
 * @param {string} diploma le niveau de diplôme visé
 * @param {number} limit le nombre de résultats max à produire
 * @param {string} caller l'identifiant fourni par l'exploitant de l'api
 * @param {string} api le nom de l'api liée à cette fonction
 * @param {string[]} options un tableau d'options modulant la recherche
 * @param {string} useMock un flag indiquant s'il faut retourner des données mockées ou non
 * @returns {Promise<ILbaItem[]>}
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
  useMock,
}: {
  romes?: string[]
  romeDomain?: string
  coords?: [number, number]
  radius?: number
  diploma?: string
  maxOutLimitFormation: number
  caller?: string
  options: string[]
  useMock: string
}): Promise<ILbaItem[]> => {
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
    useMock,
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
      useMock,
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
 * @param {IFormationEsResult[]} rawEsFormations formations issues de la mongo ou de l'elasticsearch
 * @returns {ILbaItem[]}
 */
const transformFormationsForIdea = (rawEsFormations: IFormationEsResult[]): ILbaItem[] => {
  const formations: ILbaItem[] = []

  if (rawEsFormations.length) {
    for (let i = 0; i < rawEsFormations.length; ++i) {
      formations.push(transformFormationForIdea(rawEsFormations[i]))
    }
  }

  return formations
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées des formations
 * @param {IFormationEsResult} rawFormation formation brute issue de la mongo ou de l'ES
 * @return {ILbaItem}
 */
const transformFormationForIdea = (rawFormation: IFormationEsResult): ILbaItem => {
  const resultFormation = new LbaItem("formation")

  resultFormation.title = (rawFormation.source?.intitule_long || rawFormation.source.intitule_court) ?? null
  resultFormation.longTitle = rawFormation.source.intitule_long ?? null
  resultFormation.diplomaLevel = rawFormation.source.niveau ?? null
  resultFormation.onisepUrl = rawFormation.source.onisep_url ?? null
  resultFormation.id = rawFormation.source.cle_ministere_educatif ?? null
  resultFormation.diploma = rawFormation.source.diplome ?? null
  resultFormation.cfd = rawFormation.source.cfd ?? null
  resultFormation.rncpCode = rawFormation.source.rncp_code ?? null
  resultFormation.rncpLabel = rawFormation.source.rncp_intitule ?? null
  resultFormation.rncpEligibleApprentissage = rawFormation.source.rncp_eligible_apprentissage
  resultFormation.capacity = rawFormation.source.capacite ?? null
  resultFormation.createdAt = rawFormation.source.created_at
  resultFormation.lastUpdateAt = rawFormation.source.last_update_at
  resultFormation.idRco = rawFormation.source.id_formation ?? null
  resultFormation.idRcoFormation = rawFormation.source.id_rco_formation ?? null
  resultFormation.cleMinistereEducatif = rawFormation.source.cle_ministere_educatif ?? null

  const geoSource = rawFormation.source.lieu_formation_geo_coordonnees

  resultFormation.place = {
    distance: rawFormation.sort ? roundDistance(rawFormation.sort[0]) : null,
    fullAddress: getTrainingAddress(rawFormation.source), // adresse postale reconstruite à partir des éléments d'adresse fournis
    latitude: geoSource ? geoSource.split(",")[0] : null,
    longitude: geoSource ? geoSource.split(",")[1] : null,
    //city: formation.source.etablissement_formateur_localite,
    city: rawFormation.source.localite,
    address: `${rawFormation.source.lieu_formation_adresse}`,
    cedex: rawFormation.source.etablissement_formateur_cedex,
    zipCode: rawFormation.source.code_postal,
    //trainingZipCode: formation.source.code_postal,
    departementNumber: rawFormation.source.num_departement,
    region: rawFormation.source.region,
    insee: rawFormation.source.code_commune_insee,
    remoteOnly: rawFormation.source.entierement_a_distance,
  }

  resultFormation.company = {
    name: getSchoolName(rawFormation.source), // pe -> entreprise.nom | formation -> etablissement_formateur_enseigne | lbb/lba -> name
    siret: rawFormation.source.etablissement_formateur_siret,
    id: rawFormation.source.etablissement_formateur_id,
    uai: rawFormation.source.etablissement_formateur_uai,
    headquarter: {
      // uniquement pour formation
      id: rawFormation.source.etablissement_gestionnaire_id,
      uai: rawFormation.source.etablissement_gestionnaire_uai,
      siret: rawFormation.source.etablissement_gestionnaire_siret,
      type: rawFormation.source.etablissement_gestionnaire_type,
      hasConvention: rawFormation.source.etablissement_gestionnaire_conventionne,
      place: {
        address: `${rawFormation.source.etablissement_gestionnaire_adresse}${
          rawFormation.source.etablissement_gestionnaire_complement_adresse ? ", " + rawFormation.source.etablissement_gestionnaire_complement_adresse : ""
        }`,
        cedex: rawFormation.source.etablissement_gestionnaire_cedex,
        zipCode: rawFormation.source.etablissement_gestionnaire_code_postal,
        city: rawFormation.source.etablissement_gestionnaire_localite,
      },
      name: rawFormation.source.etablissement_gestionnaire_entreprise_raison_sociale,
    },
    place: {
      city: rawFormation.source.etablissement_formateur_localite,
    },
  }

  if (rawFormation.source.rome_codes && rawFormation.source.rome_codes.length) {
    resultFormation.romes = []

    rawFormation.source.rome_codes.forEach((rome) => resultFormation.romes.push({ code: rome }))
  }

  resultFormation.training = {
    objectif: rawFormation.source?.objectif?.trim(),
    description: rawFormation.source?.contenu?.trim(),
    sessions: setSessions(rawFormation.source),
  }

  return resultFormation
}

/**
 * Construit le bloc de sessions d'une formation
 * @param {Partial<IFormationCatalogue>} formation
 * @return {ILbaItemTrainingSession[]}
 */
const setSessions = (formation: Partial<IFormationCatalogue>): ILbaItemTrainingSession[] => {
  const sessions: object[] = []
  if (formation?.date_debut?.length) {
    formation.date_debut.forEach((startDate, idx) => {
      sessions.push({
        startDate,
        endDate: formation.date_fin[idx],
        isPermanentEntry: formation.modalites_entrees_sorties[idx],
      })
    })
  }

  return sessions
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
const getSchoolName = (formation: Partial<IFormationCatalogue>): string => {
  return formation.etablissement_formateur_enseigne || formation.etablissement_formateur_entreprise_raison_sociale || formation.etablissement_gestionnaire_entreprise_raison_sociale
}

/**
 * Retourne des formations correspondantes aux critères de métier et lieu.
 * Si aucune ne correspond au lieu, retourne les plus proches quelle que soit la distance.
 * TODO: déplacement du contrôle des paramètres au niveau controller, appel direct de getAtLeastSomeFromations depuis le controller
 * @param {any} query requête
 * @returns {Promise<IApiError | { results: ILbaItem[]}}
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
  useMock,
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
  options?: string
  useMock?: string
  referer?: string
  api?: string
}): Promise<IApiError | { results: ILbaItem[] }> => {
  const parameterControl = await formationsQueryValidator({ romes, longitude, latitude, radius, diploma, romeDomain, caller, referer, useMock })

  if ("error" in parameterControl) {
    return parameterControl
  }

  try {
    const formations = await getAtLeastSomeFormations({
      romes: parameterControl.romes && parameterControl.romes.split(","),
      coords: longitude !== undefined && latitude !== undefined ? [longitude, latitude] : undefined,
      radius,
      diploma: diploma,
      maxOutLimitFormation: 5,
      romeDomain,
      caller,
      useMock,
      options: options ? options.split(",") : [],
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
 * @param {string} id l'identifiant de la formation (clef ministère éducatif)
 * @param {string} caller l'identifiant de l'appelant de l'api
 * @returns {Promise<IApiError | { results: ILbaItem[] }>}
 */
export const getFormationQuery = async ({ id, caller }: { id: string; caller?: string }): Promise<IApiError | { results: ILbaItem[] }> => {
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
 * @param {string} id l'identifiant de la formation chez LBF (id RCO)
 * @returns {Promise<IApiError | any>}
 */
export const getFormationDescriptionQuery = async ({ id }: { id: string }): Promise<IApiError | any> => {
  try {
    let formationDescription

    if (id === "id-formation-test") {
      formationDescription = formationDetailMock
    } else {
      formationDescription = await axios.get(`${lbfDescriptionUrl}?${getLbfQueryParams(id)}`)
    }

    return removeEmailFromLBFData(formationDescription.data)
  } catch (error) {
    manageApiError({
      error,
      errorTitle: `getting training description from Labonneformation`,
    })

    return { error: "internal_error" }
  }
}

/**
 * Retourne les formations matchant les critères dans la requête
 * TODO: déporter les ctrls dans le controller, appeler directement getRegionFormations depuis le controller
 * @param {any} query la requête http
 * @returns {Promise< IApiError | ILbaItem[] >}
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
  useMock,
}: {
  romes?: string
  departement?: string
  region?: string
  diploma?: string
  romeDomain?: string
  caller?: string
  options?: string
  referer?: string
  useMock?: string
}): Promise<IApiError | { results: ILbaItem[] }> => {
  const queryValidationResult = formationsRegionQueryValidator({ romes, departement, region, diploma, romeDomain, caller, referer, useMock })

  if ("error" in queryValidationResult) {
    return queryValidationResult
  }

  try {
    const rawEsFormations = await getRegionFormations({
      romes: romes ? romes.split(",") : null,
      region: region,
      departement: departement,
      diploma: diploma,
      romeDomain: romeDomain,
      caller: caller,
      options: options ? options.split(",") : [],
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
const getFormationEsQueryIndexFragment = (limit: number, options: string[]): { index: string; size: number; _source_includes: string[] } => {
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
 * @param {ILbaItem[]} formations tableau de formations converties au format unifié
 * @return
 */
const sortFormations = (formations: ILbaItem[]) => {
  formations.sort((a, b) => {
    if (a?.place?.distance !== null) {
      return 0
    }

    if (a?.title?.toLowerCase() < b?.title?.toLowerCase()) {
      return -1
    }
    if (a?.title?.toLowerCase() > b?.title?.toLowerCase()) {
      return 1
    }

    if (a?.company?.name?.toLowerCase() < b?.company?.name?.toLowerCase()) {
      return -1
    }
    if (a?.company?.name?.toLowerCase() > b?.company?.name?.toLowerCase()) {
      return 1
    }

    return 0
  })
}

/**
 * Retourne l'email le plus présent parmi toutes les formations du catalogue ayant un même "etablissement_formateur_siret".
 * @param {string} etablissement_formateur_siret
 * @return {Promise<string | null>}
 */
export const getMostFrequentEmailByLieuFormationSiret = async (etablissement_formateur_siret: string): Promise<string | null> => {
  const formations = await FormationCatalogue.find(
    {
      email: { $ne: null },
      etablissement_formateur_siret,
    },
    { email: 1 }
  ).lean()

  const emailGroups = groupBy(formations, "email")

  const mostFrequentGroup = maxBy(Object.values(emailGroups), "length")

  return mostFrequentGroup?.length ? mostFrequentGroup[0].email : null
}
