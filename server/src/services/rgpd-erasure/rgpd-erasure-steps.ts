import crypto from "node:crypto"

import config from "@/config"

/**
 * Une étape d'effacement. `count` et `run` partagent le même filtre : l'aperçu annonce ce que
 * l'exécution fera.
 *
 * Un échec interrompt l'effacement tant que la fiche de l'utilisateur existe encore : chaque builder
 * la supprime en dernier, pour qu'une relance retrouve tout ce qui reste à traiter.
 */
export type IRgpdStep = {
  collection: string
  action: string
  count: () => Promise<number | null>
  run: () => Promise<number | null>
  /** Service externe : son échec est consigné (statut `partial`) sans interrompre l'effacement en base. */
  optional?: boolean
}

/** Copie vers une collection anonymized_* : `$merge` ne renvoie aucun document, on compte donc la source juste avant. */
export const buildCopyStep = ({ copy, ...step }: Omit<IRgpdStep, "run"> & { copy: () => Promise<unknown> }): IRgpdStep => ({
  ...step,
  run: async () => {
    const count = await step.count()
    await copy()
    return count
  },
})

export const RGPD_GRANTED_BY = "rgpd-erasure"
export const RGPD_ANONYMIZED_VALUE = "anonymisé"

export const normalizeRgpdEmail = (email: string) => email.trim().toLowerCase()

/** Variantes recherchées : la forme normalisée, et la saisie brute pour les collections qui ne normalisent pas (`users`). */
export const getRgpdEmailVariants = (email: string) => [...new Set([normalizeRgpdEmail(email), email.trim()])]

/** HMAC et non hash simple : un sha256 d'e-mail se retrouve par dictionnaire. */
export const hashRgpdEmail = (email: string) => crypto.createHmac("sha256", config.rgpdAuditHmacSecret).update(normalizeRgpdEmail(email)).digest("hex")
