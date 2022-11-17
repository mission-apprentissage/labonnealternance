const emailStatus = {
  request: "Envoyé",
  click: "Clické",
  deferred: "Différé",
  delivered: "Délivré",
  soft_bounce: "Rejecté (soft)",
  spam: "Spam",
  unique_opened: "Ouverture unique",
  hard_bounce: "Rejeté (hard)",
  unsubscribed: "Désinscrit",
  opened: "Ouvert",
  invalid_email: "Email invalide",
  blocked: "Bloqué",
  error: "Erreur",
}

/**
 * @description Returns email status.
 * @param {string} status - Status stored in database
 * @return {string}
 */
const getEmailStatus = (status) => emailStatus[status] || "N/C"

export { getEmailStatus }
