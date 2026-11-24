export const REASON_AUTRE = "Autre"

export type IUnsubscribeFormValues = { email: string; reason: string; reason_detail: string }

// Le champ de précision n'est affiché qu'avec « Autre » : une saisie faite avant de changer de motif n'est pas envoyée.
export const toUnsubscribeBody = ({ email, reason, reason_detail }: IUnsubscribeFormValues) => ({
  email,
  reason,
  reason_detail: reason === REASON_AUTRE ? reason_detail : undefined,
})
