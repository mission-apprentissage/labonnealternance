import { program as cli } from "commander"
import anonymizeOldApplications from "./jobs/anonymizeOldApplications/anonymizeOldApplications.js"
import refactorLBACFields from "./jobs/cleanAndRenameDBFields/refactorLBACFields.js"
import updateDiplomesMetiers from "./jobs/diplomesMetiers/updateDiplomesMetiers.js"
import updateDomainesMetiers from "./jobs/domainesMetiers/updateDomainesMetiers.js"
import updateDomainesMetiersFile from "./jobs/domainesMetiers/updateDomainesMetiersFile.js"
import { importCatalogueFormationJob } from "./jobs/formationsCatalogue/formationsCatalogue.js"
import { createApiUser } from "./jobs/lba_recruteur/api/createApiUser.js"
import { disableApiUser } from "./jobs/lba_recruteur/api/disableApiUser.js"
import { resetApiKey } from "./jobs/lba_recruteur/api/resetApiKey.js"
import { annuleFormulaire } from "./jobs/lba_recruteur/formulaire/annuleFormulaire.js"
import { createUserFromCLI } from "./jobs/lba_recruteur/formulaire/createUser.js"
import { relanceFormulaire } from "./jobs/lba_recruteur/formulaire/relanceFormulaire.js"
import { generateIndexes } from "./jobs/lba_recruteur/indexes/generateIndexes.js"
import { relanceOpco } from "./jobs/lba_recruteur/opco/relanceOpco.js"
import { exportPE } from "./jobs/lba_recruteur/formulaire/misc/exportPE.js"
import { createOffreCollection } from "./jobs/lba_recruteur/seed/createOffre.js"
import updateBonnesBoites from "./jobs/lbb/updateBonnesBoites.js"
import updateGeoLocations from "./jobs/lbb/updateGeoLocations.js"
import updateOpcoCompanies from "./jobs/lbb/updateOpcoCompanies.js"
import { activateOptOutEtablissementFormations } from "./jobs/rdv/activateOptOutEtablissementFormations.js"
import { anonimizeAppointments } from "./jobs/rdv/anonymizeAppointments.js"
import { anonimizeUsers } from "./jobs/rdv/anonymizeUsers.js"
import { eligibleTrainingsForAppointmentsHistoryWithCatalogue } from "./jobs/rdv/eligibleTrainingsForAppointmentsHistoryWithCatalogue.js"
import { inviteEtablissementToOptOut } from "./jobs/rdv/inviteEtablissementToOptOut.js"
import { inviteEtablissementToPremium } from "./jobs/rdv/inviteEtablissementToPremium.js"
import { inviteEtablissementAffelnetToPremium } from "./jobs/rdv/inviteEtablissementToPremiumAffelnet.js"
import { inviteEtablissementToPremiumFollowUp } from "./jobs/rdv/inviteEtablissementToPremiumFollowUp.js"
import { inviteEtablissementAffelnetToPremiumFollowUp } from "./jobs/rdv/inviteEtablissementToPremiumFollowUpAffelnet.js"
import { premiumActivatedReminder } from "./jobs/rdv/premiumActivatedReminder.js"
import { premiumInviteOneShot } from "./jobs/rdv/premiumInviteOneShot.js"
import { syncEtablissementsAndFormations } from "./jobs/rdv/syncEtablissementsAndFormations.js"
import { syncAffelnetFormationsFromCatalogueME } from "./jobs/rdv/syncEtablissementsAndFormationsAffelnet.js"
import { runScript } from "./jobs/scriptWrapper.js"
import { checkAwaitingCompaniesValidation } from "./jobs/lba_recruteur/user/misc/updateMissingActivationState.js"
import updateBrevoBlockedEmails from "./jobs/updateBrevoBlockedEmails/updateBrevoBlockedEmails.js"
import { importReferentielOnisep } from "./jobs/rdv/importReferentielOnisep.js"
import updateReferentielRncpRomes from "./jobs/referentielRncpRome/updateReferentielRncpRomes.js"
import { updateFormationCatalogue } from "./jobs/formationsCatalogue/updateFormationCatalogue.js"

cli.addHelpText("after", null)

/**
 *
 *
 * JOB RECRUTEUR
 *
 *
 */

cli
  .command("index [index_list]")
  .description("Synchronise les index des collections mongo & reconstruit les index elasticsearch. <index_list> est la liste des index séparés par des , ")
  .action((index_list) => {
    runScript(() => generateIndexes(index_list))
  })

cli
  .command("create-user <first_name> <last_name> <email> <scope> <establishment_raison_sociale> [establishment_siret] [phone] [address]")
  .option("-admin, [isAdmin]", "utilisateur administrateur", false)
  .requiredOption("-type, <type>", "type d'utilisateur")
  .requiredOption("-email_valide, <email_valide>", "email valide", true)
  .description("Permet de créer un accès utilisateur à l'espace partenaire")
  .action((first_name, last_name, email, scope, establishment_raison_sociale, establishment_siret, phone, address, options) => {
    runScript(() => {
      createUserFromCLI(
        {
          first_name,
          last_name,
          establishment_siret,
          establishment_raison_sociale,
          phone,
          address,
          email,
          scope,
        },
        { options }
      )
    })
  })

cli
  .command("create-api-user <nom> <prenom> <email> <organization> <scope>")
  .description("Permet de créer un utilisateur ayant accès à l'API")
  .action((nom, prenom, email, organization, scope) => {
    runScript(() => createApiUser(nom, prenom, email, organization, scope))
  })

cli
  .command("reset-api-user <email>")
  .description("Permet de réinitialiser la clé API d'un utilisateur")
  .action((email) => {
    runScript(() => resetApiKey(email))
  })

cli
  .command("disable-api-user <email> [state]")
  .description("Permet de d'activer/désactiver l'accès d'un utilisateur à l'API")
  .action((email, state) => {
    runScript(() => disableApiUser(email, state))
  })

cli
  .command("relance-formulaire <threshold>")
  .description("Envoie une relance par mail pour les offres expirant dans 7 jours")
  .action((threshold) => {
    runScript(() => relanceFormulaire(parseInt(threshold)))
  })

cli
  .command("annulation-formulaire")
  .description("Annule les offres pour lesquels la date d'expiration est correspondante à la date actuelle")
  .action(() => {
    runScript(() => annuleFormulaire())
  })

cli
  .command("creer-offre-metabase")
  .description("Permet de créer une collection dédiée aux offres pour metabase")
  .action(() => {
    runScript(() => createOffreCollection())
  })

cli
  .command("relance-opco")
  .description("Relance les opco avec le nombre d'utilisateur en attente de validation")
  .action(() => {
    runScript(() => relanceOpco())
  })

cli
  .command("export-offre-pole-emploi")
  .description("Exporte les offres vers Pôle Emploi")
  .action(() => {
    runScript((components) => exportPE(components))
  })

cli
  .command("validate-user")
  .description("Contrôle de validation des entreprises en attente de validation")
  .action(() => {
    runScript((components) => checkAwaitingCompaniesValidation())
  })

/**
 *
 *
 * JOB ORGANISME DE FORMATION
 *
 *
 */

cli
  .command("activate-opt-out-etablissement-formations")
  .description("Active tous les établissements qui ont souscrits à l'opt-out.")
  .action(() => {
    runScript(() => activateOptOutEtablissementFormations())
  })

cli
  .command("invite-etablissement-to-opt-out")
  .description("Invite les établissements (via email décisionnaire) à l'opt-out.")
  .action(() => {
    runScript(() => inviteEtablissementToOptOut())
  })

cli
  .command("invite-etablissement-to-premium")
  .description("Invite les établissements (via email décisionnaire) au premium (Parcoursup)")
  .action(() => {
    runScript(() => inviteEtablissementToPremium())
  })

cli
  .command("invite-etablissement-affelnet-to-premium")
  .description("Invite les établissements (via email décisionnaire) au premium (Affelnet)")
  .action(() => {
    runScript(() => inviteEtablissementAffelnetToPremium())
  })

cli
  .command("invite-etablissement-to-premium-follow-up")
  .description("(Relance) Invite les établissements (via email décisionnaire) au premium (Parcoursup)")
  .action(() => {
    runScript(() => inviteEtablissementToPremiumFollowUp())
  })

cli
  .command("invite-etablissement-affelnet-to-premium-follow-up")
  .description("(Relance) Invite les établissements (via email décisionnaire) au premium (Affelnet)")
  .action(() => {
    runScript(() => inviteEtablissementAffelnetToPremiumFollowUp())
  })

cli
  .command("premium-activated-reminder")
  .description("Envoi un email à tous les établissements premium pour les informer de l'ouverture des voeux sur Parcoursup")
  .action(() => {
    runScript(() => premiumActivatedReminder())
  })

cli
  .command("premium-invite-one-shot")
  .description("Envoi un email à tous les établissements pas encore premium pour les inviter de nouveau")
  .action(() => {
    runScript(() => premiumInviteOneShot())
  })

cli
  .command("sync-etablissements-and-formations")
  .description("Récupère la liste de toutes les formations du Catalogue et les enregistre.")
  .action(() => {
    runScript(() => syncEtablissementsAndFormations())
  })

cli
  .command("sync-etablissements-and-formations-affelnet")
  .description("Récupère la liste de toutes les formations du Catalogue ME du scope AFFELNET et les enregistre.")
  .action(() => {
    runScript(() => syncAffelnetFormationsFromCatalogueME())
  })

cli
  .command("anonimize-appointments")
  .description("anonimisation des prises de rendez-vous de plus d'un an")
  .action(() => {
    runScript(() => anonimizeAppointments())
  })

cli
  .command("anonimize-users")
  .description("anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus d'un an")
  .action(() => {
    runScript(() => anonimizeUsers())
  })

cli
  .command("history-eligible-trainings-for-appointments-catalogue")
  .description("Historise l'egibilité d'une formation à la prise de rendez-vous avec le Catalogue des formations (RCO)")
  .action(() => {
    runScript(() => eligibleTrainingsForAppointmentsHistoryWithCatalogue())
  })

cli
  .command("import-referentiel-onisep")
  .description("Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep")
  .action(() => {
    runScript(() => importReferentielOnisep())
  })

/**
 *
 *
 * JOB CANDIDAT
 *
 *
 */

cli
  .command("sync-catalogue-trainings")
  .description("Importe les formations depuis le Catalogue")
  .action(() => {
    runScript(() => importCatalogueFormationJob())
  })

cli
  .command("sync-catalogue-trainings-extra-data")
  .description("Mise à jour des champs spécifiques de la collection formations catalogue")
  .action(() => {
    runScript((components) => updateFormationCatalogue(components))
  })

cli
  .command("sync-sib-blocked")
  .option("-all-addresses, [AllAddresses]", "pour récupérer toutes les adresses bloquées", false)
  .description("Récupère auprès de Brevo la liste des adresses emails bloquées le jour précédent (défaut) ou toutes les adresses bloquées (option)")
  .action((options) => {
    runScript(() => updateBrevoBlockedEmails(options))
  })

cli
  .command("anonymize-applications")
  .description("Anonymise toutes les candidatures de plus de an qui ne sont pas déjà anonymisées")
  .action(() => {
    runScript(() => anonymizeOldApplications())
  })

cli
  .command("rename-lbac-fields")
  .description("Renomme les champs des collections LBAC")
  .action(() => {
    runScript(() => refactorLBACFields())
  })

cli
  .command("update-companies")
  .option("-use-algo-file, [UseAlgoFile]", "télécharge et traite le fichier issu de l'algo", false)
  .option("-clear-mongo, [ClearMongo]", "vide la collection des bonnes alternances", false)
  .option("-build-index, [BuildIndex]", "réindex les bonnes boîtes", false)
  .option("-use-save, [UseSave]", "pour appliquer les données SAVE", false)
  .option("-force-recreate, [ForceRecreate]", "pour forcer la recréation", false)
  .description("Met à jour la liste des sociétés bonnes alternances")
  .action((options) => {
    runScript(() => updateBonnesBoites(options))
  })

cli
  .command("update-geo-locations")
  .option("-force-recreate, [ForceRecreate]", "pour forcer la recréation", false)
  .description("Procède à la géolocalisation de masse des sociétés dans le fichier des bonnes alternances")
  .action((options) => {
    runScript(() => updateGeoLocations(options))
  })

cli
  .command("update-opcos")
  .option("-clear-mongo, [ClearMongo]", "vide la collection des opcos", false)
  .option("-force-recreate, [ForceRecreate]", "pour forcer la recréation", false)
  .description("Procède à la résolution des opcos des sociétés dans le fichier des bonnes alternances")
  .action((options) => {
    runScript(() => updateOpcoCompanies(options))
  })

cli
  .command("update-domaines-metiers")
  .description("Procède à l'import du fichier domaines metiers")
  .action(() => {
    runScript(() => updateDomainesMetiers())
  })

cli
  .command("update-domaines-metiers-file <filename> [key]")
  .description("Enregistre le fichier spécifié présent dans /assets sur le repository distant. Si key n'est pas précisé il remplacera le fichier par défaut.")
  .action((filename: string, key: string) => {
    runScript(() => updateDomainesMetiersFile({ filename, key }))
  })

cli
  .command("update-diplomes-metiers")
  .description("Procède à l'association des diplômes par métiers")
  .action(() => {
    runScript(() => updateDiplomesMetiers())
  })

cli
  .command("update-referentiel-rncp-romes")
  .description("Procède à la mise à jour du référentiel RNCP codes ROME")
  .action(() => {
    runScript(() => updateReferentielRncpRomes())
  })

cli.parse(process.argv)
