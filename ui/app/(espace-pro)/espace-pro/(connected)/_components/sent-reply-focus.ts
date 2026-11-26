// Réponses envoyées depuis le formulaire de l'espace pro : le détail, affiché juste après, place le focus sur le bandeau
// qui confirme l'envoi (RGAA 7.5), comme l'écran de fin du formulaire ouvert depuis le mail (cf. IntentionPageResult).
const justSentReplies = new Set<string>()

export const markReplyJustSent = (applicationId: string) => {
  justSentReplies.add(applicationId)
}
export const wasReplyJustSent = (applicationId: string) => justSentReplies.has(applicationId)
export const clearReplyJustSent = (applicationId: string) => {
  justSentReplies.delete(applicationId)
}
