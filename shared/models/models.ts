import { z } from "zod"

import anonymizedApplicantModel from "./anonymizedApplicant.model"
import anonymizedApplicationsModel from "./anonymizedApplications.model"
import anonymizedAppointmentsModel from "./anonymizedAppointments.model"
import anonymizedRecruitersModel from "./anonymizedRecruiters.model"
import anonymizedUsersModel from "./anonymizedUsers.model"
import anonymizedUsersWithAccountsModel from "./anonymizedUsersWithAccounts.model"
import apicallsModel from "./apicalls.model"
import applicantModel from "./applicant.model"
import applicantEmailLogModel from "./applicantEmailLog.model"
import applicationsModel from "./applications.model"
import appointmentsModel from "./appointments.model"
import cacheGeolocationModel from "./cacheGeolocation.model"
import cacheInfosSiretModel from "./cacheInfosSiret.model"
import cacheRomeoModel from "./cacheRomeo.model"
import cfaModel from "./cfa.model"
import { IModelDescriptor } from "./common"
import credentialsModel from "./credentials.model"
import customEmailETFAModel from "./customEmailETFA.model"
import diplomesMetiersModel from "./diplomesMetiers.model"
import domainesMetiersModel from "./domainesMetiers.model"
import elligibleTrainingModel from "./elligibleTraining.model"
import elligibleTrainingHistoryModel from "./elligibleTrainingHistory.model"
import emailBlacklistModel from "./emailBlacklist.model"
import entrepriseModel from "./entreprise.model"
import etablissementModel from "./etablissement.model"
import formationModel from "./formation.model"
import franceTravailAccessModel from "./franceTravailAccess.model"
import geolocationsModel from "./geolocations.model"
import jobsModel from "./jobs.model"
import jobsPartnersModel from "./jobsPartners.model"
import jobsPartnersComputedModel from "./jobsPartnersComputed.model"
import opcoModel from "./opco.model"
import optoutModel from "./optout.model"
import rawFranceTravail from "./rawFranceTravail.model"
import rawHelloWorkModel from "./rawHelloWork.model"
import rawKelioModel from "./rawKelio.model"
import rawRHAlternanceModel from "./rawRHAlternance.model"
import recruiterModel from "./recruiter.model"
import recruiterIntentionMailModel from "./recruiterIntentionMail.model"
import lbaCompanyModel from "./recruteurLba.model"
import lbaCompanyLegacyModel from "./recruteurLbaLegacy.model"
import recruteurLbaUpdateEventModel from "./recruteurLbaUpdateEvent.model"
import { referentielCommuneModel } from "./referentiel/communes.model"
import referentielOnisepModel from "./referentielOnisep.model"
import referentielOpcoModel from "./referentielOpco.model"
import reportedCompanyModel from "./reportedCompany.model"
import roleManagementModel from "./roleManagement.model"
import roleManagement360Model from "./roleManagement360.model"
import romeModel from "./rome.model"
import sessionModel from "./session.model"
import sitemapModel from "./sitemap.model"
import trafficSourcesModel from "./trafficSources.model"
import unsubscribedLbaCompanyModel from "./unsubscribedRecruteurLba.model"
import unsubscribeOFModel from "./unsubscribeOF.model"
import userModel from "./user.model"
import userWithAccountModel from "./userWithAccount.model"

const modelDescriptorMap = {
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
  [cacheRomeoModel.collectionName]: cacheRomeoModel,
  [cacheGeolocationModel.collectionName]: cacheGeolocationModel,
  [cfaModel.collectionName]: cfaModel,
  [credentialsModel.collectionName]: credentialsModel,
  [customEmailETFAModel.collectionName]: customEmailETFAModel,
  [diplomesMetiersModel.collectionName]: diplomesMetiersModel,
  [domainesMetiersModel.collectionName]: domainesMetiersModel,
  [elligibleTrainingModel.collectionName]: elligibleTrainingModel,
  [elligibleTrainingHistoryModel.collectionName]: elligibleTrainingHistoryModel,
  [emailBlacklistModel.collectionName]: emailBlacklistModel,
  [entrepriseModel.collectionName]: entrepriseModel,
  [etablissementModel.collectionName]: etablissementModel,
  [formationModel.collectionName]: formationModel,
  [franceTravailAccessModel.collectionName]: franceTravailAccessModel,
  [geolocationsModel.collectionName]: geolocationsModel,
  [jobsModel.collectionName]: jobsModel,
  [jobsPartnersModel.collectionName]: jobsPartnersModel,
  [jobsPartnersComputedModel.collectionName]: jobsPartnersComputedModel,
  [lbaCompanyModel.collectionName]: lbaCompanyModel,
  [lbaCompanyLegacyModel.collectionName]: lbaCompanyLegacyModel,
  [opcoModel.collectionName]: opcoModel,
  [optoutModel.collectionName]: optoutModel,
  [rawHelloWorkModel.collectionName]: rawHelloWorkModel,
  [recruiterModel.collectionName]: recruiterModel,
  [recruiterIntentionMailModel.collectionName]: recruiterIntentionMailModel,
  [recruteurLbaUpdateEventModel.collectionName]: recruteurLbaUpdateEventModel,
  [referentielOnisepModel.collectionName]: referentielOnisepModel,
  [referentielOpcoModel.collectionName]: referentielOpcoModel,
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
  [rawKelioModel.collectionName]: rawKelioModel,
  [rawRHAlternanceModel.collectionName]: rawRHAlternanceModel,
  [rawFranceTravail.collectionName]: rawFranceTravail,
  [trafficSourcesModel.collectionName]: trafficSourcesModel,
  [sitemapModel.collectionName]: sitemapModel,
} as const satisfies Record<string, IModelDescriptor>

export const modelDescriptors = Object.values(modelDescriptorMap) as (typeof modelDescriptorMap)[keyof typeof modelDescriptorMap][] satisfies IModelDescriptor[]

export type CollectionName = keyof typeof modelDescriptorMap

export type IDocument<Name extends CollectionName> = z.output<(typeof modelDescriptorMap)[Name]["zod"]>
