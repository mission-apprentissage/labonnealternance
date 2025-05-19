import { updateDiplomeMetier } from "@/jobs/diplomesMetiers/updateDiplomesMetiers"
import { updateRomesForDomainesMetiers } from "@/jobs/domainesMetiers/updateRomesForDomainesMetiers"
import { sendMiseEnRelation } from "@/jobs/miseEnRelation/sendMiseEnRelation"
import { importRecruteursLbaFromComputedToJobsPartners } from "@/jobs/offrePartenaire/fillComputedRecruteursLba"
import { classifyFranceTravailJobs } from "@/jobs/offrePartenaire/france-travail/classifyJobsFranceTravail"
import { processFranceTravail } from "@/jobs/offrePartenaire/france-travail/processFranceTravail"
import { processHellowork } from "@/jobs/offrePartenaire/hellowork/processHellowork"
import { processMeteojob } from "@/jobs/offrePartenaire/meteojob/processMeteojob"
import { processPass } from "@/jobs/offrePartenaire/pass/processPass"
import { processRecruteursLba } from "@/jobs/offrePartenaire/recruteur-lba/processRecruteursLba"
import { processRhAlternance } from "@/jobs/offrePartenaire/rh-alternance/processRhAlternance"
import { renvoiMailCreationCompte } from "@/jobs/oneTimeJob/renvoiMailCreationCompte"
import { repriseEnvoiEmailsPRDV } from "@/jobs/rdv/repriseEnvoiPRDV"
import { processScheduledRecruiterIntentions } from "@/services/application.service"
import { generateSitemap } from "@/services/sitemap.service"

import { anonymizeApplicantsAndApplications } from "./anonymization/anonymizeApplicantAndApplications"
import { anonimizeUsersWithAccounts } from "./anonymization/anonymizeUserRecruteurs"
import { anonymizeUsers } from "./anonymization/anonymizeUsers"
import { processApplications } from "./applications/processApplications"
import { processRecruiterIntentions } from "./applications/processRecruiterIntentions"
import { sendContactsToBrevo } from "./brevoContacts/sendContactsToBrevo"
import { obfuscateCollections } from "./database/obfuscateCollections"
import { classifyRomesForDomainesMetiers, classifyRomesForDomainesMetiersAnalyze } from "./domainesMetiers/classifyRomesForDomainesMetiers"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formationsCatalogue/updateParcoursupAndAffelnetInfoOnFormationCatalogue"
import { generateFranceTravailAccess } from "./franceTravail/generateFranceTravailAccess"
import { createJobsCollectionForMetabase } from "./metabase/metabaseJobsCollection"
import { createRoleManagement360 } from "./metabase/metabaseRoleManagement360"
import { blockBadRomeJobsPartners } from "./offrePartenaire/blockBadRomeJobsPartners"
import { blockJobsPartnersWithNaf85 } from "./offrePartenaire/blockJobsPartnersWithNaf85"
import { cancelRemovedJobsPartners } from "./offrePartenaire/cancelRemovedJobsPartners"
import { detectDuplicateJobPartners } from "./offrePartenaire/detectDuplicateJobPartners"
import { expireJobsPartners } from "./offrePartenaire/expireJobsPartners"
import { fillComputedJobsPartners } from "./offrePartenaire/fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./offrePartenaire/importFromComputedToJobsPartners"
import { processKelio } from "./offrePartenaire/kelio/processKelio"
import { processMonster } from "./offrePartenaire/monster/processMonster"
import { processComputedAndImportToJobPartners } from "./offrePartenaire/processJobPartners"
import { processJobPartnersForApi } from "./offrePartenaire/processJobPartnersForApi"
import { rankJobPartners } from "./offrePartenaire/rankJobPartners"
import { removeMissingRecruteursLbaFromRaw } from "./offrePartenaire/recruteur-lba/importRecruteursLbaRaw"
import { exportLbaJobsToS3 } from "./partenaireExport/exportJobsToS3"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./rdv/activateOptoutOnEtablissementAndUpdateReferrersOnETFA"
import { eligibleTrainingsForAppointmentsHistoryWithCatalogue } from "./rdv/eligibleTrainingsForAppointmentsHistoryWithCatalogue"
import { importReferentielOnisep } from "./rdv/importReferentielOnisep"
import { inviteEtablissementAffelnetToPremium } from "./rdv/inviteEtablissementAffelnetToPremium"
import { inviteEtablissementParcoursupToPremium } from "./rdv/inviteEtablissementParcoursupToPremium"
import { inviteEtablissementToOptOut } from "./rdv/inviteEtablissementToOptOut"
import { premiumActivatedReminder } from "./rdv/premiumActivatedReminder"
import { premiumInviteOneShot } from "./rdv/premiumInviteOneShot"
import { removeDuplicateEtablissements } from "./rdv/removeDuplicateEtablissements"
import { resetInvitationDates } from "./rdv/resetInvitationDates"
import { syncEtablissementDates } from "./rdv/syncEtablissementDates"
import { syncEtablissementsAndFormations } from "./rdv/syncEtablissementsAndFormations"
import { cancelOfferJob } from "./recruiters/cancelOfferJob"
import { fixJobExpirationDate } from "./recruiters/fixJobExpirationDateJob"
import { fixRecruiterDataValidation } from "./recruiters/fixRecruiterDataValidationJob"
import { opcoReminderJob } from "./recruiters/opcoReminderJob"
import { updateMissingStartDate } from "./recruiters/updateMissingStartDateJob"
import { updateSiretInfosInError } from "./recruiters/updateSiretInfosInErrorJob"
import { importReferentielRome } from "./referentielRome/referentielRome"

type SimpleJobDefinition = {
  fct: () => Promise<unknown>
  description: string
}

export const SimpleJobDefinition = {
  getFctName(jobDef: SimpleJobDefinition): string {
    return jobDef.fct.name
  },
}

export const simpleJobDefinitions: SimpleJobDefinition[] = [
  {
    fct: exportLbaJobsToS3,
    description: "Export LBA jobs to JSON files on S3",
  },
  {
    fct: obfuscateCollections,
    description: "Pseudonymisation des documents",
  },
  {
    fct: updateMissingStartDate,
    description: "Récupération des geo_coordinates manquants dans la collection Recruiters",
  },
  {
    fct: importReferentielRome,
    description: "import référentiel rome v4 from XML",
  },
  {
    fct: cancelOfferJob,
    description: "Annule les offres pour lesquels la date d'expiration est correspondante à la date actuelle",
  },
  {
    fct: createJobsCollectionForMetabase,
    description: "Permet de créer une collection dédiée aux offres pour metabase",
  },
  {
    fct: createRoleManagement360,
    description: "Crée une collection jointure entre userWithAccounts, roleManagements, cfas et entreprises pour metabase",
  },
  {
    fct: opcoReminderJob,
    description: "Relance les opco avec le nombre d'utilisateur en attente de validation",
  },
  {
    fct: updateSiretInfosInError,
    description: "Remplis les données venant du SIRET pour les utilisateurs ayant eu une erreur pendant l'inscription",
  },
  {
    fct: activateOptoutOnEtablissementAndUpdateReferrersOnETFA,
    description: "Active tous les établissements qui ont souscrits à l'opt-out.",
  },
  {
    fct: inviteEtablissementToOptOut,
    description: "Invite les établissements (via email décisionnaire) à l'opt-out.",
  },
  {
    fct: inviteEtablissementParcoursupToPremium,
    description: "Invite les établissements (via email décisionnaire) au premium (Parcoursup)",
  },
  {
    fct: inviteEtablissementAffelnetToPremium,
    description: "Invite les établissements (via email décisionnaire) au premium (Affelnet)",
  },
  {
    fct: premiumActivatedReminder,
    description: "Envoi un email à tous les établissements premium pour les informer de l'ouverture des voeux sur Parcoursup",
  },
  {
    fct: premiumInviteOneShot,
    description: "Envoi un email à tous les établissements pas encore premium pour les inviter de nouveau",
  },
  {
    fct: syncEtablissementsAndFormations,
    description: "Récupère la liste de toutes les formations du Catalogue et les enregistre.",
  },
  {
    fct: syncEtablissementDates,
    description: "Resynchronise les dates de la collection Etablissement par siret gestionnaire",
  },
  {
    fct: anonymizeUsers,
    description: "anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus d'un an",
  },
  {
    fct: eligibleTrainingsForAppointmentsHistoryWithCatalogue,
    description: "Historise l'egibilité d'une formation à la prise de rendez-vous avec le Catalogue des formations (RCO)",
  },
  {
    fct: importReferentielOnisep,
    description: "Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep",
  },
  {
    fct: removeDuplicateEtablissements,
    description: "Supprime les doublon de la collection Etablissements généré par le script de synchronisation (lié au parallélisme)",
  },
  {
    fct: importCatalogueFormationJob,
    description: "Importe les formations depuis le Catalogue",
  },
  {
    fct: updateParcoursupAndAffelnetInfoOnFormationCatalogue,
    description: "Mise à jour des champs spécifiques de la collection formations catalogue",
  },
  {
    fct: anonymizeApplicantsAndApplications,
    description: "Anonymise toutes les candidatures de plus de an qui ne sont pas déjà anonymisées",
  },
  {
    fct: fixJobExpirationDate,
    description: "Répare les date d'expiration d'offre qui seraient trop dans le futur",
  },
  {
    fct: fixRecruiterDataValidation,
    description: "Répare les data de la collection recruiters",
  },
  {
    fct: anonimizeUsersWithAccounts,
    description: "Anonymize les userrecruteurs qui ne se sont pas connectés depuis plus de 2 ans",
  },
  {
    fct: updateDiplomeMetier,
    description: "Mise à jour des diplômes et romes associés",
  },
  // IMPORT RAW AND COMPUTED JOBS PARTNERS
  {
    fct: processHellowork,
    description: "Importe les offres hellowork dans la collection raw raw & computed",
  },
  {
    fct: processRhAlternance,
    description: "Importe les offres RH Alternance  dans la collection raw & computed",
  },
  {
    fct: processMeteojob,
    description: "Importe les offres Meteojob dans la collection raw & computed",
  },
  {
    fct: processFranceTravail,
    description: "Importe les offres France Travail dans la collection raw & computed",
  },
  {
    fct: processMonster,
    description: "Importe les offres Monster dans la collection raw & computed",
  },
  {
    fct: processKelio,
    description: "Importe les offres Kelio dans la collection raw & computed",
  },
  {
    fct: processPass,
    description: "Importe les offres Pass dans la collection raw & computed",
  },
  // ENRICHIT COMPUTED JOBS PARTNERS
  {
    fct: fillComputedJobsPartners,
    description: "Enrichit la collection computed_jobs_partners avec les données provenant d'API externes",
  },
  // GLOBAL ENRICHMENT FLOW FOR JOBS PARTNERS
  {
    fct: processComputedAndImportToJobPartners,
    description: "Chaîne complète de traitement des jobs_partners",
  },
  // IMPORT COMPUTED TO JOBS PARTNERS
  {
    fct: importFromComputedToJobsPartners,
    description: "Met à jour la collection jobs_partners à partir de computed_jobs_partners",
  },
  // IMPORT COMPUTED RECRUTEURS_LBA TO JOBS PARTNERS
  {
    fct: importRecruteursLbaFromComputedToJobsPartners,
    description: "Met à jour la collection jobs_partners à partir de computed_jobs_partners pour les recruteurs_lba",
  },
  {
    fct: processRecruteursLba,
    description: "Chaîne complète de traitement des entreprises issues de l'algo pour jobs_partners",
  },
  {
    fct: processJobPartnersForApi,
    description: "Chaîne complète de traitement des jobs_partners déposés par API",
  },
  {
    fct: cancelRemovedJobsPartners,
    description: "Met à jour la collection jobs_partners en mettant à 'Annulé' les offres qui ne sont plus dans computed_jobs_partners",
  },
  {
    fct: removeMissingRecruteursLbaFromRaw,
    description: "Met à jour la collection computed_jobs_partners en supprimant les entreprises qui ne sont plus dans raw_recruteurslba",
  },
  {
    fct: classifyFranceTravailJobs,
    description: "Classifie les offres France Travail en fonction de leur contenu",
  },
  {
    fct: processApplications,
    description: "Scanne les virus des pièces jointes et envoie les candidatures. Timeout à 8 minutes.",
  },
  {
    fct: processRecruiterIntentions,
    description: "Emission des intentions des recruteurs.",
  },
  {
    fct: detectDuplicateJobPartners,
    description: "Detect duplicate offers in the computed_jobs_partners collection",
  },
  {
    fct: sendContactsToBrevo,
    description: "Envoi à Brevo la liste des contacts",
  },
  {
    fct: generateSitemap,
    description: "Génère le sitemap pour les offres",
  },
  {
    fct: generateFranceTravailAccess,
    description: "Génère les tokens d'accès à France Travail et les sauvegarde en DB",
  },
  {
    fct: processScheduledRecruiterIntentions,
    description: "Envoi les intentations des recruteurs programmées",
  },
  {
    fct: resetInvitationDates,
    description: "Permet de réinitialiser les dates d'invitation et de refus des établissements pour la prise de rendez-vous",
  },
  {
    fct: rankJobPartners,
    description: "Calcule le rank des computed job partners",
  },
  {
    fct: blockBadRomeJobsPartners,
    description: "Bloque les jobs partners avec des mauvais code ROME",
  },
  {
    fct: blockJobsPartnersWithNaf85,
    description: "Passe les jobs partners en business erreur pour ceux qui ont un naf commençant par 85",
  },
  {
    fct: expireJobsPartners,
    description: "Change le status des offres dont la date d'expiration est dépassée",
  },
  {
    fct: classifyRomesForDomainesMetiers,
    description: "Classifie les fiches ROME pour les domaines métiers",
  },
  {
    fct: classifyRomesForDomainesMetiersAnalyze,
    description: "Analyse les fichiers de sortie de classifyRomesForDomainesMetiers",
  },
  {
    fct: updateRomesForDomainesMetiers,
    description: "Met à jour la correspondance entre les domaines métiers et les fiches romes",
  },
  {
    fct: repriseEnvoiEmailsPRDV,
    description: "Reprise de l'envoi des emails de prise de rendez-vous, job à usage limité",
  },
  {
    fct: sendMiseEnRelation,
    description: "Envoi de proposition de mise en relation avec des CFAs aux recruteurs",
  },
  {
    fct: renvoiMailCreationCompte,
    description: "Envoi les mails de validation de compte",
  },
]
