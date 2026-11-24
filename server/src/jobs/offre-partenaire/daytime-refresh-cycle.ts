import type { CronDef } from "job-processor"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { processApec } from "./apec/process-apec"
import { cancelRemovedJobsPartners, formatRemovalGuardBlock } from "./cancel-removed-jobs-partners"
import { processAtlas, processMeteojob, processNosTalentsNosEmplois, processToulouseMetropole, processViteUnEmploi } from "./clever-connect/process-clever-connect"
import { getDaytimeRefreshPartners } from "./daytime-refresh-partners"
import { processDecathlon } from "./decathlon/import-decathlon"
import { processEdf } from "./edf/process-edf"
import { processEmploiInclusion } from "./emploi-inclusion/import-emploi-inclusion"
import { processEnedis } from "./enedis/process-enedis"
import { processEtudiant } from "./etudiant/process-etudiant"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { fillLbaUrl } from "./fill-lba-url"
import { processFranceTravail } from "./france-travail/process-france-travail"
import { processFranceTravailCEGID } from "./france-travail-CEGID/import-france-travail-cegid"
import { processHellowork } from "./hellowork-merge/process-hellowork"
import { type FluxImportOptions, isFluxSkipped } from "./import-flux-if-changed"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"
import { processJobteaser } from "./jobteaser/process-jobteaser"
import { processKelio } from "./kelio/process-kelio"
import { processLaposte } from "./laposte/process-laposte"
import { processLeboncoin } from "./leboncoin/process-leboncoin"
import { processLinkedin } from "./linkedin/process-linkedin"
import { withPartnerLocks } from "./partner-processing-lock"
import { processPass } from "./pass/process-pass"
import { processRhAlternance } from "./rh-alternance/process-rh-alternance"

/** Libellés produits par un même importeur : ils ne peuvent être rafraîchis que ensemble. */
export type DaytimeRefreshUnit = {
  name: string
  labels: JOBPARTNERS_LABEL[]
  process: (options: FluxImportOptions) => Promise<unknown>
}

// Les API paginées (France Travail, RH Alternance, Emploi inclusion, L'Etudiant, France Travail CEGID) n'ont pas de
// signal de changement (#5669) : leur cycle reconstruit toujours.
export const DAYTIME_REFRESH_UNITS: DaytimeRefreshUnit[] = [
  { name: "Jobteaser", labels: [JOBPARTNERS_LABEL.JOBTEASER], process: processJobteaser },
  // Déduplication de raw_hellowork contre raw_hellowork_buddi, cf. processHellowork.
  { name: "Hellowork", labels: [JOBPARTNERS_LABEL.HELLOWORK, JOBPARTNERS_LABEL.HELLOWORK_BUDDI], process: processHellowork },
  { name: "Meteojob", labels: [JOBPARTNERS_LABEL.METEOJOB], process: processMeteojob },
  { name: "Atlas", labels: [JOBPARTNERS_LABEL.ATLAS], process: processAtlas },
  { name: "Vite un emploi", labels: [JOBPARTNERS_LABEL.VITE_UN_EMPLOI], process: processViteUnEmploi },
  { name: "Nos Talents Nos Emplois", labels: [JOBPARTNERS_LABEL.NOS_TALENTS_NOS_EMPLOIS], process: processNosTalentsNosEmplois },
  { name: "Toulouse Metropole", labels: [JOBPARTNERS_LABEL.TOULOUSE_METROPOLE], process: processToulouseMetropole },
  { name: "Kelio", labels: [JOBPARTNERS_LABEL.KELIO], process: processKelio },
  { name: "La Poste", labels: [JOBPARTNERS_LABEL.LAPOSTE], process: processLaposte },
  { name: "Le bon coin emploi", labels: [JOBPARTNERS_LABEL.LEBONCOIN], process: processLeboncoin },
  { name: "PASS", labels: [JOBPARTNERS_LABEL.PASS], process: processPass },
  { name: "Decathlon", labels: [JOBPARTNERS_LABEL.DECATHLON], process: processDecathlon },
  { name: "EDF", labels: [JOBPARTNERS_LABEL.EDF], process: processEdf },
  { name: "Enedis", labels: [JOBPARTNERS_LABEL.ENEDIS], process: processEnedis },
  { name: "APEC", labels: [JOBPARTNERS_LABEL.APEC], process: processApec },
  { name: "LinkedIn", labels: [JOBPARTNERS_LABEL.LINKEDIN], process: processLinkedin },
  { name: "France Travail", labels: [JOBPARTNERS_LABEL.FRANCE_TRAVAIL], process: () => processFranceTravail() },
  { name: "France Travail CEGID", labels: [JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID], process: () => processFranceTravailCEGID() },
  { name: "RH Alternance", labels: [JOBPARTNERS_LABEL.RH_ALTERNANCE], process: () => processRhAlternance() },
  { name: "Emploi Inclusion", labels: [JOBPARTNERS_LABEL.EMPLOI_INCLUSION], process: () => processEmploiInclusion() },
  { name: "Etudiant", labels: [JOBPARTNERS_LABEL.JOB_ETUDIANT], process: () => processEtudiant() },
]

/**
 * Unités à rafraîchir en journée, dans l'ordre de LBA_DAYTIME_REFRESH_PARTNERS. Un libellé active toute son unité ;
 * un libellé sans importeur (Monster, Jooble, Engagement Jeunes) lève une erreur, cf. buildDaytimeRefreshCrons.
 */
export const getDaytimeRefreshUnits = (units: DaytimeRefreshUnit[] = DAYTIME_REFRESH_UNITS): DaytimeRefreshUnit[] => {
  const configured = getDaytimeRefreshPartners()
  const withoutUnit = configured.filter((label) => !units.some(({ labels }) => labels.includes(label)))
  if (withoutUnit.length) {
    throw new Error(`LBA_DAYTIME_REFRESH_PARTNERS : aucun import actif pour ${withoutUnit.join(", ")}`)
  }
  const selected = [...new Set(configured.map((label) => units.find(({ labels }) => labels.includes(label))!))]
  for (const unit of selected) {
    const implied = unit.labels.filter((label) => !configured.includes(label))
    if (implied.length) {
      logger.info({ unit: unit.name, configured: unit.labels.filter((label) => configured.includes(label)), implied }, "cycle de journée : unité activée en entier")
    }
  }
  return selected
}

/**
 * Un seul job pour l'import et le traitement : sur le worker `slave`, aucun autre job (Process missing Rome) ne
 * s'intercale entre la reconstruction du computed et son enrichissement. Le verrou couvre les autres workers et
 * est repris sans attente par rawToComputedJobsPartners (réentrant).
 */
export const runDaytimeRefresh = async ({ labels, process }: Pick<DaytimeRefreshUnit, "labels" | "process">) =>
  withPartnerLocks(labels, async () => {
    const flux = await process({ skipIfUnchanged: true })
    if (isFluxSkipped(flux)) {
      return { flux }
    }
    const filter = { partner_label: { $in: labels } }
    const filled = await fillComputedJobsPartners({ addedMatchFilter: filter })
    const imported = await importFromComputedToJobsPartners(filter)
    const { blocked } = await cancelRemovedJobsPartners(filter, { removalGuard: true })
    await fillLbaUrl({ addedMatchFilter: filter })
    if (blocked.length) {
      throw new JobPartnersGuardrailError(blocked.map(formatRemovalGuardBlock).join(" ; "))
    }
    return { flux, filled, imported }
  })

/** Point d'entrée CLI (`yarn cli runDaytimeRefreshUnit --unit Jobteaser`) : recette, où les crons d'import sont désactivés, et incident. Ignore LBA_DAYTIME_REFRESH_PARTNERS. */
export const runDaytimeRefreshUnit = async (payload?: { unit?: string }, units: DaytimeRefreshUnit[] = DAYTIME_REFRESH_UNITS) => {
  const unit = units.find(({ name }) => name === payload?.unit)
  if (!unit) {
    throw new Error(`runDaytimeRefreshUnit : --unit requis, parmi : ${units.map(({ name }) => name).join(", ")}`)
  }
  return runDaytimeRefresh(unit)
}

export const DAYTIME_REFRESH_JOB_NAME_PREFIX = "Cycle de journée"
export const DAYTIME_REFRESH_INVALID_CONFIG_JOB_NAME = `${DAYTIME_REFRESH_JOB_NAME_PREFIX} : configuration invalide`
const DAYTIME_REFRESH_STAGGER_MINUTES = 20
const DAYTIME_REFRESH_STAGGER_SLOTS = 4

/**
 * 04h, 08h, 12h, 16h et 20h, avec le run de nuit : un passage toutes les 4 h, rien entre 00h et 02h (run de nuit,
 * fenêtre de MEP). Quatre créneaux décalés de 20 min (h00, h20, h40, h+1) bornent le dernier départ à 21h00 ; au-delà
 * de quatre unités, les créneaux se partagent et les unités d'un même créneau passent l'une après l'autre sur `slave`.
 */
export const buildDaytimeRefreshCronString = (unitIndex: number) => {
  const offset = (unitIndex % DAYTIME_REFRESH_STAGGER_SLOTS) * DAYTIME_REFRESH_STAGGER_MINUTES
  const hourShift = Math.floor(offset / 60)
  return `${offset % 60} ${4 + hourShift}-${20 + hourShift}/4 * * *`
}

const DAYTIME_REFRESH_CRON_OPTIONS = {
  checkinMargin: 30,
  // Seuil de timeout du moniteur Sentry : durée par unité non mesurée, à recaler après la première activation.
  maxRuntimeInMinutes: 60,
  tag: "slave",
} as const

/**
 * Construit au chargement de jobs-partners.importer, donc au démarrage de tous les process (API, workers, migrations) :
 * une configuration invalide ne doit en arrêter aucun. Elle remplace les crons du cycle par un seul cron qui échoue
 * avec l'erreur, visible dans le bilan.
 * Pas de `concurrency: { mode: "exclusive" }` (cf. jobs.ts) : sur l'unique worker `slave`, une exécution qui arrive
 * pendant la précédente attend son tour ; le verrou ne refuse le cycle que face à un détenteur sur le worker `main`
 * (processJobPartnersWithFilter, CLI reprocessJobPartners ou forceCancelRemovedJobsPartners).
 */
export const buildDaytimeRefreshCrons = (units: DaytimeRefreshUnit[] = DAYTIME_REFRESH_UNITS): Record<string, CronDef> => {
  let selected: DaytimeRefreshUnit[]
  try {
    selected = getDaytimeRefreshUnits(units)
  } catch (err) {
    logger.error(err, "cycle de journée : configuration invalide, aucun cycle planifié")
    sentryCaptureException(err)
    return {
      [DAYTIME_REFRESH_INVALID_CONFIG_JOB_NAME]: {
        cron_string: buildDaytimeRefreshCronString(0),
        handler: async () => {
          throw err
        },
        ...DAYTIME_REFRESH_CRON_OPTIONS,
      },
    }
  }
  return Object.fromEntries(
    selected.map((unit, index) => [
      `${DAYTIME_REFRESH_JOB_NAME_PREFIX} ${unit.name}`,
      {
        cron_string: buildDaytimeRefreshCronString(index),
        // Appel explicite : job-processor passe un AbortSignal en premier argument du handler.
        handler: () => runDaytimeRefresh(unit),
        ...DAYTIME_REFRESH_CRON_OPTIONS,
      } satisfies CronDef,
    ])
  )
}
