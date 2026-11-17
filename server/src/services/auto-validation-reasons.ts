/**
 * Raisons des rôles validés ou mis en attente par la validation automatique (#5409), lues par l'alerte #5411.
 * Les raisons antérieures ne sont pas réécrites : `validaton par : BAL` n'enregistrait ni source ni correspondance,
 * `validaton par : bonnes boites ou referentiel opco` couvrait aussi le référentiel OPCO jusqu'à sa suppression (v1.711.3).
 * Les raisons CFA `l'email correspond à un contact` et `le nom de domaine de l'email correspond à celui d'un contact` n'enregistraient pas la source du contact (#3711).
 * Un résultat indéterminé n'est pas un refus (vocabulaire fixé sur #5405) : il part en validation manuelle comme un refus.
 */
import { AUTO_VALIDATION_INDETERMINATE_PREFIX } from "shared/constants/auto-validation"

export { AUTO_VALIDATION_INDETERMINATE_PREFIX, AUTO_VALIDATION_REFUSED_REASON } from "shared/constants/auto-validation"
export const API_KEY_CREATION_REASON = "création par clef API"

type ICorrespondance = "email" | "domain" | null

const formatCorrespondance = (on: ICorrespondance) => (on === "domain" ? "domaine" : on === "email" ? "email" : "non transmise")

export const recruteursLbaReason = (on: "email" | "domain") => `validation par : recruteurs LBA (correspondance : ${formatCorrespondance(on)})`

export const balValidReason = ({ sources, on }: { sources: string[]; on: ICorrespondance }) =>
  `validation par : BAL (sources : ${sources.length ? sources.join(", ") : "non transmises"} ; correspondance : ${formatCorrespondance(on)})`

export const referentielContactReason = ({ sources, on }: { sources: string[]; on: "email" | "domain" }) =>
  `validation par : Référentiel (sources : ${sources.length ? sources.join(", ") : "non transmises"} ; correspondance : ${formatCorrespondance(on)})`

export const indeterminateReason = (unavailableSources: string[]) =>
  `${AUTO_VALIDATION_INDETERMINATE_PREFIX}${unavailableSources.join(", ")} indisponible${unavailableSources.length > 1 ? "s" : ""}`
