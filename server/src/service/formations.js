import Sentry from "@sentry/node"
import axios from "axios"
import crypto from "crypto"
import _ from "lodash-es"
import { getCurrentFormationsSourceCollection } from "../common/components/indexSourceFormations.js"
import { getElasticInstance } from "../common/esClient/index.js"
import { manageApiError } from "../common/utils/errorManager.js"
import { regionCodeToDepartmentList } from "../common/utils/regionInseeCodes.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { notifyToSlack } from "../common/utils/slackUtils.js"
import config from "../config.js"
import { formationMock, formationsMock, lbfFormationMock } from "../mocks/formations-mock.js"
import { itemModel } from "../model/itemModel.js"
import { formationsQueryValidator, formationsRegionQueryValidator } from "./formationsQueryValidator.js"

const formationResultLimit = 150

const lbfDescriptionUrl = "https://labonneformation.pole-emploi.fr/api/v1/detail"

const esClient = getElasticInstance()

const diplomaMap = {
  3: "3 (CAP...)",
  4: "4 (BAC...)",
  5: "5 (BTS, DEUST...)",
  6: "6 (Licence, BUT...)",
  7: "7 (Master, titre ingénieur...)",
}

const getDiplomaKey = (value) => {
  if (value) {
    return diplomaMap[value[0]]
  } else {
    return ""
  }
}

const getFormations = async ({ romes, rncps, romeDomain, coords, radius, diploma, limit, caller, api = "formationV1", useMock }) => {
  try {
    if (useMock && useMock !== "false") {
      return formationsMock
    }

    const distance = radius || 30

    const useGeoLocation = coords ? true : false
    const latitude = coords ? coords[1] : null
    const longitude = coords ? coords[0] : null

    let mustTerm = [
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

    if (rncps) {
      /*
        FIXME: En attente listing des RNCPs à jour
        mustTerm.push({
        match: {
          rncp_code: rncps.join(" "),
        },
      });*/
    }

    if (diploma) {
      mustTerm.push({
        match: {
          niveau: getDiplomaKey(diploma),
        },
      })
    }

    let esQuerySort = {
      sort: [
        useGeoLocation
          ? {
              _geo_distance: {
                idea_geo_coordonnees_etablissement: [parseFloat(longitude), parseFloat(latitude)],
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

    let esQuery = {
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
          idea_geo_coordonnees_etablissement: {
            lat: latitude,
            lon: longitude,
          },
        },
      }
    }

    const esQueryIndexFragment = getFormationEsQueryIndexFragment(limit)

    const responseFormations = await esClient.search({
      ...esQueryIndexFragment,
      body: {
        ...esQuery,
        ...esQuerySort,
      },
    })

    //throw new Error("BOOM");
    let formations = []

    responseFormations.body.hits.hits.forEach((formation) => {
      formations.push({ source: formation._source, sort: formation.sort, id: formation._id })
    })

    return formations
  } catch (error) {
    return manageApiError({
      error,
      api,
      caller,
      errorTitle: `getting trainings from Catalogue (${api})`,
    })
  }
}

const getFormation = async ({ id, caller }) => {
  try {
    let responseFormation = null

    if (id === "id-formation-test") {
      responseFormation = formationMock
    } else {
      const Formation = await getCurrentFormationsSourceCollection()
      responseFormation = await Formation.findOne({ cle_ministere_educatif: id })
    }

    //throw new Error("BOOM");
    let formations = []
    formations.push({ source: responseFormation })

    return formations
  } catch (error) {
    return manageApiError({
      error,
      api: "formationV1/formation",
      caller,
      errorTitle: "getting training by id from Catalogue",
    })
  }
}

// Charge la formation ayant l'id en paramètre
const getOneFormationFromId = async ({ id, caller }) => {
  try {
    let formation = []

    formation = await getFormation({
      id,
      caller,
    })

    if (!formation.error) {
      formation = transformFormationsForIdea(formation)
    }

    return formation
  } catch (error) {
    return manageApiError({
      error,
      api: "formationV1/formation",
      caller,
      errorTitle: "getting training by id from Catalogue",
    })
  }
}

const getRegionFormations = async ({ romes, romeDomain, region, departement, diploma, limit = formationResultLimit, caller }) => {
  try {
    let mustTerm = []

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
          niveau: getDiplomaKey(diploma),
        },
      })

    const esQueryIndexFragment = getFormationEsQueryIndexFragment(limit)

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

    let formations = []

    responseFormations.body.hits.hits.forEach((formation) => {
      formations.push({ source: formation._source, sort: formation.sort, id: formation._id })
    })

    if (formations.length === 0 && !caller) {
      await notifyToSlack({ subject: "FORMATION", message: `Aucune formation par région trouvée pour les romes ${romes} ou le domaine ${romeDomain}.` })
    }

    return formations
  } catch (error) {
    return manageApiError({
      error,
      api: "formationRegionV1",
      caller,
      errorTitle: "getting trainings by regions from Catalogue",
    })
  }
}

// tente de récupérer des formatiosn dans le rayon de recherche, si sans succès cherche les maxOutLimitFormation les plus proches du centre de recherche
const getAtLeastSomeFormations = async ({ romes, rncps, romeDomain, coords, radius, diploma, maxOutLimitFormation, caller, useMock }) => {
  try {
    let formations = []
    let currentRadius = radius
    let formationLimit = formationResultLimit

    formations = await getFormations({
      romes,
      rncps,
      romeDomain,
      coords,
      radius: currentRadius,
      diploma,
      limit: formationLimit,
      caller,
      useMock,
    })

    // si pas de résultat on étend le rayon de recherche et on réduit le nombre de résultats autorisés
    if (formations instanceof Array && formations.length === 0) {
      formationLimit = maxOutLimitFormation // limite réduite car extension au delà du rayon de recherche
      currentRadius = 20000
      formations = await getFormations({
        romes,
        rncps,
        romeDomain,
        coords,
        radius: currentRadius,
        diploma,
        limit: formationLimit,
        caller,
        useMock,
      })
    }

    if (formations?.result !== "error") {
      formations = deduplicateFormations(formations)

      //throw new Error("BANG");
      formations = transformFormationsForIdea(formations)

      sortFormations(formations)

      if (caller) {
        trackApiCall({
          caller: caller,
          api: "formationV1",
          nb_formations: formations?.results.length,
          result_count: formations?.results.length,
          result: "OK",
        })
      }
    }

    return formations
  } catch (error) {
    return manageApiError({
      error,
      api: "formationV1",
      caller,
      errorTitle: "getting trainings from Catalogue",
    })
  }
}

const deduplicateFormations = (formations) => {
  if (formations instanceof Array && formations.length > 0) {
    return formations.reduce((acc, formation) => {
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

const transformFormationsForIdea = (formations) => {
  //console.log("formations , ", formations);
  let resultFormations = {
    results: [],
  }

  if (formations.length) {
    for (let i = 0; i < formations.length; ++i) {
      resultFormations.results.push(transformFormationForIdea(formations[i]))
    }
  }

  return resultFormations
}

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformFormationForIdea = (formation) => {
  let resultFormation = itemModel("formation")

  resultFormation.title = _.get(formation, "source.intitule_long", formation.source.intitule_court)
  resultFormation.longTitle = formation.source.intitule_long
  resultFormation.diplomaLevel = formation.source.niveau
  resultFormation.onisepUrl = formation.source.onisep_url
  resultFormation.id = formation.source.cle_ministere_educatif
  resultFormation.diploma = formation.source.diplome
  resultFormation.cfd = formation.source.cfd
  resultFormation.rncpCode = formation.source.rncp_code
  resultFormation.rncpLabel = formation.source.rncp_intitule
  resultFormation.rncpEligibleApprentissage = formation.source.rncp_eligible_apprentissage
  //resultFormation.period = formation.source.periode;
  resultFormation.capacity = formation.source.capacite
  resultFormation.createdAt = formation.source.created_at
  resultFormation.lastUpdateAt = formation.source.last_update_at
  resultFormation.idRco = formation.source.id_formation
  resultFormation.idRcoFormation = formation.source.id_rco_formation
  resultFormation.cleMinistereEducatif = formation.source.cle_ministere_educatif

  if (formation.source.email) {
    resultFormation.contact = {
      email: formation.source.email,
    }
  }

  resultFormation.place = {
    distance: formation.sort ? formation.sort[0] : null,
    fullAddress: getTrainingAddress(formation.source), // adresse postale reconstruite à partir des éléments d'adresse fournis
    latitude: formation.source.idea_geo_coordonnees_etablissement ? formation.source.idea_geo_coordonnees_etablissement.split(",")[0] : null,
    longitude: formation.source.idea_geo_coordonnees_etablissement ? formation.source.idea_geo_coordonnees_etablissement.split(",")[1] : null,
    //city: formation.source.etablissement_formateur_localite,
    city: formation.source.localite,
    address: `${formation.source.lieu_formation_adresse}`,
    cedex: formation.source.etablissement_formateur_cedex,
    zipCode: formation.source.code_postal,
    //trainingZipCode: formation.source.code_postal,
    departementNumber: formation.source.num_departement,
    region: formation.source.region,
    insee: formation.source.code_commune_insee,
  }

  resultFormation.company = {
    name: getTrainingSchoolName(formation.source), // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> name
    siret: formation.source.etablissement_formateur_siret,
    id: formation.source.etablissement_formateur_id,
    uai: formation.source.etablissement_formateur_uai,
    headquarter: {
      // uniquement pour formation
      id: formation.source.etablissement_gestionnaire_id,
      uai: formation.source.etablissement_gestionnaire_uai,
      siret: formation.source.etablissement_gestionnaire_siret,
      type: formation.source.etablissement_gestionnaire_type,
      hasConvention: formation.source.etablissement_gestionnaire_conventionne,
      place: {
        address: `${formation.source.etablissement_gestionnaire_adresse}${
          formation.source.etablissement_gestionnaire_complement_adresse ? ", " + formation.source.etablissement_gestionnaire_complement_adresse : ""
        }`,
        cedex: formation.source.etablissement_gestionnaire_cedex,
        zipCode: formation.source.etablissement_gestionnaire_code_postal,
        city: formation.source.etablissement_gestionnaire_localite,
      },
      name: formation.source.etablissement_gestionnaire_entreprise_raison_sociale,
    },
    place: {
      city: formation.source.etablissement_formateur_localite,
    },
  }

  if (formation.source.rome_codes && formation.source.rome_codes.length) {
    resultFormation.romes = []

    formation.source.rome_codes.forEach((rome) => resultFormation.romes.push({ code: rome }))
  }

  return resultFormation
}

const getTrainingAddress = (school) => {
  let schoolAddress = ""

  if (school.lieu_formation_adresse) {
    schoolAddress = `${school.lieu_formation_adresse} ${school.code_postal} ${school.localite}`
  } else {
    schoolAddress = school.etablissement_formateur_adresse
      ? `${school.etablissement_formateur_adresse}${school.etablissement_formateur_complement_adresse ? `, ${school.etablissement_formateur_complement_adresse}` : ""} ${
          school.etablissement_formateur_localite ? school.etablissement_formateur_localite : ""
        } ${school.etablissement_formateur_code_postal ? school.etablissement_formateur_code_postal : ""}${
          school.etablissement_formateur_cedex ? ` CEDEX ${school.etablissement_formateur_cedex}` : ""
        }
        `
      : `${school.etablissement_gestionnaire_adresse}${school.etablissement_gestionnaire_complement_adresse ? `, ${school.etablissement_gestionnaire_complement_adresse}` : ""} ${
          school.etablissement_gestionnaire_localite ? school.etablissement_gestionnaire_localite : ""
        } ${school.etablissement_gestionnaire_code_postal ? school.etablissement_gestionnaire_code_postal : ""}${
          school.etablissement_gestionnaire_cedex ? ` CEDEX ${school.etablissement_gestionnaire_cedex}` : ""
        }
        `
  }
  return schoolAddress
}

const getTrainingSchoolName = (school) => {
  let schoolName = school.etablissement_formateur_entreprise_raison_sociale
    ? school.etablissement_formateur_entreprise_raison_sociale
    : school.etablissement_gestionnaire_entreprise_raison_sociale

  return schoolName
}

const getFormationsQuery = async (query) => {
  //console.log("query : ", query);

  const queryValidationResult = formationsQueryValidator(query)

  if (queryValidationResult.error) return queryValidationResult

  try {
    const formations = await getAtLeastSomeFormations({
      romes: query.romes ? query.romes.split(",") : null,
      rncps: query.rncps ? query.rncps.split(",") : null,
      coords: query.longitude ? [query.longitude, query.latitude] : null,
      radius: query.radius,
      diploma: query.diploma,
      maxOutLimitFormation: 5,
      romeDomain: query.romeDomain,
      caller: query.caller,
      useMock: query.useMock,
    })

    if (formations?.result === "error") {
      return { error: "internal_error" }
    }

    //throw new Error("BIG BANG");
    return formations
  } catch (err) {
    console.error("Error ", err.message)
    Sentry.captureException(err)
    if (query.caller) {
      trackApiCall({ caller: query.caller, api: "formationV1", result: "Error" })
    }
    return { error: "internal_error" }
  }
}

const getFormationQuery = async (query) => {
  try {
    const formation = await getOneFormationFromId({
      id: query.id,
      caller: query.caller,
    })

    if (formation?.result === "error") {
      return { error: "internal_error" }
    }

    if (query.caller) {
      trackApiCall({
        caller: query.caller,
        api: "formationV1/formation",
        nb_formations: 1,
        result_count: 1,
        result: "OK",
      })
    }

    //throw new Error("BIG BANG");
    return formation
  } catch (err) {
    console.error("Error ", err.message)
    Sentry.captureException(err)

    if (query.caller) {
      trackApiCall({ caller: query.caller, api: "formationV1/formation", result: "Error" })
    }

    return { error: "internal_error" }
  }
}

const getLbfQueryParams = (params) => {
  // le timestamp doit être uriencodé avec le format ISO sans les millis
  let date = new Date().toISOString()
  date = encodeURIComponent(date.substring(0, date.lastIndexOf(".")))

  let queryParams = `user=LBA&uid=${params.id}&timestamp=${date}`

  var hmac = crypto.createHmac("md5", config.laBonneFormationPassword)
  const data = hmac.update(queryParams)
  const signature = data.digest("hex")

  // le param signature doit contenir un hash des autres params chiffré avec le mdp attribué à LBA
  queryParams += "&signature=" + signature

  return queryParams
}

const getFormationDescriptionQuery = async (params) => {
  try {
    let formationDescription = null

    if (params.id === "id-formation-test") {
      formationDescription = lbfFormationMock
    } else {
      formationDescription = await axios.get(`${lbfDescriptionUrl}?${getLbfQueryParams(params)}`)
    }

    return formationDescription.data
  } catch (error) {
    manageApiError({
      error,
      errorTitle: `getting training description from Labonneformation`,
    })

    return { error: "internal_error" }
  }
}

const getFormationsParRegionQuery = async (query) => {
  const queryValidationResult = formationsRegionQueryValidator(query)

  if (queryValidationResult.error) {
    return queryValidationResult
  }

  try {
    let formations = await getRegionFormations({
      romes: query.romes ? query.romes.split(",") : null,
      region: query.region,
      departement: query.departement,
      diploma: query.diploma,
      romeDomain: query.romeDomain,
      caller: query.caller,
    })

    if (formations?.result === "error") {
      return { error: "internal_error" }
    }

    formations = transformFormationsForIdea(formations)

    sortFormations(formations)

    if (query.caller) {
      trackApiCall({
        caller: query.caller,
        api: "formationRegionV1",
        nb_formations: formations.length,
        result_count: formations.length,
        result: "OK",
      })
    }

    //throw new Error("BIG BANG");
    return formations
  } catch (err) {
    console.error("Error ", err.message)
    Sentry.captureException(err)

    if (query.caller) {
      trackApiCall({ caller: query.caller, api: "formationRegionV1", result: "Error" })
    }

    return { error: "internal_error" }
  }
}

const getFormationEsQueryIndexFragment = (limit) => {
  return {
    //index: "mnaformation",
    index: "convertedformations",
    size: limit,
    _source_includes: [
      "etablissement_formateur_siret",
      "onisep_url",
      "_id",
      "email",
      "niveau",
      "idea_geo_coordonnees_etablissement",
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
      "periode",
      "capacite",
      "id_rco_formation",
      "id_formation",
      "cle_ministere_educatif",
    ],
  }
}

const getEsRegionTermFragment = (region) => {
  let departements = []

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

const sortFormations = (formations) => {
  formations.results.sort((a, b) => {
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

export { getFormationsQuery, getFormationQuery, getFormationsParRegionQuery, transformFormationsForIdea, getFormations, deduplicateFormations, getFormationDescriptionQuery }
