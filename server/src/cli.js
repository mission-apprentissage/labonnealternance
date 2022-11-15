import { program as cli } from "commander";
import { runScript } from "./common/runScript.js";
import { createApiUser } from "./jobs/lba_recruteur/api/createApiUser.js";
import { disableApiUser } from "./jobs/lba_recruteur/api/disableApiUser.js";
import { resetApiKey } from "./jobs/lba_recruteur/api/resetApiKey.js";
import { annuleFormulaire } from "./jobs/lba_recruteur/formulaire/annuleFormulaire.js";
import { createUser } from "./jobs/lba_recruteur/formulaire/createUser.js";
import { relanceFormulaire } from "./jobs/lba_recruteur/formulaire/relanceFormulaire.js";
import { generateIndexes } from "./jobs/lba_recruteur/indexes/generateIndexes.js";
import { relanceOpco } from "./jobs/lba_recruteur/opco/relanceOpco.js";
import { createOffreCollection } from "./jobs/lba_recruteur/seed/createOffre.js";
import { migrate } from "./jobs/migrate.js";

cli.addHelpText("after");

cli
  .command("index")
  .description("Synchronise les index des collections mongo & reconstruit l'index elasticsearch")
  .action(() => {
    runScript(() => generateIndexes());
  });

cli
  .command("create-user <prenom> <nom> <email> <scope> <raison_sociale> [siret] [telephone] [adresse]")
  .option("-admin, [isAdmin]", "utilisateur administrateur", false)
  .requiredOption("-type, <type>", "type d'utilisateur")
  .requiredOption("-email_valide, <email_valide>", "email valide", true)
  .description("Permet de créer un accès utilisateur à l'espace partenaire")
  .action((prenom, nom, email, scope, raison_sociale, siret, telephone, adresse, options) => {
    runScript(({ users }) => {
      createUser(
        users,
        {
          prenom,
          nom,
          siret,
          raison_sociale,
          telephone,
          adresse,
          email,
          scope,
        },
        { options }
      );
    });
  });

cli
  .command("create-api-user <nom> <prenom> <email> <organization> <scope>")
  .description("Permet de créer un utilisateur ayant accès à l'API")
  .action((nom, prenom, email, organization, scope) => {
    runScript(() => createApiUser(nom, prenom, email, organization, scope));
  });

cli
  .command("reset-api-user <email>")
  .description("Permet de réinitialiser la clé API d'un utilisateur")
  .action((email) => {
    runScript(({ users }) => resetApiKey(users, email));
  });

cli
  .command("disable-api-user <email> [state]")
  .description("Permet de d'activer/désactiver l'accès d'un utilisateur à l'API")
  .action((email, state) => {
    runScript(() => disableApiUser(email, state));
  });

cli
  .command("relance-formulaire <threshold>")
  .description("Envoie une relance par mail pour les offres expirant dans 7 jours")
  .action((threshold) => {
    runScript(({ mailer }) => relanceFormulaire(mailer, parseInt(threshold)));
  });

cli
  .command("annulation-formulaire")
  .description("Annule les offres pour lesquels la date d'expiration est correspondante à la date actuelle")
  .action(() => {
    runScript(() => annuleFormulaire());
  });

cli
  .command("creer-offre-metabase")
  .description("Permet de créer une collection dédiée aux offres pour metabase")
  .action(() => {
    runScript(({ application }) => createOffreCollection(application));
  });

cli
  .command("relance-opco")
  .description("Relance les opco avec le nombre d'utilisateur en attente de validation")
  .action(() => {
    runScript(({ mailer }) => relanceOpco(mailer));
  });

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
