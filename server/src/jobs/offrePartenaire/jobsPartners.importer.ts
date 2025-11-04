import type { CronDef } from "job-processor"

import { processMeteojob, processAtlas, processViteUnEmploi, processNosTalentsNosEmplois, processToulouseMetropole } from "./clever-connect/processCleverConnect"
import { processFranceTravail } from "./france-travail/processFranceTravail"
import { processHellowork } from "./hellowork/processHellowork"
import { processJobteaser } from "./jobteaser/processJobteaser"
import { processJooble } from "./jooble/processJooble"
import { processKelio } from "./kelio/processKelio"
import { processLaposte } from "./laposte/processLaposte"
// import { processMonster } from "@/jobs/offrePartenaire/monster/processMonster"
import { processPass } from "./pass/processPass"
import { processComputedAndImportToJobPartners } from "./processJobPartners"
import { processRhAlternance } from "./rh-alternance/processRhAlternance"

const timings = {
  import_source: "0 0 * * *",
  process_computed: "1 0 * * *",
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
  "Import Meteojob": {
    cron_string: timings.import_source,
    handler: processMeteojob,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  // "Import Monster": {
  //   cron_string: timings.import_source,
  //   handler: processMonster,
  //   checkinMargin: 350,
  //   maxRuntimeInMinutes: 30,
  //   tag: "slave",
  // },
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
  "Import Jobteaser": {
    cron_string: timings.import_source,
    handler: processJobteaser,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Jooble": {
    cron_string: timings.import_source,
    handler: processJooble,
    checkinMargin: 350,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
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

  // Leave at the end
  "Process computed and import to Jobs Partners": {
    cron_string: timings.process_computed,
    handler: processComputedAndImportToJobPartners,
    checkinMargin: 350,
    maxRuntimeInMinutes: 120,
    tag: "slave",
    resumable: true,
  },
}
