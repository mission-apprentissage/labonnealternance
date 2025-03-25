import { z } from "zod"

import anonymizedApplicantModel from "./anonymizedApplicant.model.js"
import anonymizedApplicationsModel from "./anonymizedApplications.model.js"
import anonymizedAppointmentsModel from "./anonymizedAppointments.model.js"
import anonymizedRecruitersModel from "./anonymizedRecruiters.model.js"
import anonymizedUsersModel from "./anonymizedUsers.model.js"
import anonymizedUsersWithAccountsModel from "./anonymizedUsersWithAccounts.model.js"
import apicallsModel from "./apicalls.model.js"
import applicantModel from "./applicant.model.js"
import applicantEmailLogModel from "./applicantEmailLog.model.js"
import applicationsModel from "./applications.model.js"
import appointmentsModel from "./appointments.model.js"
import cacheGeolocationModel from "./cacheGeolocation.model.js"
import cacheInfosSiretModel from "./cacheInfosSiret.model.js"
import cacheRomeoModel from "./cacheRomeo.model.js"
import cfaModel from "./cfa.model.js"
import { IModelDescriptor } from "./common.js"
import credentialsModel from "./credentials.model.js"
import customEmailETFAModel from "./customEmailETFA.model.js"
import diplomesMetiersModel from "./diplomesMetiers.model.js"
import domainesMetiersModel from "./domainesMetiers.model.js"
import elligibleTrainingModel from "./elligibleTraining.model.js"
import elligibleTrainingHistoryModel from "./elligibleTrainingHistory.model.js"
import emailBlacklistModel from "./emailBlacklist.model.js"
import entrepriseModel from "./entreprise.model.js"
import etablissementModel from "./etablissement.model.js"
import formationModel from "./formation.model.js"
import franceTravailAccessModel from "./franceTravailAccess.model.js"
import geolocationsModel from "./geolocations.model.js"
import jobsModel from "./jobs.model.js"
import jobsPartnersModel from "./jobsPartners.model.js"
import jobsPartnersComputedModel from "./jobsPartnersComputed.model.js"
import opcoModel from "./opco.model.js"
import optoutModel from "./optout.model.js"
import rawFranceTravail from "./rawFranceTravail.model.js"
import rawHelloWorkModel from "./rawHelloWork.model.js"
import rawKelioModel from "./rawKelio.model.js"
import rawMeteojobModel from "./rawMeteojob.model.js"
import rawPassModel from "./rawPass.model.js"
import rawRecruteursLbaModel from "./rawRecruteursLba.model.js"
import rawRHAlternanceModel from "./rawRHAlternance.model.js"
import recruiterModel from "./recruiter.model.js"
import lbaCompanyLegacyModel from "./recruteurLbaLegacy.model.js"
import recruteurLbaUpdateEventModel from "./recruteurLbaUpdateEvent.model.js"
import { referentielCommuneModel } from "./referentiel/communes.model.js"
import referentielOnisepModel from "./referentielOnisep.model.js"
import referentielOpcoModel from "./referentielOpco.model.js"
import reportedCompanyModel from "./reportedCompany.model.js"
import roleManagementModel from "./roleManagement.model.js"
import roleManagement360Model from "./roleManagement360.model.js"
import romeModel from "./rome.model.js"
import sessionModel from "./session.model.js"
import sitemapModel from "./sitemap.model.js"
import trafficSourcesModel from "./trafficSources.model.js"
import unsubscribedLbaCompanyModel from "./unsubscribedRecruteurLba.model.js"
import unsubscribeOFModel from "./unsubscribeOF.model.js"
import userModel from "./user.model.js"
import userWithAccountModel from "./userWithAccount.model.js"

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
  [lbaCompanyLegacyModel.collectionName]: lbaCompanyLegacyModel,
  [opcoModel.collectionName]: opcoModel,
  [optoutModel.collectionName]: optoutModel,
  [rawHelloWorkModel.collectionName]: rawHelloWorkModel,
  [rawPassModel.collectionName]: rawPassModel,
  [rawRecruteursLbaModel.collectionName]: rawRecruteursLbaModel,
  [recruiterModel.collectionName]: recruiterModel,
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
  [rawMeteojobModel.collectionName]: rawMeteojobModel,
  [rawRHAlternanceModel.collectionName]: rawRHAlternanceModel,
  [rawFranceTravail.collectionName]: rawFranceTravail,
  [trafficSourcesModel.collectionName]: trafficSourcesModel,
  [sitemapModel.collectionName]: sitemapModel,
} as const satisfies Record<string, IModelDescriptor>

export const modelDescriptors = Object.values(modelDescriptorMap) as (typeof modelDescriptorMap)[keyof typeof modelDescriptorMap][] satisfies IModelDescriptor[]

export type CollectionName = keyof typeof modelDescriptorMap

export type IDocument<Name extends CollectionName> = z.output<(typeof modelDescriptorMap)[Name]["zod"]>
