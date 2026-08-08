import type { z } from "zod"
import anonymizedApplicantModel from "./anonymized-applicant.model.js"
import anonymizedApplicationsModel from "./anonymized-applications.model.js"
import anonymizedAppointmentsModel from "./anonymized-appointments.model.js"
import anonymizedRecruitersModel from "./anonymized-recruiters.model.js"
import anonymizedUsersModel from "./anonymized-users.model.js"
import anonymizedUsersWithAccountsModel from "./anonymized-users-with-accounts.model.js"
import apicallsModel from "./apicalls.model.js"
import applicantModel from "./applicant.model.js"
import applicantEmailLogModel from "./applicant-email-log.model.js"
import applicationsModel from "./applications.model.js"
import appointmentsModel from "./appointments.model.js"
import cacheClassificationModel from "./cache-classification.model.js"
import cacheDiagorienteModel from "./cache-diagoriente.model.js"
import cacheGeolocationModel from "./cache-geolocation.model.js"
import cacheInfosSiretModel from "./cache-infos-siret.model.js"
import cfaModel from "./cfa.model.js"
import type { IModelDescriptor } from "./common.js"
import credentialsModel from "./credentials.model.js"
import customEmailETFAModel from "./custom-email-etfa.model.js"
import diplomesMetiersModel from "./diplomes-metiers.model.js"
import domainesMetiersModel from "./domaines-metiers.model.js"
import elligibleTrainingModel from "./elligible-training.model.js"
import emailBlacklistModel from "./email-blacklist.model.js"
import entrepriseModel from "./entreprise.model.js"
import entreprisesManagedByCfaModel from "./entreprises-managed-by-cfa.model.js"
import etablissementModel from "./etablissement.model.js"
import formationModel from "./formation.model.js"
import franceTravailAccessModel from "./france-travail-access.model.js"
import geolocationsModel from "./geolocations.model.js"
import jobsModel from "./jobs.model.js"
import jobsPartnersModel from "./jobs-partners.model.js"
import jobsPartnersComputedModel from "./jobs-partners-computed.model.js"
import mistralBatchJobsModel from "./mistral-batch-jobs.model.js"
import opcoModel from "./opco.model.js"
import rawApecModel from "./raw-apec.model.js"
import rawAtlasModel from "./raw-atlas.model.js"
import rawDecathlonModel from "./raw-decathlon.model.js"
import rawEdfModel from "./raw-edf.model.js"
import rawEmploiInclusionModel from "./raw-emploi-inclusion.model.js"
import rawEnedisModel from "./raw-enedis.model.js"
import rawEngagementJeunesModel from "./raw-engagement-jeunes.model.js"
import rawEtudiantModel from "./raw-etudiant.model.js"
import rawFranceTravailModel from "./raw-france-travail.model.js"
import rawFranceTravailCEGIDModel from "./raw-france-travail-cegid.model.js"
import rawHelloWorkModel from "./raw-hello-work.model.js"
import rawHelloWorkBuddiModel from "./raw-hello-work-buddi.model.js"
import rawJobteaserModel from "./raw-jobteaser.model.js"
import rawJoobleModel from "./raw-jooble.model.js"
import rawKelioModel from "./raw-kelio.model.js"
import rawLaposteModel from "./raw-laposte.model.js"
import rawLeboncoinModel from "./raw-leboncoin.model.js"
import rawMeteojobModel from "./raw-meteojob.model.js"
import rawMonsterModel from "./raw-monster.model.js"
import rawNosTalentsNosEmploisModel from "./raw-nos-talents-nos-emplois.model.js"
import rawPassModel from "./raw-pass.model.js"
import rawRecruteursLbaModel from "./raw-recruteurs-lba.model.js"
import rawRHAlternanceModel from "./raw-rh-alternance.model.js"
import rawToulouseMetropoleModel from "./raw-toulouse-metropole.model.js"
import rawViteUnEmploiModel from "./raw-vite-un-emploi.model.js"
import recruiterModel from "./recruiter.model.js"
import recruteurLbaUpdateEventModel from "./recruteur-lba-update-event.model.js"
import { referentielCommuneModel } from "./referentiel/communes.model.js"
import referentielEngagementEntrepriseModel from "./referentiel-engagement-entreprise.model.js"
import referentielOnisepModel from "./referentiel-onisep.model.js"
import reportedCompanyModel from "./reported-company.model.js"
import roleManagementModel from "./role-management.model.js"
import roleManagement360Model from "./role-management360.model.js"
import romeModel from "./rome.model.js"
import searchItemsModel from "./search-items.model.js"
import searchItemsKeywordsModel from "./search-items-keywords.model.js"
import searchQueriesModel from "./search-queries.model.js"
import searchSuggestionsModel from "./search-suggestions.model.js"
import searchSynonymsModel from "./search-synonyms.model.js"
import seoDiplomeModel from "./seo-diplome.model.js"
import seoMetierModel from "./seo-metier.model.js"
import seoVilleModel from "./seo-ville.model.js"
import sessionModel from "./session.model.js"
import sitemapModel from "./sitemap.model.js"
import trafficSourcesModel from "./traffic-sources.model.js"
import unsubscribeOFModel from "./unsubscribe-of.model.js"
import unsubscribedLbaCompanyModel from "./unsubscribed-recruteur-lba.model.js"
import userModel from "./user.model.js"
import userWithAccountModel from "./user-with-account.model.js"

const modelDescriptorMap = {
  [searchItemsModel.collectionName]: searchItemsModel,
  [anonymizedApplicantModel.collectionName]: anonymizedApplicantModel,
  [anonymizedApplicationsModel.collectionName]: anonymizedApplicationsModel,
  [anonymizedAppointmentsModel.collectionName]: anonymizedAppointmentsModel,
  [anonymizedRecruitersModel.collectionName]: anonymizedRecruitersModel,
  [anonymizedUsersModel.collectionName]: anonymizedUsersModel,
  [anonymizedUsersWithAccountsModel.collectionName]: anonymizedUsersWithAccountsModel,
  [appointmentsModel.collectionName]: appointmentsModel,
  [apicallsModel.collectionName]: apicallsModel,
  [applicantModel.collectionName]: applicantModel,
  [applicantEmailLogModel.collectionName]: applicantEmailLogModel,
  [applicationsModel.collectionName]: applicationsModel,
  [cacheDiagorienteModel.collectionName]: cacheDiagorienteModel,
  [cacheGeolocationModel.collectionName]: cacheGeolocationModel,
  [cfaModel.collectionName]: cfaModel,
  [cacheClassificationModel.collectionName]: cacheClassificationModel,
  [credentialsModel.collectionName]: credentialsModel,
  [customEmailETFAModel.collectionName]: customEmailETFAModel,
  [diplomesMetiersModel.collectionName]: diplomesMetiersModel,
  [domainesMetiersModel.collectionName]: domainesMetiersModel,
  [elligibleTrainingModel.collectionName]: elligibleTrainingModel,
  [emailBlacklistModel.collectionName]: emailBlacklistModel,
  [entrepriseModel.collectionName]: entrepriseModel,
  [etablissementModel.collectionName]: etablissementModel,
  [formationModel.collectionName]: formationModel,
  [franceTravailAccessModel.collectionName]: franceTravailAccessModel,
  [geolocationsModel.collectionName]: geolocationsModel,
  [jobsModel.collectionName]: jobsModel,
  [jobsPartnersModel.collectionName]: jobsPartnersModel,
  [jobsPartnersComputedModel.collectionName]: jobsPartnersComputedModel,
  [opcoModel.collectionName]: opcoModel,
  [rawDecathlonModel.collectionName]: rawDecathlonModel,
  [rawEdfModel.collectionName]: rawEdfModel,
  [rawEnedisModel.collectionName]: rawEnedisModel,
  [rawEngagementJeunesModel.collectionName]: rawEngagementJeunesModel,
  [rawEmploiInclusionModel.collectionName]: rawEmploiInclusionModel,
  [rawEtudiantModel.collectionName]: rawEtudiantModel,
  [rawHelloWorkModel.collectionName]: rawHelloWorkModel,
  [rawMonsterModel.collectionName]: rawMonsterModel,
  [rawPassModel.collectionName]: rawPassModel,
  [rawRecruteursLbaModel.collectionName]: rawRecruteursLbaModel,
  [rawViteUnEmploiModel.collectionName]: rawViteUnEmploiModel,
  [rawNosTalentsNosEmploisModel.collectionName]: rawNosTalentsNosEmploisModel,
  [rawToulouseMetropoleModel.collectionName]: rawToulouseMetropoleModel,
  [recruteurLbaUpdateEventModel.collectionName]: recruteurLbaUpdateEventModel,
  [referentielOnisepModel.collectionName]: referentielOnisepModel,
  [referentielEngagementEntrepriseModel.collectionName]: referentielEngagementEntrepriseModel,
  [romeModel.collectionName]: romeModel,
  [roleManagementModel.collectionName]: roleManagementModel,
  [roleManagement360Model.collectionName]: roleManagement360Model,
  [sessionModel.collectionName]: sessionModel,
  [unsubscribedLbaCompanyModel.collectionName]: unsubscribedLbaCompanyModel,
  [unsubscribeOFModel.collectionName]: unsubscribeOFModel,
  [userModel.collectionName]: userModel,
  [userWithAccountModel.collectionName]: userWithAccountModel,
  [reportedCompanyModel.collectionName]: reportedCompanyModel,
  [cacheInfosSiretModel.collectionName]: cacheInfosSiretModel,
  [referentielCommuneModel.collectionName]: referentielCommuneModel,
  [rawApecModel.collectionName]: rawApecModel,
  [rawAtlasModel.collectionName]: rawAtlasModel,
  [rawKelioModel.collectionName]: rawKelioModel,
  [rawLaposteModel.collectionName]: rawLaposteModel,
  [rawLeboncoinModel.collectionName]: rawLeboncoinModel,
  [rawJoobleModel.collectionName]: rawJoobleModel,
  [rawJobteaserModel.collectionName]: rawJobteaserModel,
  [rawMeteojobModel.collectionName]: rawMeteojobModel,
  [rawRHAlternanceModel.collectionName]: rawRHAlternanceModel,
  [rawFranceTravailModel.collectionName]: rawFranceTravailModel,
  [rawFranceTravailCEGIDModel.collectionName]: rawFranceTravailCEGIDModel,
  [trafficSourcesModel.collectionName]: trafficSourcesModel,
  [sitemapModel.collectionName]: sitemapModel,
  [searchQueriesModel.collectionName]: searchQueriesModel,
  [searchItemsKeywordsModel.collectionName]: searchItemsKeywordsModel,
  [mistralBatchJobsModel.collectionName]: mistralBatchJobsModel,
  [searchSuggestionsModel.collectionName]: searchSuggestionsModel,
  [searchSynonymsModel.collectionName]: searchSynonymsModel,
  [seoVilleModel.collectionName]: seoVilleModel,
  [entreprisesManagedByCfaModel.collectionName]: entreprisesManagedByCfaModel,
  [recruiterModel.collectionName]: recruiterModel,
  [seoDiplomeModel.collectionName]: seoDiplomeModel,
  [seoMetierModel.collectionName]: seoMetierModel,
  [rawHelloWorkBuddiModel.collectionName]: rawHelloWorkBuddiModel,
} as const satisfies Record<string, IModelDescriptor>

export const modelDescriptors = Object.values(modelDescriptorMap) as (typeof modelDescriptorMap)[keyof typeof modelDescriptorMap][] satisfies IModelDescriptor[]

export type CollectionName = keyof typeof modelDescriptorMap

export type IDocument<Name extends CollectionName> = z.output<(typeof modelDescriptorMap)[Name]["zod"]>
