/**
 * Raisons des rôles validés ou mis en attente par la validation automatique (#5409), lues par l'alerte #5411.
 * Les raisons antérieures ne sont pas réécrites : `validaton par : BAL` n'enregistrait ni source ni correspondance,
 * `validaton par : bonnes boites ou referentiel opco` couvrait aussi le référentiel OPCO jusqu'à sa suppression (v1.711.3).
 * Un résultat indéterminé n'est pas un refus (vocabulaire fixé sur #5405) : il part en validation manuelle comme un refus.
 */
export const AUTO_VALIDATION_REFUSED_REASON = "pas de validation automatique possible"
export const AUTO_VALIDATION_INDETERMINATE_PREFIX = "validation automatique indéterminée : "
export const API_KEY_CREATION_REASON = "création par clef API"

type ICorrespondance = "email" | "domain" | null

const formatCorrespondance = (on: ICorrespondance) => (on === "domain" ? "domaine" : on === "email" ? "email" : "non transmise")

export const recruteursLbaReason = (on: "email" | "domain") => `validation par : recruteurs LBA (correspondance : ${formatCorrespondance(on)})`

export const balValidReason = ({ sources, on }: { sources: string[]; on: ICorrespondance }) =>
  `validation par : BAL (sources : ${sources.length ? sources.join(", ") : "non transmises"} ; correspondance : ${formatCorrespondance(on)})`

export const indeterminateReason = (unavailableSources: string[]) =>
  `${AUTO_VALIDATION_INDETERMINATE_PREFIX}${unavailableSources.join(", ")} indisponible${unavailableSources.length > 1 ? "s" : ""}`
