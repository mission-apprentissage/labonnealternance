import { CronDef } from "job-processor"

import { processFranceTravail } from "@/jobs/offrePartenaire/france-travail/processFranceTravail"
import { processHellowork } from "@/jobs/offrePartenaire/hellowork/processHellowork"
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
  },
  "Import Hellowork": {
    cron_string: timings.import_source,
    handler: processHellowork,
    checkinMargin: 10,
    maxRuntimeInMinutes: 30,
  },
  "Import France Travail": {
    cron_string: timings.import_source,
    handler: processFranceTravail,
    checkinMargin: 30,
    maxRuntimeInMinutes: 30,
  },
  "Import Meteojob": {
    cron_string: timings.import_source,
    handler: processFranceTravail,
    checkinMargin: 10,
    maxRuntimeInMinutes: 30,
  },
  // "Import PASS": {
  //   cron_string: timings.import_source,
  //   handler: processPass,
  //   checkinMargin: 60,
  //   maxRuntimeInMinutes: 30,
  // },
}
