import "dotenv/config";
import { program as cli } from "commander";
import { runScript } from "./common/runScript.js";
import { migrate } from "./jobs/migrate.js";

cli
  .command("migrate")
  .description("Execute les scripts de migration")
  .option("--dropIndexes", "Supprime les anciens indexes")
  .action((options) => {
    runScript(() => {
      return migrate(options);
    });
  });

cli.parse(process.argv);
