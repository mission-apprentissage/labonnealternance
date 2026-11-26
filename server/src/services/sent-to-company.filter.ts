/**
 * Candidature réellement transmise au recruteur : son mail est parti, donc l'antivirus est passé (cf. processApplicationEmails).
 * Avant, elle est encore dans le circuit d'envoi et n'est ni affichée ni comptée dans l'espace pro (#5769).
 * Module sans dépendance : formulaire.service le lit au chargement, application.service l'importerait en cycle.
 */
export const SENT_TO_COMPANY_FILTER = { to_company_message_id: { $nin: [null, ""] } } as const
