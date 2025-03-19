import { badRequest } from "@hapi/boom"
import dayjs from "dayjs"
import { chain } from "lodash-es"
import { assertUnreachable, type IFormationCatalogue, type ILbaItemFormation2 } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { IApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { isValidEmail } from "../common/utils/isValidEmail"
import { regionCodeToDepartmentList } from "../common/utils/regionInseeCodes"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import { notifyToSlack } from "../common/utils/slackUtils"

import { isEmailBlacklisted } from "./application.service"
import type { ILbaItemFormation, ILbaItemTrainingSession } from "./lbaitem.shared.service.types"
import { formationsQueryValidator, formationsRegionQueryValidator } from "./queryValidator.service"

const formationResultLimit = 500
const worldRadius = 21000

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

const minimalDataMongoFields = {
  cle_ministere_educatif: 1,
  code_commune_insee: 1,
  code_postal: 1,
  etablissement_formateur_siret: 1,
  etablissement_formateur_enseigne: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  etablissement_formateur_adresse: 1,
  etablissement_formateur_complement_adresse: 1,
  etablissement_formateur_localite: 1,
  etablissement_formateur_code_postal: 1,
  etablissement_formateur_cedex: 1,
  etablissement_gestionnaire_adresse: 1,
  etablissement_gestionnaire_complement_adresse: 1,
  etablissement_gestionnaire_localite: 1,
  etablissement_gestionnaire_code_postal: 1,
  etablissement_gestionnaire_cedex: 1,
  etablissement_gestionnaire_entreprise_raison_sociale: 1,
  etablissement_gestionnaire_siret: 1,
  intitule_court: 1,
  intitule_long: 1,
  intitule_rco: 1,
  lieu_formation_adresse: 1,
  lieu_formation_geo_coordonnees: 1,
  localite: 1,
  distance: 1,
  lieu_formation_geopoint: 1,
}

/**
 * Récupère les formations matchant les critères en paramètre depuis la mongo
 */
const getFormations = async ({
  romes,
  romeDomain,
  coords,
  radius,
  diploma,
  limit = 10,
  options,
  isMinimalData,
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
  isMinimalData: boolean
}): Promise<IFormationCatalogue[]> => {
  const distance = radius || 30
  const latitude = coords?.at(1)
  const longitude = coords?.at(0)
  const query: any = {}

  if (romes) {
    query.rome_codes = { $in: romes }
  }

  if (romeDomain) {
    query.rome_codes = {
      $regex: new RegExp(`^${romeDomain}`, "i"),
    }
  }

  if (diploma) {
    query.niveau = getDiplomaIndexName(diploma)
  }

  const stages: any[] = []

  if (isMinimalData) {
    stages.push({
      $project: minimalDataMongoFields,
    })
  } else if (options.indexOf("with_description") < 0) {
    stages.push({ $project: { objectif: 0, contenu: 0 } })
  }

  let formations: any[] = []
  if (coords) {
    stages.push({
      $limit: limit,
    })
    stages.unshift({
      $geoNear: {
        near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
        distanceField: "distance",
        key: "lieu_formation_geopoint",
        maxDistance: distance * 1000,
        query,
      },
    })
    formations = await getDbCollection("formationcatalogues").aggregate(stages).toArray()
  } else {
    stages.unshift({
      $match: query,
    })
    stages.push({
      $sample: {
        size: formationResultLimit,
      },
    })

    formations = await getDbCollection("formationcatalogues").aggregate(stages).toArray()
  }

  return formations
}

/**
 * Récupère les formations matchant les critères en paramètre sur une région ou un département donné
 * @param {string[]} romes un tableau de codes ROME
 * @param {string} romeDomain un domaine de ROME
 * @param {string} region le code région sur lequel filtrer la recherche
 * @param {string} departement le code département sur lequel filtrer la recherche
 * @param {string} diploma le niveau de diplôme visé
 * @param {number} limit le nombre de résultats max à produire
 * @param {string} caller l'identifiant fourni par l'exploitant de l'api
 * @param {string[]} options un tableau d'options modulant la recherche
 * @returns {Promise<IFormationCatalogue[]>}
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
}): Promise<IFormationCatalogue[]> => {
  const query: any = {}

  if (romes?.length) {
    query.rome_codes = { $in: romes }
  }

  if (romeDomain) {
    query.rome_codes = {
      $regex: new RegExp(`^${romeDomain}`, "i"),
    }
  }

  if (departement) {
    query.code_postal = {
      $regex: new RegExp(`^${departement}`, "i"),
    }
  } else if (region) {
    query.code_postal = { $in: regionCodeToDepartmentList[region].map((departement) => new RegExp(`^${departement}`)) }
  }

  const now = new Date()
  const tags = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + (now.getMonth() < 8 ? -1 : 2)]
  query.tags = { $in: tags.map((tag) => tag.toString()) }

  if (diploma) {
    query.niveau = getDiplomaIndexName(diploma)
  }

  const stages: any[] = []

  if (options.indexOf("with_description") < 0) {
    stages.push({ $project: { objectif: 0, contenu: 0 } })
  }

  stages.unshift({
    $match: query,
  })
  stages.push({
    $sample: {
      size: limit,
    },
  })

  const formations: any[] = await getDbCollection("formationcatalogues").aggregate(stages).toArray()
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
  isMinimalData,
}: {
  romes?: string[]
  romeDomain?: string
  coords?: [number, number]
  radius?: number
  diploma?: string
  maxOutLimitFormation: number
  caller?: string
  options: "with_description"[]
  isMinimalData: boolean
}): Promise<IFormationCatalogue[]> => {
  const currentRadius = radius

  const parameters = {
    romes,
    romeDomain,
    coords,
    radius: currentRadius,
    diploma,
    limit: formationResultLimit,
    caller,
    options,
    isMinimalData,
  }
  let rawFormations: IFormationCatalogue[] = await getFormations(parameters)

  // si pas de résultat on étend le rayon de recherche et on réduit le nombre de résultats autorisés
  if (rawFormations instanceof Array && rawFormations.length === 0) {
    parameters.radius = worldRadius
    parameters.limit = maxOutLimitFormation
    rawFormations = await getFormations(parameters)
  }

  rawFormations = deduplicateFormations(rawFormations)
  return rawFormations
}

/**
 * Retire les formations en doublon selon les critères arbitraires métiers visibles ci-dessous
 * @param {IFormationCatalogue[]} formations les formations issues de la recherche
 * @return {IFormationCatalogue[]}
 */
export const deduplicateFormations = (formations: IFormationCatalogue[]): IFormationCatalogue[] => {
  if (formations instanceof Array && formations.length > 0) {
    return formations.reduce((acc: any[], formation) => {
      const found = acc.find((f) => {
        return (
          f.intitule_long === formation.intitule_long &&
          f.intitule_court === formation.intitule_court &&
          f.etablissement_formateur_siret === formation.etablissement_formateur_siret &&
          f.diplome === formation.diplome &&
          f.code_postal === formation.code_postal
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
 * Retourne un ensemble de formations LbaItem à partir de formations issues de la mongo
 */
const transformFormations = (rawFormations: IFormationCatalogue[], isMinimalData: boolean): ILbaItemFormation[] => {
  const formations: ILbaItemFormation[] = []
  if (rawFormations.length) {
    const transformFct = isMinimalData ? transformFormationWithMinimalData : transformFormation
    for (let i = 0; i < rawFormations.length; ++i) {
      formations.push(transformFct(rawFormations[i]))
    }
  }

  return formations
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées des formations
 */
const transformFormation = (rawFormation: IFormationCatalogue): ILbaItemFormation => {
  const latOpt = rawFormation.lieu_formation_geopoint?.coordinates[1] ?? null
  const longOpt = rawFormation.lieu_formation_geopoint?.coordinates[0] ?? null
  const sessions = setSessions(rawFormation)
  const duration = getDurationFromSessions(sessions)

  const resultFormation: ILbaItemFormation = {
    ideaType: LBA_ITEM_TYPE_OLD.FORMATION,
    title: (rawFormation.intitule_long || rawFormation.intitule_court || rawFormation.intitule_rco) ?? null,
    longTitle: rawFormation.intitule_long ?? null,
    id: rawFormation.cle_ministere_educatif ?? null,
    idRco: rawFormation.id_formation ?? null,
    idRcoFormation: rawFormation.id_rco_formation ?? null,

    contact: {
      phone: rawFormation.num_tel ?? null,
    },

    place: {
      distance: rawFormation.distance ? roundDistance(rawFormation.distance / 1000) : rawFormation.distance === 0 ? 0 : null,
      fullAddress: getTrainingAddress(rawFormation), // adresse postale reconstruite à partir des éléments d'adresse fournis
      latitude: latOpt ?? null,
      longitude: longOpt ?? null,
      city: rawFormation.localite ?? null,
      address: `${rawFormation.lieu_formation_adresse}`,
      cedex: rawFormation.etablissement_formateur_cedex,
      zipCode: rawFormation.code_postal,
      departementNumber: rawFormation.num_departement,
      region: rawFormation.region,
      insee: rawFormation.code_commune_insee,
      remoteOnly: rawFormation.entierement_a_distance,
    },

    company: {
      name: getSchoolName(rawFormation), // pe -> entreprise.nom | formation -> etablissement_formateur_enseigne | lbb/lba -> name
      siret: rawFormation.etablissement_formateur_siret,
      id: rawFormation.etablissement_formateur_id,
      uai: rawFormation.etablissement_formateur_uai,
      headquarter: {
        // uniquement pour formation
        id: rawFormation.etablissement_gestionnaire_id ?? null,
        uai: rawFormation.etablissement_gestionnaire_uai ?? null,
        siret: rawFormation.etablissement_gestionnaire_siret ?? null,
        type: rawFormation.etablissement_gestionnaire_type ?? null,
        hasConvention: rawFormation.etablissement_gestionnaire_conventionne ?? null,
        place: {
          address: `${rawFormation.etablissement_gestionnaire_adresse}${
            rawFormation.etablissement_gestionnaire_complement_adresse ? ", " + rawFormation.etablissement_gestionnaire_complement_adresse : ""
          }`,
          cedex: rawFormation.etablissement_gestionnaire_cedex,
          zipCode: rawFormation.etablissement_gestionnaire_code_postal,
          city: rawFormation.etablissement_gestionnaire_localite,
        },
        name: rawFormation.etablissement_gestionnaire_entreprise_raison_sociale ?? null,
      },
      place: {
        city: rawFormation.etablissement_formateur_localite,
      },
    },

    target_diploma_level: rawFormation.niveau ?? null,
    diploma: rawFormation.diplome ?? null,
    cleMinistereEducatif: rawFormation.cle_ministere_educatif ?? null,
    cfd: rawFormation.cfd ?? null,
    rncpCode: rawFormation.rncp_code ?? null,
    rncpLabel: rawFormation.rncp_intitule ?? null,
    rncpEligibleApprentissage: rawFormation.rncp_eligible_apprentissage,
    period: null,
    capacity: rawFormation.capacite ?? null,
    onisepUrl: rawFormation.onisep_url ?? null,

    romes: rawFormation.rome_codes && rawFormation.rome_codes.length ? rawFormation.rome_codes.map((rome) => ({ code: rome })) : null,
    training: {
      objectif: rawFormation?.objectif?.trim() ?? null,
      description: rawFormation?.contenu?.trim() ?? null,
      sessions,
      duration,
    },
  }
  return resultFormation
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées des formations
 */
const transformFormationV2 = (rawFormation: IFormationCatalogue): ILbaItemFormation2 => {
  const latOpt = rawFormation.lieu_formation_geopoint?.coordinates[1] ?? null
  const longOpt = rawFormation.lieu_formation_geopoint?.coordinates[0] ?? null

  const sessions = setSessions(rawFormation)
  const duration = getDurationFromSessions(sessions)

  const resultFormation: ILbaItemFormation2 = {
    type: LBA_ITEM_TYPE.FORMATION,
    id: rawFormation.cle_ministere_educatif!,
    contact: {
      phone: rawFormation.num_tel ?? null,
    },
    place: {
      distance: rawFormation.distance ? roundDistance(rawFormation.distance / 1000) : rawFormation.distance === 0 ? 0 : null,
      fullAddress: getTrainingAddress(rawFormation), // adresse postale reconstruite à partir des éléments d'adresse fournis
      latitude: latOpt ?? null,
      longitude: longOpt ?? null,
      city: rawFormation.localite ?? null,
      address: `${rawFormation.lieu_formation_adresse}`,
      cedex: rawFormation.etablissement_formateur_cedex,
      zipCode: rawFormation.code_postal,
      departementNumber: rawFormation.num_departement,
      region: rawFormation.region,
      insee: rawFormation.code_commune_insee,
      remoteOnly: rawFormation.entierement_a_distance,
    },
    company: {
      name: getSchoolName(rawFormation), // pe -> entreprise.nom | formation -> etablissement_formateur_enseigne | lbb/lba -> name
      siret: rawFormation.etablissement_formateur_siret,
      uai: rawFormation.etablissement_formateur_uai,
      headquarter: {
        // uniquement pour formation
        id: rawFormation.etablissement_gestionnaire_id ?? null,
        uai: rawFormation.etablissement_gestionnaire_uai ?? null,
        siret: rawFormation.etablissement_gestionnaire_siret ?? null,
        type: rawFormation.etablissement_gestionnaire_type ?? null,
        hasConvention: rawFormation.etablissement_gestionnaire_conventionne ?? null,
        place: {
          address: `${rawFormation.etablissement_gestionnaire_adresse}${
            rawFormation.etablissement_gestionnaire_complement_adresse ? ", " + rawFormation.etablissement_gestionnaire_complement_adresse : ""
          }`,
          cedex: rawFormation.etablissement_gestionnaire_cedex,
          zipCode: rawFormation.etablissement_gestionnaire_code_postal,
          city: rawFormation.etablissement_gestionnaire_localite,
        },
        name: rawFormation.etablissement_gestionnaire_entreprise_raison_sociale ?? null,
      },
      place: {
        city: rawFormation.etablissement_formateur_localite,
      },
    },
    training: {
      title: (rawFormation.intitule_long || rawFormation.intitule_court || rawFormation.intitule_rco) ?? null,
      idRco: rawFormation.id_formation ?? null,
      cleMinistereEducatif: rawFormation.cle_ministere_educatif ?? null,
      target_diploma_level: rawFormation.niveau ?? null,
      diploma: rawFormation.diplome ?? null,
      cfd: rawFormation.cfd ?? null,
      rncpCode: rawFormation.rncp_code ?? null,
      rncpLabel: rawFormation.rncp_intitule ?? null,
      onisepUrl: rawFormation.onisep_url ?? null,
      romes: rawFormation.rome_codes && rawFormation.rome_codes.length ? rawFormation.rome_codes.map((rome) => ({ code: rome })) : null,

      objectif: rawFormation?.objectif?.trim() ?? null,
      description: rawFormation?.contenu?.trim() ?? null,
      sessions,
      duration,
    },
  }
  return resultFormation
}

const transformFormationWithMinimalDataV2 = (rawFormation: IFormationCatalogue): ILbaItemFormation2 => {
  const latOpt = rawFormation.lieu_formation_geopoint?.coordinates[1] ?? null
  const longOpt = rawFormation.lieu_formation_geopoint?.coordinates[0] ?? null

  const resultFormation: ILbaItemFormation2 = {
    type: LBA_ITEM_TYPE.FORMATION,
    id: rawFormation.cle_ministere_educatif!,
    place: {
      distance: rawFormation.distance ? roundDistance(rawFormation.distance / 1000) : rawFormation.distance === 0 ? 0 : null,
      fullAddress: getTrainingAddress(rawFormation), // adresse postale reconstruite à partir des éléments d'adresse fournis
      latitude: latOpt ?? null,
      longitude: longOpt ?? null,
      city: rawFormation.localite ?? null,
      zipCode: rawFormation.code_postal,
      insee: rawFormation.code_commune_insee,
    },
    company: {
      name: getSchoolName(rawFormation), // pe -> entreprise.nom | formation -> etablissement_formateur_enseigne | lbb/lba -> name
      siret: rawFormation.etablissement_formateur_siret,
      headquarter: {
        siret: rawFormation.etablissement_gestionnaire_siret ?? null,
      },
    },
    training: {
      title: (rawFormation.intitule_long || rawFormation.intitule_court || rawFormation.intitule_rco) ?? null,
      cleMinistereEducatif: rawFormation.cle_ministere_educatif ?? null,
    },
  }
  return resultFormation
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées des formations
 */
const transformFormationWithMinimalData = (rawFormation: IFormationCatalogue): ILbaItemFormation => {
  const latOpt = rawFormation.lieu_formation_geopoint?.coordinates[1] ?? null
  const longOpt = rawFormation.lieu_formation_geopoint?.coordinates[0] ?? null

  const resultFormation: ILbaItemFormation = {
    ideaType: LBA_ITEM_TYPE_OLD.FORMATION,
    title: (rawFormation.intitule_long || rawFormation.intitule_court || rawFormation.intitule_rco) ?? null,
    id: rawFormation.cle_ministere_educatif ?? null,

    place: {
      distance: rawFormation.distance ? roundDistance(rawFormation.distance / 1000) : rawFormation.distance === 0 ? 0 : null,
      fullAddress: getTrainingAddress(rawFormation), // adresse postale reconstruite à partir des éléments d'adresse fournis
      latitude: latOpt ?? null,
      longitude: longOpt ?? null,
      city: rawFormation.localite ?? null,
      zipCode: rawFormation.code_postal,
      insee: rawFormation.code_commune_insee,
    },

    company: {
      name: getSchoolName(rawFormation), // pe -> entreprise.nom | formation -> etablissement_formateur_enseigne | lbb/lba -> name
      siret: rawFormation.etablissement_formateur_siret,
      headquarter: {
        siret: rawFormation.etablissement_gestionnaire_siret ?? null,
      },
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
  if (date_debut?.length && date_debut?.length === date_fin?.length && date_debut?.length === modalites_entrees_sorties?.length) {
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
 * Calcule la durée d'une formation en jour sur la base
 * des dates de début et de fin de la première session à venir
 */
const getDurationFromSessions = (sessions: ILbaItemTrainingSession[]): number | null => {
  const session = sessions.at(0)
  let duration: number | null = null
  if (session) {
    duration = dayjs(session.endDate).diff(dayjs(session.startDate), "day")
  }

  return duration
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
  isMinimalData,
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
  isMinimalData: boolean
}): Promise<IApiError | { results: ILbaItemFormation[] }> => {
  const parameterControl = await formationsQueryValidator({ romes, longitude, latitude, radius, diploma, romeDomain, caller, referer })

  if ("error" in parameterControl) {
    return parameterControl
  }

  try {
    const rawFormations = await getAtLeastSomeFormations({
      romes: parameterControl.romes?.split(","),
      coords: longitude !== undefined && latitude !== undefined ? [longitude, latitude] : undefined,
      radius,
      diploma: diploma,
      maxOutLimitFormation: 5,
      romeDomain,
      caller,
      options: options === "with_description" ? ["with_description"] : [],
      isMinimalData,
    })
    const formations = transformFormations(rawFormations, isMinimalData)
    sortFormations(formations)
    return { results: formations }
  } catch (err) {
    sentryCaptureException(err)
    if (caller) {
      trackApiCall({ caller, api_path: api, response: "Error" })
    }
    return { error: "internal_error" }
  }
}

export const getFormationsV2 = async ({
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
  isMinimalData,
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
  api: string
  isMinimalData: boolean
}): Promise<ILbaItemFormation2[]> => {
  try {
    const parameterControl = await formationsQueryValidator({ romes, longitude, latitude, radius, diploma, romeDomain, caller, referer })
    if ("error" in parameterControl) {
      switch (parameterControl.error) {
        case "wrong_parameters":
          throw badRequest("wrong_parameters", parameterControl)
        default:
          assertUnreachable(parameterControl.error)
      }
    }
    const rawFormations = await getAtLeastSomeFormations({
      romes: parameterControl.romes?.split(","),
      coords: longitude !== undefined && latitude !== undefined ? [longitude, latitude] : undefined,
      radius,
      diploma: diploma,
      maxOutLimitFormation: 5,
      romeDomain,
      caller,
      options: options === "with_description" ? ["with_description"] : [],
      isMinimalData,
    })
    const formations = (rawFormations || []).map(isMinimalData ? transformFormationWithMinimalDataV2 : transformFormationV2)
    sortFormations(formations)
    if (caller) {
      trackApiCall({
        caller: caller,
        api_path: api,
        training_count: formations.length,
        result_count: formations.length,
        response: "OK",
      })
    }
    return formations
  } catch (err) {
    if (caller) {
      trackApiCall({ caller, api_path: api, response: "Error" })
    }
    throw err
  }
}

/**
 * Retourne une formation identifiée par son id
 */
export const getFormationQuery = async ({ id }: { id: string }): Promise<{ results: ILbaItemFormation[] }> => {
  const formation = await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif: id })
  const formations = formation ? [transformFormation(formation)] : []
  return { results: formations }
}

export const getFormationByCleME = async (id: string): Promise<ILbaItemFormation2> => {
  const result = await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif: id })
  if (!result) {
    throw badRequest("Formation not found")
  }
  return transformFormationV2(result)
}

/**
 * Retourne une formation identifiée par son id
 */
export const getFormationv2 = async ({ id }: { id: string }): Promise<ILbaItemFormation2 | null> => {
  const formation = await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif: id })
  if (!formation) {
    return null
  }
  return transformFormationV2(formation)
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
    const rawFormations = await getRegionFormations({
      romes: romes ? romes.split(",") : [],
      region: region,
      departement: departement,
      diploma: diploma,
      romeDomain: romeDomain,
      caller: caller,
      options: options === "with_description" ? ["with_description"] : [],
    })

    const formations = transformFormations(rawFormations, false)
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
 * Retourne les formations matchant les critères dans la requête
 * TODO: déporter les ctrls dans le controller, appeler directement getRegionFormations depuis le controller
 */
export const getFormationsParRegionV2 = async ({
  romes,
  departement,
  region,
  diploma,
  romeDomain,
  caller,
  referer,
  withDescription,
  apiPath,
}: {
  romes?: string
  departement?: string
  region?: string
  diploma?: string
  romeDomain?: string
  caller?: string
  withDescription?: boolean
  referer?: string
  apiPath: string
}): Promise<ILbaItemFormation2[]> => {
  try {
    const queryValidationResult = formationsRegionQueryValidator({ romes, departement, region, diploma, romeDomain, caller, referer })
    if ("error" in queryValidationResult) {
      switch (queryValidationResult.error) {
        case "wrong_parameters":
          throw badRequest("wrong_parameters", queryValidationResult)
        default:
          assertUnreachable(queryValidationResult.error)
      }
    }
    const rawFormations = await getRegionFormations({
      romes: romes ? romes.split(",") : [],
      region: region,
      departement: departement,
      diploma: diploma,
      romeDomain: romeDomain,
      caller: caller,
      options: withDescription ? ["with_description"] : [],
    })
    const formations = rawFormations.map(transformFormationV2)
    sortFormations(formations)
    if (caller) {
      trackApiCall({
        caller: caller,
        api_path: apiPath,
        training_count: formations.length,
        result_count: formations.length,
        response: "OK",
      })
    }
    return formations
  } catch (err) {
    if (caller) {
      trackApiCall({ caller, api_path: apiPath, response: "Error" })
    }
    throw err
  }
}

/**
 * tri alphabétique de formations sur le title (primaire) ou le company.name (secondaire )
 * lorsque les formations ne sont pas déjà triées sur la distance par rapport à un point de recherche
 */
const sortFormations = (formations: { title?: string | null; company?: { name?: string | null } | null; place?: { distance?: number | null } | null }[]) => {
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

export const getMostFrequentEmailByGestionnaireSiret = async (
  etablissement_gestionnaire_siret: string | undefined,
  type: "email" | "etablissement_gestionnaire_courriel"
): Promise<string | null> => {
  let formations

  if (type === "email") {
    formations = await getDbCollection("formationcatalogues")
      .find(
        {
          email: { $ne: null },
          etablissement_gestionnaire_siret,
        },
        { projection: { email: 1 } }
      )
      .toArray()
  } else {
    formations = await getDbCollection("formationcatalogues")
      .find(
        {
          etablissement_gestionnaire_courriel: { $ne: null },
          etablissement_gestionnaire_siret,
        },
        { projection: { etablissement_gestionnaire_courriel: 1 } }
      )
      .toArray()
  }

  const mostFrequentEmail = chain(formations)
    .groupBy(type)
    .map((group, email) => ({ email, count: group.length }))
    .orderBy("count", "desc")
    .value()

  return await findFirstNonBlacklistedEmail(mostFrequentEmail)
}

export const findFirstNonBlacklistedEmail = async (emails) => {
  for (const { email } of emails) {
    if (isValidEmail(email) && !(await isEmailBlacklisted(email))) {
      return email
    }
  }
  return null // All emails are blacklisted
}

/**
 * retire les codes romes qui se terminent par 00 ou font moins de 5 caractères
 */
export const filterWrongRomes = (formation) => {
  formation.rome_codes = formation.rome_codes.filter((rome_code) => rome_code.length === 5 && !rome_code.endsWith("00"))
}
