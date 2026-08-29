import { notFound } from "@hapi/boom"
import { chain } from "lodash-es"
import type { IFormationCatalogue, ILbaItemFormation2 } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { referrers } from "shared/constants/referers"
import dayjs from "shared/helpers/dayjs"
import { roundDistance } from "@/common/utils/geolib"
import { isValidEmail } from "@/common/utils/is-valid-email"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { isEmailBlacklisted } from "./application.service"
import type { ILbaItemTrainingSession } from "./lbaitem.shared.service.types"

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées des formations
 */
const transformFormationV2 = (rawFormation: IFormationCatalogue, priseDeRendezVous: boolean = false): ILbaItemFormation2 => {
  const latOpt = rawFormation.lieu_formation_geopoint?.coordinates[1] ?? null
  const longOpt = rawFormation.lieu_formation_geopoint?.coordinates[0] ?? null

  const sessions = setSessions(rawFormation)
  const duration = getDurationFromSessions(sessions)

  const resultFormation: ILbaItemFormation2 = {
    type: LBA_ITEM_TYPE.FORMATION,
    id: rawFormation.cle_ministere_educatif!,
    contact: {
      phone: rawFormation.num_tel ?? null,
      hasEmail: false,
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
      elligibleForAppointment: priseDeRendezVous,
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

export const getFormationDetailByCleME = async (id: string): Promise<ILbaItemFormation2> => {
  const formation = await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif: id })
  if (!formation) {
    throw notFound("Formation not found")
  }
  const priseDeRendezVous = await getDbCollection("eligible_trainings_for_appointments").findOne({
    cle_ministere_educatif: formation.cle_ministere_educatif,
    lieu_formation_email: { $ne: null },
    referrers: { $in: [referrers.LBA.name] },
  })
  const elligileForAppointment = !!priseDeRendezVous
  return transformFormationV2(formation, elligileForAppointment)
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
        // `_id: 0` : sans lui la projection force un FETCH et l'index {etablissement_gestionnaire_siret, email} n'est pas couvrant.
        { projection: { email: 1, _id: 0 } }
      )
      .toArray()
  } else {
    formations = await getDbCollection("formationcatalogues")
      .find(
        {
          etablissement_gestionnaire_courriel: { $ne: null },
          etablissement_gestionnaire_siret,
        },
        { projection: { etablissement_gestionnaire_courriel: 1, _id: 0 } }
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
