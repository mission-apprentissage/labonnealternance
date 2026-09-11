import type { CronDef } from "job-processor"
import { processEtudiant } from "@/jobs/offre-partenaire/etudiant/process-etudiant"
import { processApec } from "./apec/process-apec"
import { processAtlas, processMeteojob, processNosTalentsNosEmplois, processToulouseMetropole, processViteUnEmploi } from "./clever-connect/process-clever-connect"
// import { processEngagementJeunes } from "./engagement-jeunes/import-engagement-jeunes"
import { processDecathlon } from "./decathlon/import-decathlon"
import { processEdf } from "./edf/process-edf"
import { processEmploiInclusion } from "./emploi-inclusion/import-emploi-inclusion"
import { processEnedis } from "./enedis/process-enedis"
import { processFranceTravail } from "./france-travail/process-france-travail"
import { processFranceTravailCEGID } from "./france-travail-CEGID/import-france-travail-cegid"
import { processHellowork } from "./hellowork-merge/process-hellowork"
import { processJobteaser } from "./jobteaser/process-jobteaser"
// import { processJooble } from "./jooble/process-jooble"
import { processKelio } from "./kelio/process-kelio"
import { processLaposte } from "./laposte/process-laposte"
import { processLeboncoin } from "./leboncoin/process-leboncoin"
import { processPass } from "./pass/process-pass"
import { processComputedAndImportToJobPartners } from "./process-job-partners"
import { processMissingRomeAndImportToJobPartners } from "./process-missing-rome-and-import-to-job-partners"
import { processRhAlternance } from "./rh-alternance/process-rh-alternance"
import { JOB_PARTNERS_DIGEST_JOB_NAME, sendJobPartnersNightlyDigest } from "./send-job-partners-nightly-digest"

const timings = {
  import_source: "0 0 * * *",
  process_computed: "1 0 * * *",
  // 24 h/24 : borné à 6h-22h, les offres dont le romage échouait au nightly (00h35) attendaient la
  // première passe de 06h00 pour être validées et importées — 848 offres le 02/09/2026, 1 907 le
  // 29/08, toutes servies depuis cache_diagoriente en 2 à 3 s. Le job pose son propre verrou
  // (currently_processed_id) et n'importe que son périmètre : la cohabitation avec le nightly est
  // la même qu'avec le cron API `*/5` déjà en place.
  process_missing_rome: "*/15 * * * *",
}

export const importers: Record<string, CronDef> = {
  "Import RHAlternance": {
    cron_string: timings.import_source,
    handler: processRhAlternance,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Hellowork": {
    cron_string: timings.import_source,
    handler: processHellowork,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import France Travail": {
    cron_string: timings.import_source,
    handler: processFranceTravail,
    checkinMargin: 350,
    maxRuntimeInMinutes: 120,
    tag: "slave",
  },
  "Import France Travail CEGID": {
    cron_string: timings.import_source,
    handler: processFranceTravailCEGID,
    checkinMargin: 350,
    maxRuntimeInMinutes: 60,
    tag: "slave",
  },
  "Import Meteojob": {
    cron_string: timings.import_source,
    handler: processMeteojob,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Kelio": {
    cron_string: timings.import_source,
    handler: processKelio,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import La Poste": {
    cron_string: timings.import_source,
    handler: processLaposte,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Le bon coin emploi": {
    cron_string: timings.import_source,
    handler: processLeboncoin,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Jobteaser": {
    cron_string: timings.import_source,
    handler: processJobteaser,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  // "Import Jooble": {
  //   cron_string: timings.import_source,
  //   handler: processJooble,
  //   checkinMargin: 350,
  //   maxRuntimeInMinutes: 30,
  //   tag: "slave",
  // },
  "Import PASS": {
    cron_string: timings.import_source,
    handler: processPass,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import Atlas": {
    cron_string: timings.import_source,
    handler: processAtlas,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import Vite un emploi": {
    cron_string: timings.import_source,
    handler: processViteUnEmploi,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import Nos Talents Nos Emplois": {
    cron_string: timings.import_source,
    handler: processNosTalentsNosEmplois,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import Toulouse Metropole": {
    cron_string: timings.import_source,
    handler: processToulouseMetropole,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  // "Import Engagement Jeunes": {
  //   cron_string: timings.import_source,
  //   handler: processEngagementJeunes,
  //   checkinMargin: 350,
  //   maxRuntimeInMinutes: 30,
  // },
  "Import Decathlon": {
    cron_string: timings.import_source,
    handler: processDecathlon,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import EDF": {
    cron_string: timings.import_source,
    handler: processEdf,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import Enedis": {
    cron_string: timings.import_source,
    handler: processEnedis,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import APEC": {
    cron_string: timings.import_source,
    handler: processApec,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
  },
  "Import Emploi Inclusion": {
    cron_string: timings.import_source,
    handler: processEmploiInclusion,
    checkinMargin: 350,
    maxRuntimeInMinutes: 120,
  },
  "Import Etudiant": {
    cron_string: timings.import_source,
    handler: processEtudiant,
    checkinMargin: 350,
    maxRuntimeInMinutes: 120,
  },
  "Process missing Rome and import to Jobs Partners": {
    cron_string: timings.process_missing_rome,
    handler: processMissingRomeAndImportToJobPartners,
    checkinMargin: 350,
    maxRuntimeInMinutes: 15,
    tag: "slave",
    resumable: true,
  },

  // Keep at the end
  "Process computed and import to Jobs Partners": {
    cron_string: timings.process_computed,
    handler: processComputedAndImportToJobPartners,
    checkinMargin: 350,
    maxRuntimeInMinutes: 300,
    tag: "slave",
    resumable: true,
  },

  // Bilan unique des jobs ci-dessus, envoyé une fois le pire cas (5h de "Process computed...") passé
  [JOB_PARTNERS_DIGEST_JOB_NAME]: {
    cron_string: "30 5 * * *",
    handler: sendJobPartnersNightlyDigest,
    checkinMargin: 30,
    maxRuntimeInMinutes: 10,
  },
}
