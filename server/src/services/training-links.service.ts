import { getDistance } from "geolib"
import type { IFormationCatalogue } from "shared/models/index"
import { URL } from "url"
import z from "zod"
import { asyncForEachGrouped } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config.js"
import { getCommuneByCodeInsee, getCommuneByCodePostal, getCommunePrincipaleByCodesDepartement } from "./referentiel/commune/commune.referentiel.service"
import { loadRomeLabelByCode, resolveRomeLabels } from "./search/search-items.service"

interface IWish {
  id: string
  cle_ministere_educatif?: string | null
  mef?: string | null
  cfd?: string | null
  rncp?: string | null
  code_postal?: string | null
  uai?: string | null
  uai_lieu_formation?: string | null
  uai_formateur?: string | null
  uai_formateur_responsable?: string | null
  code_insee?: string | null
  utm_data?: {
    utm_source: string
    utm_medium: string
    utm_campaign: string
  }
}

interface ILinks {
  id: string
  lien_prdv: string
  lien_lba: string
}

const defaultUtmData = { utm_source: "lba", utm_medium: "email", utm_campaign: "promotion-emploi-jeunes-voeux" }

const buildEmploiUrl = ({ baseUrl = `${config.publicUrl}/recherche?mode=emplois`, params }: { baseUrl?: string; params: Record<string, string | null | undefined> }) => {
  const url = new URL(baseUrl)

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value)
  })
  return url.toString()
}

// lieu_formation_geopoint.coordinates is a GeoJSON Point: [longitude, latitude]
const getFormationCoordinates = (formation: IFormationCatalogue): { latitude: string | null; longitude: string | null } => {
  const coordinates = formation.lieu_formation_geopoint?.coordinates
  if (!coordinates) return { latitude: null, longitude: null }
  const [longitude, latitude] = coordinates
  return { latitude: latitude.toString(), longitude: longitude.toString() }
}

// Préfère le libellé ROME (signal le plus boosté côté recherche, cf. rome_labels) et ne retombe
// sur l'intitulé de formation que si aucun code ROME n'est résolu, pour éviter les 0 résultat
// sur les intitulés longs (au-delà de 4 termes utiles, 75% de couverture est exigée).
const getFormationSearchLabel = (formation: IFormationCatalogue, romeLabelByCode: Map<string, string>): string | null => {
  const [romeLabel] = resolveRomeLabels(formation.rome_codes, romeLabelByCode)
  return romeLabel ?? formation.intitule_long ?? null
}

const getFormations = (
  query: object,
  projection: object = {
    localite: 1,
    intitule_long: 1,
    lieu_formation_geopoint: 1,
    rome_codes: 1,
    cle_ministere_educatif: 1,
    _id: 0,
  }
) => getDbCollection("formationcatalogues").find(query, { projection }).toArray()

// Normalisation ligne à ligne des identifiants reçus : chaque champ est validé indépendamment et
// un champ invalide est nullifié, sans faire échouer la ligne ni le lot.
const zWishText = z.string().trim().min(1)

// Le catalogue indexe bcn_mefs_10.mef10 sur 10 chiffres. Les sources (Affelnet notamment) envoient
// un MEF à 11 caractères, voire des libellés ("AFFECTATION") : on ne conserve que les 10 premiers
// chiffres et on nullifie toute valeur non numérique, qui ne pourrait jamais matcher.
const zWishMef = z
  .string()
  .trim()
  .regex(/^\d{10,11}$/)
  .transform((mef) => mef.slice(0, 10))

const wishFieldSchemas = {
  cle_ministere_educatif: zWishText,
  mef: zWishMef,
  cfd: zWishText,
  rncp: zWishText,
  code_postal: zWishText,
  code_insee: zWishText,
  uai_formateur: zWishText,
  uai_formateur_responsable: zWishText,
} satisfies Partial<Record<keyof IWish, z.ZodType<string>>>

type ISanitizedWishField = keyof typeof wishFieldSchemas

export const sanitizeWish = (wish: IWish): IWish => {
  const sanitizedFields = Object.fromEntries(
    Object.entries(wishFieldSchemas).map(([field, schema]) => {
      const value = wish[field as ISanitizedWishField]
      const result = value == null ? null : schema.safeParse(value)
      return [field, result?.success ? result.data : null]
    })
  ) as Record<ISanitizedWishField, string | null>

  return { ...wish, ...sanitizedFields }
}

const getTrainingsFromParameters = async (wish: IWish, formationsByCle?: Map<string, IFormationCatalogue[]>): Promise<IFormationCatalogue[]> => {
  if (wish.cle_ministere_educatif) {
    const formations = formationsByCle ? (formationsByCle.get(wish.cle_ministere_educatif) ?? []) : await getFormations({ cle_ministere_educatif: wish.cle_ministere_educatif })
    if (formations.length) return formations
  }

  const identifierClauses: object[] = []
  if (wish.cfd) identifierClauses.push({ cfd: wish.cfd })
  if (wish.rncp) identifierClauses.push({ rncp_code: wish.rncp })
  if (wish.mef) identifierClauses.push({ "bcn_mefs_10.mef10": wish.mef })
  // Sans identifiant de formation, aucune recherche : l'UAI seul retiendrait un métier arbitraire
  // parmi ceux de l'établissement.
  if (!identifierClauses.length) return []
  const identifierQuery = { $or: identifierClauses }

  const uaiQueries: object[] = []
  if (wish.uai_formateur) uaiQueries.push({ etablissement_formateur_uai: wish.uai_formateur })
  if (wish.uai_formateur_responsable) uaiQueries.push({ etablissement_gestionnaire_uai: wish.uai_formateur_responsable })

  // Précédence : UAI formateur + identifiants > UAI gestionnaire + identifiants > identifiants seuls,
  // sur tout le catalogue. Un établissement qui n'a pas la formation au catalogue ne doit pas
  // empêcher de retrouver le métier visé.
  const candidateQueries = [...uaiQueries.map((uaiQuery) => ({ ...uaiQuery, ...identifierQuery })), identifierQuery]

  for (const query of candidateQueries) {
    const formations = await getFormations(query)
    if (formations.length) return formations
  }

  return []
}

const getPrdvLink = async (wish: IWish, eligibleCles?: Set<string>): Promise<string> => {
  if (!wish.cle_ministere_educatif) {
    return ""
  }

  const utmParams = wish.utm_data ? wish.utm_data : defaultUtmData

  const isEligible = eligibleCles
    ? eligibleCles.has(wish.cle_ministere_educatif)
    : Boolean(
        await getDbCollection("eligible_trainings_for_appointments").findOne(
          {
            cle_ministere_educatif: wish.cle_ministere_educatif,
            lieu_formation_email: { $ne: null, $exists: true, $not: /^$/ },
          },
          { projection: { _id: 1 } }
        )
      )

  if (isEligible) {
    return buildEmploiUrl({
      baseUrl: `${config.publicUrl}/rdva`,
      params: { referrer: "lba", cleMinistereEducatif: wish.cle_ministere_educatif, ...utmParams },
    })
  }

  return ""
}

type ICommuneCoords = { latitude: string | null; longitude: string | null; lieuLabel: string | null }

// Un code postal ou INSEE à 4 chiffres a perdu son zéro initial dans un export tableur : "6000" → "06000".
const normalizeCommuneCode = (code: string | null | undefined): string | null => {
  const trimmed = code?.trim()
  if (!trimmed) return null
  return /^\d{4}$/.test(trimmed) ? `0${trimmed}` : trimmed
}

// Département(s) à interroger pour un code postal ou INSEE : trois caractères outre-mer (97x, 98x),
// 2A / 2B pour la Corse (code postal 20xxx ou code INSEE 2Axxx / 2Bxxx), deux chiffres sinon.
const getCodesDepartement = (code: string): string[] => {
  if (/^2[AB]/i.test(code)) return [code.slice(0, 2).toUpperCase()]
  if (code.startsWith("20")) return ["2A", "2B"]
  if (/^9[78]/.test(code)) return [code.slice(0, 3)]
  return [code.slice(0, 2)]
}

async function findWishCommune(wish: IWish): Promise<ICommuneCoords> {
  const codeInsee = normalizeCommuneCode(wish.code_insee)
  const codePostal = normalizeCommuneCode(wish.code_postal)

  const resolve = async (): Promise<{ centre: { coordinates: [number, number] }; nom: string } | null> => {
    if (codeInsee) {
      const commune = await getCommuneByCodeInsee(codeInsee)
      if (commune) return commune
    }

    if (codePostal) {
      const commune = await getCommuneByCodePostal(codePostal)
      if (commune) return commune
    }

    const code = codeInsee || codePostal
    if (!code) return null

    const generalPostCode = code.replace(/\d{3}$/, "000")
    const byCodeInsee = await getCommuneByCodeInsee(generalPostCode)
    if (byCodeInsee) return byCodeInsee
    const byCodePostal = await getCommuneByCodePostal(generalPostCode)
    if (byCodePostal) return byCodePostal

    // Code inconnu du référentiel (CEDEX, code obsolète) et pas de XX000 (Paris, Marseille, Lyon…) :
    // commune principale du département plutôt qu'un renvoi vers l'accueil.
    return getCommunePrincipaleByCodesDepartement(getCodesDepartement(code))
  }

  const commune = await resolve()
  if (!commune) return { latitude: null, longitude: null, lieuLabel: null }
  // GeoJSON coordinates are in [longitude, latitude] format
  return { latitude: commune.centre.coordinates[1].toString(), longitude: commune.centre.coordinates[0].toString(), lieuLabel: commune.nom }
}

// Ordre stable indépendant de l'ordre naturel Mongo : évite qu'un choix arbitraire entre
// plusieurs formations candidates ne change silencieusement d'un run à l'autre.
const sortFormationsDeterministically = (formations: IFormationCatalogue[]): IFormationCatalogue[] =>
  [...formations].sort((a, b) => (a.cle_ministere_educatif ?? "").localeCompare(b.cle_ministere_educatif ?? ""))

export const getLBALink = async (wish: IWish, formationsByCle?: Map<string, IFormationCatalogue[]>, romeLabelByCode?: Map<string, string>): Promise<string> => {
  const formations = await getTrainingsFromParameters(wish, formationsByCle)
  const utmParams = wish.utm_data ? wish.utm_data : defaultUtmData

  // Résolue au plus une fois par vœu, seulement si un des cas ci-dessous en a besoin.
  let communePromise: Promise<ICommuneCoords> | null = null
  const getWishCommune = () => (communePromise ??= findWishCommune(wish))

  if (!formations?.length) {
    // No formation found: fall back to a location-only search
    const { latitude, longitude, lieuLabel } = await getWishCommune()
    if (latitude && longitude) {
      return buildEmploiUrl({ params: { lieu_label: lieuLabel, latitude, longitude, radius: "60", search_source: "training_links", ...utmParams } })
    }
    return buildEmploiUrl({ baseUrl: config.publicUrl, params: { search_source: "training_links", ...utmParams } })
  }

  const sortedFormations = sortFormationsDeterministically(formations)
  let formation = sortedFormations[0]

  // Pick the formation closest to the wish's location when several match
  if (sortedFormations.length > 1) {
    const { latitude: wLat, longitude: wLon } = await getWishCommune()
    if (wLat && wLon) {
      formation = sortedFormations.reduce(
        (closest, current) => {
          const { latitude: cLat, longitude: cLon } = getFormationCoordinates(current)
          if (!cLat || !cLon) return closest
          const currentDist = getDistance({ latitude: wLat, longitude: wLon }, { latitude: cLat, longitude: cLon })
          return currentDist < closest.distance! ? { ...current, distance: currentDist } : closest
        },
        { distance: Infinity, ...formation }
      )
    }
  }

  const q = getFormationSearchLabel(formation, romeLabelByCode ?? (await loadRomeLabelByCode()))

  // La localisation du lien vient uniquement du vœu (code_insee / code_postal), jamais de la
  // formation retenue : elle peut être loin du candidat (repli sur les identifiants seuls) alors
  // qu'il cherche un emploi près de chez lui. Sans commune connue, recherche sur le métier seul.
  const { latitude, longitude, lieuLabel } = await getWishCommune()
  const locationParams = latitude && longitude ? { lieu_label: lieuLabel, latitude, longitude, radius: "60" } : {}

  return buildEmploiUrl({ params: { q, ...locationParams, search_source: "training_links", ...utmParams } })
}

export const getTrainingLinks = async (params: IWish[]): Promise<ILinks[]> => {
  const wishes = params.map(sanitizeWish)
  const cles = [...new Set(wishes.map((w) => w.cle_ministere_educatif).filter(Boolean) as string[])]

  const [eligibleTrainings, allFormations, romeLabelByCode] = await Promise.all([
    cles.length
      ? getDbCollection("eligible_trainings_for_appointments")
          .find({ cle_ministere_educatif: { $in: cles }, lieu_formation_email: { $ne: null, $exists: true, $not: /^$/ } }, { projection: { _id: 0, cle_ministere_educatif: 1 } })
          .toArray()
      : Promise.resolve([]),
    cles.length
      ? getDbCollection("formationcatalogues")
          .find(
            { cle_ministere_educatif: { $in: cles } },
            { projection: { localite: 1, intitule_long: 1, lieu_formation_geopoint: 1, rome_codes: 1, cle_ministere_educatif: 1, _id: 0 } }
          )
          .toArray()
      : Promise.resolve([]),
    loadRomeLabelByCode(),
  ])

  const eligibleCles = new Set(eligibleTrainings.map((f) => f.cle_ministere_educatif as string))

  const formationsByCle = new Map<string, IFormationCatalogue[]>()
  for (const formation of allFormations) {
    const cle = formation.cle_ministere_educatif as string
    if (!formationsByCle.has(cle)) formationsByCle.set(cle, [])
    formationsByCle.get(cle)!.push(formation)
  }

  // Traitement par groupes parallèles : chaque vœu ne fait que des lectures Mongo et les
  // structures partagées sont en lecture seule. L'écriture indexée préserve l'ordre d'entrée.
  const results: ILinks[] = new Array(wishes.length)
  await asyncForEachGrouped(wishes, 10, async (training, index) => {
    const [lien_prdv, lien_lba] = await Promise.all([getPrdvLink(training, eligibleCles), getLBALink(training, formationsByCle, romeLabelByCode)])
    results[index] = { id: training.id, lien_prdv, lien_lba }
  })

  return results
}
