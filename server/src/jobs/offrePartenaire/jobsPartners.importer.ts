import { CronDef } from "job-processor"

import { processAtlas } from "@/jobs/offrePartenaire/clever-connect/atlas/processAtlas"
import { processMeteojob } from "@/jobs/offrePartenaire/clever-connect/meteojob/processMeteojob"
import { processFranceTravail } from "@/jobs/offrePartenaire/france-travail/processFranceTravail"
import { processHellowork } from "@/jobs/offrePartenaire/hellowork/processHellowork"
import { processKelio } from "@/jobs/offrePartenaire/kelio/processKelio"
import { processLaposte } from "@/jobs/offrePartenaire/laposte/processLaposte"
import { processMonster } from "@/jobs/offrePartenaire/monster/processMonster"
import { processPass } from "@/jobs/offrePartenaire/pass/processPass"
import { processComputedAndImportToJobPartners } from "@/jobs/offrePartenaire/processJobPartners"
import { processRhAlternance } from "@/jobs/offrePartenaire/rh-alternance/processRhAlternance"

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
  "Import Monster": {
    cron_string: timings.import_source,
    handler: processMonster,
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

  // Leave at the end
  "Process computed and import to Jobs Partners": {
    cron_string: timings.process_computed,
    handler: processComputedAndImportToJobPartners,
    checkinMargin: 350,
    maxRuntimeInMinutes: 120,
    tag: "slave",
  },
}
