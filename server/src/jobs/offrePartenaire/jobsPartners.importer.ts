import type { CronDef } from "job-processor"
import { processEtudiant } from "@/jobs/offrePartenaire/etudiant/processEtudiant"
import { processApec } from "./apec/processApec"
import { processAtlas, processMeteojob, processNosTalentsNosEmplois, processToulouseMetropole, processViteUnEmploi } from "./clever-connect/processCleverConnect"
// import { processEngagementJeunes } from "./engagementJeunes/importEngagementJeunes"
import { processDecathlon } from "./decathlon/importDecathlon"
import { processEmploiInclusion } from "./emploi-inclusion/importEmploiInclusion"
// import { processEngagementJeunes } from "./engagementJeunes/importEngagementJeunes"
import { processFranceTravail } from "./france-travail/processFranceTravail"
import { processFranceTravailCEGID } from "./france-travail-CEGID/importFranceTravailCEGID"
import { processHellowork } from "./hellowork-merge/processHellowork"
import { processJobteaser } from "./jobteaser/processJobteaser"
// import { processJooble } from "./jooble/processJooble"
import { processKelio } from "./kelio/processKelio"
import { processLaposte } from "./laposte/processLaposte"
import { processLeboncoin } from "./leboncoin/processLeboncoin"
import { processPass } from "./pass/processPass"
import { processComputedAndImportToJobPartners } from "./processJobPartners"
import { processMissingRomeAndImportToJobPartners } from "./processMissingRomeAndImportToJobPartners"
import { processRhAlternance } from "./rh-alternance/processRhAlternance"

const timings = {
  import_source: "0 0 * * *",
  process_computed: "1 0 * * *",
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
}
