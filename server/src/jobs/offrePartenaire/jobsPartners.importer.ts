import { CronDef } from "job-processor"

import { processFranceTravail } from "@/jobs/offrePartenaire/france-travail/processFranceTravail"
import { processHellowork } from "@/jobs/offrePartenaire/hellowork/processHellowork"
import { processKelio } from "@/jobs/offrePartenaire/kelio/processKelio"
import { processMeteojob } from "@/jobs/offrePartenaire/meteojob/processMeteojob"
import { processMonster } from "@/jobs/offrePartenaire/monster/processMonster"
import { processRhAlternance } from "@/jobs/offrePartenaire/rh-alternance/processRhAlternance"

const timings = {
  import_source: "0 2 * * *",
}

export const importers: Record<string, CronDef> = {
  "Import RHAlternance": {
    cron_string: timings.import_source,
    handler: processRhAlternance,
    checkinMargin: 10,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Hellowork": {
    cron_string: timings.import_source,
    handler: processHellowork,
    checkinMargin: 10,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import France Travail": {
    cron_string: timings.import_source,
    handler: processFranceTravail,
    checkinMargin: 30,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Meteojob": {
    cron_string: timings.import_source,
    handler: processMeteojob,
    checkinMargin: 10,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Monster": {
    cron_string: timings.import_source,
    handler: processMonster,
    checkinMargin: 10,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  "Import Kelio": {
    cron_string: timings.import_source,
    handler: processKelio,
    checkinMargin: 10,
    maxRuntimeInMinutes: 30,
    tag: "slave",
  },
  // "Import PASS": {
  //   cron_string: timings.import_source,
  //   handler: processPass,
  //   checkinMargin: 60,
  //   maxRuntimeInMinutes: 30,
  // },
}
