import { autoValidationRules } from "@/jobs/recruiters/auto-validation-rate-alert"
import type { IDetectionRule } from "./detection-rule"

/** Règles évaluées par le cron de détection (#5421). L'identifiant d'une règle ne change plus une fois livrée. */
export const detectionRules: IDetectionRule[] = [...autoValidationRules]
