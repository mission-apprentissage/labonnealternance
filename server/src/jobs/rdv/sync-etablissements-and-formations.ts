import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { AnyBulkWriteOperation } from "mongodb"
import { MongoBulkWriteError, ObjectId } from "mongodb"
import type { IEligibleTrainingsForAppointment, IFormationCatalogue } from "shared"
import { referrers } from "shared/constants/referers"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getEmailForRdv } from "@/services/eligible-trainings-for-appointment.service"
import { findFirstNonBlacklistedEmail } from "@/services/formation.service"

/**
 * Champs de formationcatalogues réellement consommés ici. Sans projection le curseur tire aussi le
 * lieu_formation_geopoint, les rome_codes et les bcn_mefs_10 sur toute la collection : trafic réseau
 * et décodage BSON inutiles.
 */
const FORMATION_PROJECTION = {
  cle_ministere_educatif: 1,
  etablissement_gestionnaire_siret: 1,
  etablissement_gestionnaire_courriel: 1,
  etablissement_formateur_siret: 1,
  etablissement_formateur_adresse: 1,
  etablissement_formateur_code_postal: 1,
  etablissement_formateur_localite: 1,
  etablissement_formateur_nom_departement: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  lieu_formation_adresse: 1,
  localite: 1,
  code_postal: 1,
  email: 1,
  cfd: 1,
  intitule_long: 1,
  published: 1,
  parcoursup_id: 1,
  parcoursup_visible: 1,
  affelnet_visible: 1,
  id_rco_formation: 1,
} as const

const ETABLISSEMENT_PROJECTION = {
  premium_affelnet_activation_date: 1,
  optout_refusal_date: 1,
  optout_activation_date: 1,
  premium_refusal_date: 1,
  premium_activation_date: 1,
  premium_affelnet_refusal_date: 1,
  gestionnaire_email: 1,
} as const

/** Le job faisait une écriture unitaire par formation sur eligible_trainings_for_appointments. */
const BULK_SIZE = 500

/**
 * Le job parcourt tout le catalogue : une erreur isolée sur une formation ne doit pas perdre le
 * travail déjà fait (l'ancien `callback(err)` avortait tout le pipeline). Au-delà de ce nombre
 * d'erreurs consécutives on considère la panne systémique et on arrête.
 */
const MAX_CONSECUTIVE_ERRORS = 50

type IFormationEmailFields = Pick<IFormationCatalogue, "email" | "etablissement_gestionnaire_courriel" | "etablissement_gestionnaire_siret">

const isSet = (value: unknown) => value !== null && value !== undefined

const cacheKey = (...parts: unknown[]) => JSON.stringify(parts)

export const syncEtablissementsAndFormations = async () => {
  logger.info("Cron #syncEtablissementsAndFormations started.")

  // Horodatage unique pour tout le run : last_catalogue_sync_date devient un vrai marqueur de
  // passage, homogène sur l'ensemble des documents touchés.
  const syncedAt = new Date()

  // `read` compte les formations sorties du curseur. C'est le seul dénominateur juste : une
  // formation peut être comptée dans `processed` (son opération a été mise en file) puis dans
  // `errors` si le lot rejette cette opération, donc `processed + errors` sur-compte.
  const stats = { read: 0, processed: 0, inserted: 0, updated: 0, errors: 0 }
  let consecutiveErrors = 0

  /**
   * getEmailForRdv ne lit que formationcatalogues et emailblacklists, deux collections que ce job
   * n'écrit pas : le résultat ne dépend que de la clé, mémoïser est sans effet de bord. C'est ce qui
   * évite de rejouer getMostFrequentEmailByGestionnaireSiret pour chaque formation d'un même
   * gestionnaire. Les caches vivent le temps du run : le coût mémoire est borné par le nombre de
   * triplets (email, courriel gestionnaire, siret gestionnaire) distincts du catalogue.
   */
  const emailRdvCache = new Map<string, string | null>()
  const gestionnaireCourrielCache = new Map<string, string | null>()

  const resolveEmailRdv = async (formation: IFormationEmailFields): Promise<string | null> => {
    const key = cacheKey(formation.email, formation.etablissement_gestionnaire_courriel, formation.etablissement_gestionnaire_siret)
    const cached = emailRdvCache.get(key)
    if (cached !== undefined) return cached

    const email = await getEmailForRdv({
      email: formation.email,
      etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel,
      etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
    })
    emailRdvCache.set(key, email)
    return email
  }

  const resolveGestionnaireCourriel = async (formation: IFormationEmailFields): Promise<string | null> => {
    const key = cacheKey(formation.etablissement_gestionnaire_courriel, formation.etablissement_gestionnaire_siret)
    const cached = gestionnaireCourrielCache.get(key)
    if (cached !== undefined) return cached

    const email = await getEmailForRdv(
      {
        etablissement_gestionnaire_courriel: formation.etablissement_gestionnaire_courriel,
        etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
      },
      "etablissement_gestionnaire_courriel"
    )
    gestionnaireCourrielCache.set(key, email)
    return email
  }

  const etfaOps: AnyBulkWriteOperation<IEligibleTrainingsForAppointment>[] = []

  /**
   * Deux documents du catalogue peuvent partager une cle_ministere_educatif (l'index n'est pas
   * unique) et, les écritures étant différées, le findOne du second ne verrait pas encore
   * l'opération mise en file par le premier. On garde une référence sur l'objet déjà en file —
   * document d'insert ou payload de `$set` — pour y réappliquer les champs au lieu d'empiler une
   * seconde opération sur le même _id. C'est ce qui rend le lot non ordonné sûr : aucune paire
   * d'opérations concurrentes sur un même document.
   */
  const queuedFieldsByCle = new Map<string, Record<string, unknown>>()

  const flushEtfaOps = async () => {
    if (etfaOps.length === 0) return
    const ops = etfaOps.splice(0, etfaOps.length)
    try {
      const result = await getDbCollection("eligible_trainings_for_appointments").bulkWrite(ops, { ordered: false })
      stats.inserted += result.insertedCount
      stats.updated += result.matchedCount
    } catch (err) {
      // En lot non ordonné, les opérations valides sont appliquées et seules les fautives remontent.
      // Un document invalide ne doit pas emporter les 499 autres, mais il doit rester compté.
      if (err instanceof MongoBulkWriteError) {
        const writeErrors = Array.isArray(err.writeErrors) ? err.writeErrors : [err.writeErrors]
        stats.inserted += err.insertedCount
        stats.updated += err.matchedCount
        stats.errors += writeErrors.length
        logger.error({ err, count: writeErrors.length }, "syncEtablissementsAndFormations: écritures rejetées dans un lot")
        return
      }
      throw err
    } finally {
      // Les opérations sont sorties de la file : les références conservées ne sont plus mutables
      // utilement, et la map reste bornée à BULK_SIZE au lieu de croître sur tout le catalogue.
      queuedFieldsByCle.clear()
    }
  }

  const readable = getDbCollection("formationcatalogues").find({}, { projection: FORMATION_PROJECTION }).stream()

  const writable = new Writable({
    objectMode: true,
    async write(formation, _encoding, callback) {
      stats.read++
      try {
        const [eligibleTrainingsForAppointment, etablissements, existInReferentielOnisep] = await Promise.all([
          getDbCollection("eligible_trainings_for_appointments").findOne(
            { cle_ministere_educatif: formation.cle_ministere_educatif },
            { projection: { lieu_formation_email: 1, is_lieu_formation_email_customized: 1 } }
          ),
          getDbCollection("etablissements").find({ gestionnaire_siret: formation.etablissement_gestionnaire_siret }, { projection: ETABLISSEMENT_PROJECTION }).toArray(),
          // Seule l'existence est utilisée en aval.
          getDbCollection("referentieloniseps").findOne({ cle_ministere_educatif: formation.cle_ministere_educatif }, { projection: { _id: 1 } }),
        ])

        const dateFlags = {
          hasPremiumAffelnetActivation: false,
          hasOptOutRefusal: false,
          hasOptOutActivation: false,
          hasPremiumRefusal: false,
          hasPremiumActivation: false,
          hasPremiumAffelnetRefusal: false,
        }
        for (const etablissement of etablissements) {
          if (isSet(etablissement.premium_affelnet_activation_date)) dateFlags.hasPremiumAffelnetActivation = true
          if (isSet(etablissement.optout_refusal_date)) dateFlags.hasOptOutRefusal = true
          if (isSet(etablissement.optout_activation_date)) dateFlags.hasOptOutActivation = true
          if (isSet(etablissement.premium_refusal_date)) dateFlags.hasPremiumRefusal = true
          if (isSet(etablissement.premium_activation_date)) dateFlags.hasPremiumActivation = true
          if (isSet(etablissement.premium_affelnet_refusal_date)) dateFlags.hasPremiumAffelnetRefusal = true
        }

        const emailArray = etablissements.map((etab) => ({ email: etab.gestionnaire_email }))
        let gestionnaireEmail = await findFirstNonBlacklistedEmail(emailArray)

        const referrersToActivate: string[] = []
        if (dateFlags.hasOptOutActivation && !dateFlags.hasOptOutRefusal) {
          referrersToActivate.push(referrers.LBA.name, referrers.JEUNE_1_SOLUTION.name)
          if (existInReferentielOnisep) referrersToActivate.push(referrers.ONISEP.name)
        }

        if (dateFlags.hasPremiumActivation && !dateFlags.hasPremiumRefusal && formation.parcoursup_visible) {
          referrersToActivate.push(referrers.PARCOURSUP.name)
        }
        if (dateFlags.hasPremiumAffelnetActivation && !dateFlags.hasPremiumAffelnetRefusal && formation.affelnet_visible) {
          referrersToActivate.push(referrers.AFFELNET.name)
        }

        // Un email personnalisé sur la fiche existante n'est jamais réécrit ; sinon on le recalcule.
        const emailRdv = eligibleTrainingsForAppointment?.is_lieu_formation_email_customized
          ? eligibleTrainingsForAppointment.lieu_formation_email
          : await resolveEmailRdv(formation)

        // Champs communs à la création et à la mise à jour. Les cinq champs propres à la création
        // (created_at, rco_formation_id, cle_ministere_educatif et les deux sirets) n'en font pas
        // partie : l'ancien `$set` ne les touchait pas non plus.
        const sharedFields = {
          training_id_catalogue: formation._id.toString(),
          lieu_formation_email: emailRdv ?? null,
          parcoursup_id: formation.parcoursup_id,
          parcoursup_visible: formation.parcoursup_visible,
          affelnet_visible: formation.affelnet_visible,
          training_code_formation_diplome: formation.cfd,
          etablissement_formateur_zip_code: formation.etablissement_formateur_code_postal,
          training_intitule_long: formation.intitule_long,
          referrers: referrersToActivate,
          is_catalogue_published: formation.published,
          last_catalogue_sync_date: syncedAt,
          lieu_formation_street: formation.lieu_formation_adresse,
          lieu_formation_city: formation.localite,
          lieu_formation_zip_code: formation.code_postal,
          etablissement_formateur_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
          etablissement_formateur_street: formation.etablissement_formateur_adresse,
          departement_etablissement_formateur: formation.etablissement_formateur_nom_departement,
          etablissement_formateur_city: formation.etablissement_formateur_localite,
        }

        const queuedFields = queuedFieldsByCle.get(formation.cle_ministere_educatif)
        if (queuedFields) {
          Object.assign(queuedFields, sharedFields)
        } else if (eligibleTrainingsForAppointment) {
          const update = { ...sharedFields }
          etfaOps.push({ updateOne: { filter: { _id: eligibleTrainingsForAppointment._id }, update: { $set: update } } })
          queuedFieldsByCle.set(formation.cle_ministere_educatif, update)
        } else {
          const document = {
            _id: new ObjectId(),
            created_at: syncedAt,
            rco_formation_id: formation.id_rco_formation,
            cle_ministere_educatif: formation.cle_ministere_educatif,
            etablissement_formateur_siret: formation.etablissement_formateur_siret,
            etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
            ...sharedFields,
          }
          etfaOps.push({ insertOne: { document } })
          queuedFieldsByCle.set(formation.cle_ministere_educatif, document)
        }

        if (etfaOps.length >= BULK_SIZE) {
          await flushEtfaOps()
        }

        if (!gestionnaireEmail) {
          gestionnaireEmail = await resolveGestionnaireCourriel(formation)
        }

        // Écriture volontairement immédiate, contrairement à eligible_trainings_for_appointments :
        // la lecture d'etablissements en tête de boucle voit les gestionnaire_email posés par les
        // formations précédentes du même gestionnaire, et différer casserait cette dépendance.
        await getDbCollection("etablissements").updateMany(
          {
            $and: [
              {
                formateur_siret: formation.etablissement_formateur_siret,
                gestionnaire_siret: formation.etablissement_gestionnaire_siret,
              },
            ],
          },
          {
            $set: {
              gestionnaire_siret: formation.etablissement_gestionnaire_siret,
              gestionnaire_email: gestionnaireEmail,
              raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
              formateur_siret: formation.etablissement_formateur_siret,
              formateur_address: formation.etablissement_formateur_adresse,
              formateur_zip_code: formation.etablissement_formateur_code_postal,
              formateur_city: formation.etablissement_formateur_localite,
              last_catalogue_sync_date: syncedAt,
            },
          },
          { upsert: true }
        )

        stats.processed++
        consecutiveErrors = 0
        callback()
      } catch (err: any) {
        stats.errors++
        consecutiveErrors++
        logger.error({ err, cle_ministere_educatif: formation?.cle_ministere_educatif }, "Erreur dans syncEtablissementsAndFormations")

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          callback(new Error(`syncEtablissementsAndFormations: ${consecutiveErrors} erreurs consécutives, arrêt`, { cause: err }))
          return
        }
        callback()
      }
    },
  })

  let runError: unknown = null
  try {
    await pipeline(readable, writable)
  } catch (err) {
    runError = err
  }

  try {
    // Le dernier lot doit partir même si le pipeline s'est arrêté sur une panne systémique.
    await flushEtfaOps()
  } catch (err) {
    if (runError) {
      // Ne pas écraser la cause racine par l'erreur du flush final.
      logger.error({ err }, "syncEtablissementsAndFormations: flush final en échec")
    } else {
      runError = err
    }
  }

  logger.info(stats, "Cron #syncEtablissementsAndFormations done.")

  if (runError) throw runError

  // Les erreurs isolées n'avortent plus le run, mais elles doivent rester visibles : le job échoue
  // après avoir traité l'intégralité du catalogue, et le check-in Sentry passe en `error`.
  if (stats.errors > 0) {
    throw new Error(`syncEtablissementsAndFormations: ${stats.errors} erreur(s) sur ${stats.read} formation(s) parcourue(s)`)
  }

  return stats
}
