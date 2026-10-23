import type { IDetectionAlert, IDetectionMetrics, IDetectionSeverity } from "shared/models/detection-alerts.model"
import type { z } from "zod"

export type IDetectionFinding = {
  /** Objet du constat, stable d'une exécution à l'autre : identifiant technique, ou « global ». */
  key: string
  metrics: IDetectionMetrics
  /** Une phrase lisible dans Slack, construite à partir des métriques. */
  summary: string
  links?: { label: string; url: string }[]
}

export type IDetectionEvaluation = {
  findings: IDetectionFinding[]
  /** Mesures du passage, journalisées qu'il y ait constat ou non. */
  observations?: IDetectionMetrics
}

export type IDetectionContext<TThresholds> = {
  /** Début du créneau évalué : deux exécutions du même créneau voient la même date. */
  now: Date
  thresholds: TThresholds
  /** Épisodes en attente ou ouverts : une règle peut maintenir une alerte tant que sa condition de sortie n'est pas remplie. */
  activeAlerts: IDetectionAlert[]
}

export type IDetectionRule<TThresholds = any> = {
  /** Identifiant stable : clé des réglages et des alertes persistées. */
  id: string
  title: string
  severity: IDetectionSeverity
  /** Créneaux de `everyMinutes` comptés depuis le 1er janvier 1970 à minuit UTC, décalés de `offsetMinutes`. */
  periodicity: { everyMinutes: number; offsetMinutes?: number }
  enabledByDefault: boolean
  /** `parse({})` donne les seuils par défaut ; un objet strict refuse une surcharge mal orthographiée. */
  thresholds: z.ZodType<TThresholds>
  /** Constats consécutifs avant l'entrée en alerte. */
  confirmations: number
  reminderEveryHours: number
  evaluate: (context: IDetectionContext<TThresholds>) => Promise<IDetectionEvaluation>
}
