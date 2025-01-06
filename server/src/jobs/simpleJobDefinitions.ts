import { generateSitemap } from "@/services/sitemap.service"

import { anonymizeApplicantsAndApplications } from "./anonymization/anonymizeApplicantAndApplications"
import { anonimizeUsersWithAccounts } from "./anonymization/anonymizeUserRecruteurs"
import { anonymizeUsers } from "./anonymization/anonymizeUsers"
import fixApplications from "./applications/fixApplications"
import { processApplications } from "./applications/processApplications"
import { sendContactsToBrevo } from "./brevoContacts/sendContactsToBrevo"
import { obfuscateCollections } from "./database/obfuscateCollections"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formationsCatalogue/updateParcoursupAndAffelnetInfoOnFormationCatalogue"
import { createJobsCollectionForMetabase } from "./metabase/metabaseJobsCollection"
import { createRoleManagement360 } from "./metabase/metabaseRoleManagement360"
import { cancelRemovedJobsPartners } from "./offrePartenaire/cancelRemovedJobsPartners"
import { detectDuplicateJobPartners } from "./offrePartenaire/detectDuplicateJobPartners"
import { fillComputedJobsPartners } from "./offrePartenaire/fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./offrePartenaire/importFromComputedToJobsPartners"
import { importHelloWorkRaw, importHelloWorkToComputed } from "./offrePartenaire/importHelloWork"
import { importKelio } from "./offrePartenaire/importKelio"
import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./offrePartenaire/importRHAlternance"
import { processJobPartners } from "./offrePartenaire/processJobPartners"
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
    fct: fixApplications,
    description: "Répare les adresses emails comportant des caractères erronés dans la collection applications",
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
    fct: importHelloWorkRaw,
    description: "Importe les offres hellowork dans la collection raw",
  },
  {
    fct: importHelloWorkToComputed,
    description: "Importe les offres hellowork depuis raw vers computed",
  },
  {
    fct: importRHAlternanceRaw,
    description: "Importe les offres RHAlternance dans la collection raw",
  },
  {
    fct: importRHAlternanceToComputed,
    description: "Importe les offres RHAlternance depuis raw vers computed",
  },
  {
    fct: importKelio,
    description: "Importe les offres kelio",
  },
  {
    fct: importFromComputedToJobsPartners,
    description: "Met à jour la collection jobs_partners à partir de computed_jobs_partners",
  },
  {
    fct: cancelRemovedJobsPartners,
    description: "Met à jour la collection jobs_partners en mettant à 'Annulé' les offres qui ne sont plus dans computed_jobs_partners",
  },
  {
    fct: processApplications,
    description: "Scanne les virus des pièces jointes et envoie les candidatures. Timeout à 8 minutes.",
  },
  {
    fct: fillComputedJobsPartners,
    description: "Enrichit la collection computed_jobs_partners avec les données provenant d'API externes",
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
    fct: processJobPartners,
    description: "Chaîne complète de traitement des jobs_partners",
  },
  {
    fct: resetInvitationDates,
    description: "Permet de réinitialiser les dates d'invitation et de refus des établissements pour la prise de rendez-vous",
  },
]
