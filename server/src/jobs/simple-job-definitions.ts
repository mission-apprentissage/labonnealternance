import { processEdf } from "@/jobs/offre-partenaire/edf/process-edf"
import { processEnedis } from "@/jobs/offre-partenaire/enedis/process-enedis"
import { processMissingRomeAndImportToJobPartners } from "@/jobs/offre-partenaire/process-missing-rome-and-import-to-job-partners"
import { analyzeCfaBlockList } from "@/jobs/one-time-job/analyze-cfa-block-list"
import { processScheduledRecruiterIntentions } from "@/services/application.service"
import { reviewJobPartnersClassification } from "@/services/cache-classification.service"
import { applyPendingClassificationBatches, submitClassificationBatch } from "@/services/classification/classification-mistral-batch.service"
import { compareLabAndMistralAgainstHumanVerification, compareLabAndMistralClassification } from "@/services/classification/compare-lab-mistral-classification.service"
import { controlSearchItemsDrift, syncSearchItemsDelta } from "@/services/search/search-items.service"
import { applyPendingMistralBatches, generateSearchItemsKeywordsContinuous, submitSearchItemsKeywordsBatch } from "@/services/search/search-items-keywords.service"
import { generateSitemap } from "@/services/sitemap.service"
import { anonimizeUsersWithAccounts } from "./anonymization/anonimize-users-with-accounts"
import { anonymizeApplicantsAndApplications } from "./anonymization/anonymize-applicant-and-applications"
import { anonymizeReportedReasons } from "./anonymization/anonymize-reported-reasons"
import { anonymizeUsers } from "./anonymization/anonymize-users"
import { removeBrevoContacts } from "./anonymization/remove-brevo-contacts"
import { processApplications } from "./applications/process-applications"
import { processRecruiterIntentions } from "./applications/process-recruiter-intentions"
import { obfuscateCollections } from "./database/obfuscate-collections"
import { updateDiplomeMetier } from "./diplomes-metiers/update-diplomes-metiers"
import { buildMappingRomeRNCP } from "./domaines-metiers/build-mapping-rome-rncp"
import {
  analyzeRemovedRomes,
  classifyRomesForDomainesMetiers,
  classifyRomesForDomainesMetiersAnalyze,
  findDomainesMetiersIncoherents,
} from "./domaines-metiers/classify-romes-for-domaines-metiers"
import { importFichesRncp } from "./domaines-metiers/import-fiches-rncp"
import { updateRomesForDomainesMetiers } from "./domaines-metiers/update-romes-for-domaines-metiers"
import { validateDomaineMetiers } from "./domaines-metiers/validate-domaine-metiers"
import {
  refreshEntrepriseEngagementJobsPartners,
  refreshReferentielEngagementFranceTravail,
  refreshReferentielEtEntrepriseEngagement,
} from "./engagement-handicap/refresh-entreprise-engagement-jobs-partners"
import { importCatalogueFormationJob } from "./formations-catalogue/formations-catalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formations-catalogue/update-parcoursup-and-affelnet-info-on-formation-catalogue"
import { generateFranceTravailAccess } from "./france-travail/generate-france-travail-access"
import { createRoleManagement360 } from "./metabase/metabase-role-management360"
import { sendMiseEnRelation } from "./mise-en-relation/send-mise-en-relation"
import { processApec } from "./offre-partenaire/apec/process-apec"
import { processAtlas, processMeteojob, processNosTalentsNosEmplois, processToulouseMetropole, processViteUnEmploi } from "./offre-partenaire/clever-connect/process-clever-connect"
import { closeJobsPartnersOnApplicationThreshold } from "./offre-partenaire/close-jobs-partners-on-application-threshold"
import { processDecathlon } from "./offre-partenaire/decathlon/import-decathlon"
import { detectClassificationJobsPartners } from "./offre-partenaire/detect-classification-jobs-partners"
import { processEmploiInclusion } from "./offre-partenaire/emploi-inclusion/import-emploi-inclusion"
import { processEngagementJeunes } from "./offre-partenaire/engagement-jeunes/import-engagement-jeunes"
import { processEtudiant } from "./offre-partenaire/etudiant/process-etudiant"
import { expireJobsPartners } from "./offre-partenaire/expire-jobs-partners"
import { fillEntrepriseEngagementJobsPartners } from "./offre-partenaire/fill-entreprise-engagement-jobs-partners"
import { fillLbaUrl, renewLbaUrl } from "./offre-partenaire/fill-lba-url"
import { processFranceTravail } from "./offre-partenaire/france-travail/process-france-travail"
import { processFranceTravailCEGID } from "./offre-partenaire/france-travail-CEGID/import-france-travail-cegid"
import { deduplicateHellowork } from "./offre-partenaire/hellowork-merge/deduplicate-hellowork"
import { processHellowork } from "./offre-partenaire/hellowork-merge/process-hellowork"
import { importFromComputedToJobsPartners } from "./offre-partenaire/import-from-computed-to-jobs-partners"
import { processJobteaser } from "./offre-partenaire/jobteaser/process-jobteaser"
import { processJooble } from "./offre-partenaire/jooble/process-jooble"
import { processKelio } from "./offre-partenaire/kelio/process-kelio"
import { processLaposte } from "./offre-partenaire/laposte/process-laposte"
import { processLeboncoin } from "./offre-partenaire/leboncoin/process-leboncoin"
import { processPass } from "./offre-partenaire/pass/process-pass"
import { processFillRomeStandalone } from "./offre-partenaire/process-fill-rome-standalone"
import {
  cancelRemovedJobsPartnersFlux,
  detectDuplicateJobPartnersFlux,
  fillComputedJobsPartnersFlux,
  processComputedAndImportToJobPartners,
  validateComputedJobPartnersFlux,
} from "./offre-partenaire/process-job-partners"
import { processJobPartnersForApi, processJobPartnersWithFilter } from "./offre-partenaire/process-job-partners-for-api"
import { removeMissingRecruteursLbaFromComputedJobPartners } from "./offre-partenaire/recruteur-lba/import-recruteurs-lba-raw"
import { cancelRemovedJobsPartnersRecruteursLba, processRecruteursLba, processRecruteursLbaRawToEnd } from "./offre-partenaire/recruteur-lba/process-recruteurs-lba"
import { processRhAlternance } from "./offre-partenaire/rh-alternance/process-rh-alternance"
import { analyzeClosedCompanies } from "./one-time-job/analyze-closed-companies"
import { cleanClosedCompanies } from "./one-time-job/clean-closed-companies"
import { renvoiMailCreationCompte } from "./one-time-job/renvoi-mail-creation-compte"
import { exportFileForAlgo } from "./partenaire-export/export-blacklist-algo"
import { sendContactsToBrevo } from "./partenaire-export/export-contacts-to-brevo"
import { exportLbaJobsToS3 } from "./partenaire-export/export-jobs-to-s3"
import { exportRecruteursToBrevo } from "./partenaire-export/export-recruters-to-brevo"
import { exportJobsToFranceTravail } from "./partenaire-export/export-to-france-travail"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./rdv/activate-optout-on-etablissement-and-update-referrers-on-etfa"
import { importReferentielOnisep } from "./rdv/import-referentiel-onisep"
import { inviteEtablissementAffelnetToPremium, inviteEtablissementAffelnetToPremiumBypassDate } from "./rdv/invite-etablissement-affelnet-to-premium"
import { inviteEtablissementAffelnetToPremiumFollowUpCli } from "./rdv/invite-etablissement-affelnet-to-premium-follow-up"
import { inviteEtablissementParcoursupToPremium, inviteEtablissementParcoursupToPremiumBypassDate } from "./rdv/invite-etablissement-parcoursup-to-premium"
import { inviteEtablissementParcoursupToPremiumFollowUpCli } from "./rdv/invite-etablissement-parcoursup-to-premium-follow-up"
import { inviteEtablissementToOptOut } from "./rdv/invite-etablissement-to-opt-out"
import { premiumActivatedReminder, premiumActivatedReminderAffelnet } from "./rdv/premium-activated-reminder"
import { removeDuplicateEtablissements } from "./rdv/remove-duplicate-etablissements"
import { removeEligibleTrainingsForAppointmentsNotInCatalogue } from "./rdv/remove-eligible-trainings-for-appointments-not-in-catalogue"
import { repriseEnvoiEmailsPRDV } from "./rdv/reprise-envoi-prdv"
import { resetInvitationDates } from "./rdv/reset-invitation-dates"
import { syncEtablissementDates } from "./rdv/sync-etablissement-dates"
import { syncEtablissementsAndFormations } from "./rdv/sync-etablissements-and-formations"
import { opcoReminderJob } from "./recruiters/opco-reminder-job"
import { updateSiretInfosInError } from "./recruiters/update-siret-infos-in-error-job"
import { importReferentielRome } from "./referentiel-rome/referentiel-rome"
import { analyzeSearchQueries } from "./search/analyze-search-queries"
import { fillSearchItemsCollection } from "./search/generate-search-items-collection"
import { updateSEO } from "./seo/update-seo"

type SimpleJobDefinition = {
  fct: (payload?: any) => Promise<unknown>
  description: string
  /** Options commander supplémentaires (transmises dans le payload du job) — ex. `--since <date>`. */
  cliOptions?: { flags: string; description: string }[]
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
    fct: importReferentielRome,
    description: "import référentiel rome v4 from XML",
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
    fct: inviteEtablissementParcoursupToPremiumBypassDate,
    description: "Invite les établissements (via email décisionnaire) au premium (Parcoursup) sans tenir compte de la période d'invitation",
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
    fct: premiumActivatedReminderAffelnet,
    description: "Envoi un email à tous les établissements premium Affelnet pour les informer de l'ouverture des voeux sur Affelnet",
  },
  {
    fct: inviteEtablissementParcoursupToPremiumFollowUpCli,
    description: "Relance les établissements (via email décisionnaire) au premium (Parcoursup) sans tenir compte de la date d'invitation",
  },
  {
    fct: inviteEtablissementAffelnetToPremiumBypassDate,
    description: "Invite les établissements (via email décisionnaire) au premium (Affelnet) sans tenir compte de la période d'invitation",
  },
  {
    fct: inviteEtablissementAffelnetToPremiumFollowUpCli,
    description: "Relance les établissements (via email décisionnaire) au premium (Affelnet) sans tenir compte de la date d'invitation",
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
    fct: removeEligibleTrainingsForAppointmentsNotInCatalogue,
    description: "Supprime les formations éligibles à la prise de rendez-vous absentes du catalogue des formations (RCO)",
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
    fct: anonymizeReportedReasons,
    description: "Anonymise les raisons pour les signalements d'offre de plus d'un (1) an",
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
    fct: processKelio,
    description: "Importe les offres Kelio dans la collection raw & computed",
  },
  {
    fct: processLaposte,
    description: "Importe les offres La Poste dans la collection raw & computed",
  },
  {
    fct: processLeboncoin,
    description: "Importe les offres Le Bon Coin dans la collection raw & computed",
  },
  {
    fct: processJobteaser,
    description: "Importe les offres Jobteaser dans la collection raw & computed",
  },
  {
    fct: processJooble,
    description: "Importe les offres Jooble dans la collection raw & computed",
  },
  {
    fct: processPass,
    description: "Importe les offres Pass dans la collection raw & computed",
  },
  {
    fct: processAtlas,
    description: "Importe les offres Atlas dans la collection raw & computed",
  },
  {
    fct: processViteUnEmploi,
    description: "Importe les offres Vite un Emploi  dans la collection raw & computed",
  },
  {
    fct: processNosTalentsNosEmplois,
    description: "Importe les offres Nos Talents Nos Emplois dans la collection raw & computed",
  },
  {
    fct: processToulouseMetropole,
    description: "Importe les offres Toulouse Métropole dans la collection raw & computed",
  },
  // ENRICHIT COMPUTED JOBS PARTNERS
  {
    fct: fillComputedJobsPartnersFlux,
    description: "Enrichit la collection computed_jobs_partners (partenaires du flux uniquement) avec les données provenant d'API externes",
  },
  // GLOBAL ENRICHMENT FLOW FOR JOBS PARTNERS
  {
    fct: processComputedAndImportToJobPartners,
    description: "Chaîne complète de traitement des jobs_partners",
  },
  // PROCESS ROMMAGE STANDALONE
  {
    fct: processFillRomeStandalone,
    description: "Chaîne complète de traitement des romes pour les jobs_partners",
  },
  // IMPORT COMPUTED TO JOBS PARTNERS
  {
    fct: importFromComputedToJobsPartners,
    description: "Met à jour la collection jobs_partners à partir de computed_jobs_partners",
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
    fct: removeMissingRecruteursLbaFromComputedJobPartners,
    description: "Met à jour la collection computed_jobs_partners en supprimant les entreprises qui ne sont plus dans raw_recruteurslba",
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
    fct: expireJobsPartners,
    description: "Change le status des offres dont la date d'expiration est dépassée",
  },
  {
    fct: closeJobsPartnersOnApplicationThreshold,
    description: "Clôture les offres jobs_partners ayant atteint le seuil de 80 candidatures",
    cliOptions: [{ flags: "--threshold <n>", description: "Seuil de candidatures à utiliser pour ce run (défaut 80, utile pour tester en preview)" }],
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
    fct: findDomainesMetiersIncoherents,
    description: "Analyse les incohérences dans la collection domainesmetiers",
  },
  {
    fct: exportJobsToFranceTravail,
    description: "Envoie les offres LBA à France Travail",
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
  {
    fct: fillSearchItemsCollection,
    description: "Génère/met à jour la collection search_items (formations, jobs, recruteurs) pour MongoDB Search",
  },
  {
    fct: generateSearchItemsKeywordsContinuous,
    description: "Génère les mots-clés des search_items sans keywords : cache puis API Mistral immédiate (plafonné par run)",
    cliOptions: [{ flags: "--limit <n>", description: "Plafond d'appels API immédiats pour ce run (défaut 300)" }],
  },
  {
    fct: submitSearchItemsKeywordsBatch,
    description: "Soumet un batch Mistral de génération de keywords (recruteurs par défaut, --recruteursOnly false pour tout), suivi dans mistral_batch_jobs",
    cliOptions: [{ flags: "--recruteursOnly <bool>", description: "false pour soumettre tous les types de docs (défaut : recruteurs_lba uniquement)" }],
  },
  {
    fct: applyPendingMistralBatches,
    description: "Ramasse les batchs Mistral keywords terminés (téléchargement + application au cache)",
  },
  {
    fct: syncSearchItemsDelta,
    description: "Synchronise vers search_items les jobs_partners modifiés récemment (updated_at, fenêtre 30 min par défaut)",
    cliOptions: [{ flags: "--since <date>", description: "Borne basse ISO 8601 des updated_at à synchroniser (défaut : now − 30 min)" }],
  },
  {
    fct: controlSearchItemsDrift,
    description: "Contrôle la dérive jobs_partners ↔ search_items et alerte Slack en cas d'écart",
  },
  {
    fct: analyzeSearchQueries,
    description: "Analyse les recherches utilisateurs (search_queries) et enrichit suggestions & synonymes (critères + Mistral)",
  },
  {
    fct: analyzeClosedCompanies,
    description: "analyze les recruiters dont l'entreprise a fermé. Le script suppose que la collection cache_siret est remplie au mieux",
  },
  {
    fct: removeBrevoContacts,
    description: "Anonymise les contacts Brevo dont la date de creation est supérieure à 2 ans",
  },
  {
    fct: exportFileForAlgo,
    description: "Export des données pour l'algorithme des recruteurs",
  },
  {
    fct: exportRecruteursToBrevo,
    description: "Export des données recruteurs sur Brevo",
  },
  {
    fct: updateSEO,
    description: "Met à jour les données calculées pour le SEO",
  },
  {
    fct: processDecathlon,
    description: "Import du flux decathlon jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: processEdf,
    description: "Import du flux EDF jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: processEnedis,
    description: "Import du flux Enedis jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: analyzeRemovedRomes,
    description: "Analyse les codes ROME supprimés ou modifiés entre les versions du référentiel",
  },
  {
    fct: fillLbaUrl,
    description: "Remplit le champ lba_url dans la collection jobs_partners",
  },
  {
    fct: renewLbaUrl,
    description: "Renouvelle le champ lba_url dans la collection jobs_partners",
  },
  {
    fct: cancelRemovedJobsPartnersFlux,
    description: "Annule les offres des partenaires traités par flux absentes du flux source",
  },
  {
    fct: detectDuplicateJobPartnersFlux,
    description: "Détecte les doublons dans computed_jobs_partners pour les partenaires du flux",
  },
  {
    fct: validateComputedJobPartnersFlux,
    description: "Valide les computed_jobs_partners pour les partenaires du flux",
  },
  {
    fct: cancelRemovedJobsPartnersRecruteursLba,
    description: "Annule les offres recruteurs LBA absentes du flux source",
  },
  {
    fct: processRecruteursLbaRawToEnd,
    description: "Import des recruteurs LBA de la collection raw à la collection jobs_partners",
  },
  {
    fct: processFranceTravailCEGID,
    description: "Import du flux France Travail CEGID jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: processEngagementJeunes,
    description: "Import du flux Engagement Jeunes jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: processEmploiInclusion,
    description: "Import du flux Emploi Inclusion jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: processEtudiant,
    description: "Import du flux Etudiant jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: importFichesRncp,
    description: "Import des fichers RNCP dans la base de données",
  },
  {
    fct: buildMappingRomeRNCP,
    description: "Convertit les fiches RNCP en un mapping ROME => RNCP",
  },
  {
    fct: validateDomaineMetiers,
    description: "Validation des données domainesmetiers",
  },
  {
    fct: fillEntrepriseEngagementJobsPartners,
    description: "Mise à jour des handi-engagement des offres actives",
  },
  {
    fct: refreshReferentielEngagementFranceTravail,
    description: "Rafraîchissement du référentiel d'engagement handicap depuis France Travail",
  },
  {
    fct: refreshEntrepriseEngagementJobsPartners,
    description: "Rafraîchissement du champ contract_is_disabled_elligible pour toutes les offres actives de jobs_partners",
  },
  {
    fct: refreshReferentielEtEntrepriseEngagement,
    description: "Rafraîchissement du référentiel d'engagement handicap et des offres actives de jobs_partners",
  },
  {
    fct: cleanClosedCompanies,
    description: "Traite les recruteurs dont l'entreprise a fermé en les archivant et en désactivant les comptes associés",
  },
  {
    fct: processApec,
    description: "Import du flux APEC jusqu'à la collection computed_jobs_partners",
  },
  {
    fct: detectClassificationJobsPartners,
    description: "Analyse la classification des offres partenaires",
  },
  {
    fct: processJobPartnersWithFilter,
    description: "Ré-exécute la chaîne de traitement des jobs_partners pour un filtre donné (ex. reprise après classification batch)",
  },
  {
    fct: submitClassificationBatch,
    description: "Soumet un batch Mistral de classification jobs_partners pour un filtre donné, suivi dans mistral_batch_jobs",
  },
  {
    fct: applyPendingClassificationBatches,
    description: "Ramasse les batchs Mistral de classification jobs_partners terminés (téléchargement + application + reprise du pipeline)",
  },
  {
    fct: compareLabAndMistralClassification,
    description: "Compare sur un échantillon de cache_classification les décisions Lab (déjà stockées) et Mistral, sans rien modifier",
    cliOptions: [{ flags: "--sampleSize <n>", description: "Taille de l'échantillon comparé (défaut 200)" }],
  },
  {
    fct: compareLabAndMistralAgainstHumanVerification,
    description: "Compare Lab et Mistral contre une vraie vérité terrain (cache_classification.human_verification déjà corrigé à la main), en vrai batching Mistral (lots de 50)",
    cliOptions: [{ flags: "--limit <n>", description: "Nombre max d'entrées human_verification comparées (défaut 5000)" }],
  },
  {
    fct: reviewJobPartnersClassification,
    description:
      "Corrige manuellement en masse la classification d'offres d'un même partenaire (complète l'écran admin, qui traite un id à la fois) et republie/dépublie en conséquence",
    cliOptions: [
      { flags: "--classification <publish|unpublish>", description: "Classification humaine à appliquer" },
      { flags: "--partnerLabel <label>", description: "Partenaire concerné (ex. Hellowork)" },
      { flags: "--partnerJobIds <ids>", description: "Liste de partner_job_id séparés par des virgules" },
    ],
  },
  {
    fct: deduplicateHellowork,
    description: "Déduplique les 2 flux Hellowork",
  },
  {
    fct: processHellowork,
    description: "Importe les offres des 2 flux Hellowork dans computed_jobs_partners",
  },
  {
    fct: analyzeCfaBlockList,
    description: "",
  },
  {
    fct: processMissingRomeAndImportToJobPartners,
    description: "Complète les codes ROME manquants des offres partenaires puis les importe dans jobs_partners",
  },
]
