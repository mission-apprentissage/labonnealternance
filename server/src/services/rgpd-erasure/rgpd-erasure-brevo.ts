import brevo from "@getbrevo/brevo"
import { internal } from "@hapi/boom"

import config from "@/config"
import { describeBrevoError } from "@/services/brevo.service"

import type { IRgpdStep } from "./rgpd-erasure-steps"

/**
 * Le compte Brevo est partagé entre les environnements (#5649) : hors production, un e-mail de recette
 * pourrait désigner un vrai contact. L'étape n'est donc exécutée qu'en production.
 */
export const isBrevoErasureEnabled = () => config.env === "production"

/** Supprime le contact Brevo désigné par son e-mail. Renvoie 0 si le contact n'existe pas. */
export const deleteBrevoContactByEmail = async (email: string): Promise<number> => {
  const client = new brevo.ContactsApi()
  client.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.brevo.apiKey)
  try {
    await client.deleteContact(email)
    return 1
  } catch (error) {
    const { status } = describeBrevoError(error)
    if (status === 404) return 0
    // Statut seul : le message est tracé dans rgpd_erasures, et l'erreur brute comme le message Brevo peuvent citer l'e-mail.
    throw internal(`suppression du contact Brevo en échec (statut ${status ?? "inconnu"})`)
  }
}

export const buildBrevoStep = (email: string): IRgpdStep => ({
  collection: "brevo",
  action: isBrevoErasureEnabled() ? "Suppression du contact (listes et campagnes)" : "Ignoré hors production (compte Brevo partagé)",
  count: async () => null,
  run: async () => (isBrevoErasureEnabled() ? deleteBrevoContactByEmail(email) : null),
  optional: true,
})
